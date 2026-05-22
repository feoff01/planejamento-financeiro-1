import { DiagnosticoInput } from "../domain/diagnosticoSchemas";
import { DiagnosticoRepository } from "../repositories/DiagnosticoRepository";
import { CarteiraIdealRepository } from "../repositories/CarteiraIdealRepository";
import * as Engine from "./CarteiraIdealEngine";
import { Asset, Client, Goal } from "../domain/carteiraIdealSchemas";
import { OutputGenericoNarrativeService } from "./OutputGenericoNarrativeService";

type Perfil = "conservador" | "moderado" | "arrojado";
type AssetGroupKey = "renda_fixa" | "renda_variavel" | "liquidez";

type TeaserAsset = {
  id: string;
  label: string;
};

type TeaserAssetGroup = {
  key: AssetGroupKey;
  label: string;
  assets: TeaserAsset[];
};

const PONTOS_REACAO: Record<string, number> = {
  vender_tudo: 0, espera_preocupado: 1, mantenho_tranquilo: 2, compra_mais: 3,
};
const PONTOS_EXPERIENCIA: Record<string, number> = {
  nunca: 0, pouca: 1, media: 2, experiente: 3,
};
const PONTOS_RISCO: Record<string, number> = {
  ate_10: 0, ate_30: 1, ate_60: 2, mais_60: 3,
};

/**
 * DiagnosticoService (Camada 2 - Use Case)
 * Agora unifica o cálculo de perfil com o Motor Real (Monte Carlo).
 * Isso garante que o Output Genérico e o Específico sejam 100% consistentes.
 */
export class DiagnosticoService {
  private repo: DiagnosticoRepository;
  private carteiraRepo: CarteiraIdealRepository;
  private outputGenericoNarrative: OutputGenericoNarrativeService;

  constructor() {
    this.repo = new DiagnosticoRepository();
    this.carteiraRepo = new CarteiraIdealRepository();
    this.outputGenericoNarrative = new OutputGenericoNarrativeService();
  }

  /**
   * Calcula o perfil de risco, roda o Motor Real e persiste os dados.
   */
  async processar(userId: string, dados: DiagnosticoInput, token: string) {
    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 1: CALCULAR PERFIL DE RISCO (algoritmo de pontuação)
    // ═══════════════════════════════════════════════════════════════════════════
    let pontos =
      PONTOS_REACAO[dados.reacao_queda] +
      PONTOS_EXPERIENCIA[dados.experiencia_rv] +
      PONTOS_RISCO[dados.percentual_risco];

    // Bônus por horizonte longo
    const horizonteMax = Object.values(dados.detalhes_objetivos || {}).reduce(
      (max: number, det: any) => Math.max(max, det.horizonte_anos || 0), 0
    );
    if (horizonteMax >= 15) pontos += 2;
    else if (horizonteMax >= 8) pontos += 1;

    // Determinar perfil
    const perfil: Perfil =
      pontos <= 3 ? "conservador" : pontos <= 7 ? "moderado" : "arrojado";

    // Gerar alertas personalizados. Reserva de emergência é tratada apenas como
    // disclaimer no frontend e não altera o produto Carteira Ideal no MVP.
    const alertas: string[] = [];

    // Persistir diagnóstico no banco
    await this.repo.upsert(userId, dados, perfil, token);
    await this.repo.marcarOnboardingCompleto(userId, perfil, token);

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 2: RODAR O MOTOR REAL (Monte Carlo + Alocação de Ativos)
    // ═══════════════════════════════════════════════════════════════════════════
    const client: Client = {
      id: userId,
      name: "User",
      age: (dados as any).idade || 30,
      income: dados.renda_mensal || 0,
      expenses: dados.gastos_mensais || 0,
      savings: dados.patrimonio_total || 0,
      monthly: (dados as any).aporte_mensal || 0,
      goals: [],
    };

    // Mapear objetivos detalhados para o formato do Motor
    const riskLevel: Goal["risk"] = perfil === "arrojado" ? "aggressive" : perfil === "moderado" ? "moderate" : "conservative";
    const goalsWithIds = Object.entries(dados.detalhes_objetivos || {}).map(([key, det]: [string, any]) => {
      const baseGoal = (dados.objetivos_selecionados || []).find((o: any) => o.id === key);
      return {
        id: key,
        goal: {
          name: baseGoal ? baseGoal.label : key,
          target: det.valor || 0,
          years: det.horizonte_anos || 5,
          risk: riskLevel,
          priority: det.prioridade || 3,
          nature: det.natureza === "need" ? "essential" as const : "aspirational" as const,
          liquidity: (det.liquidez || "medium") as "low" | "medium" | "high",
        },
      };
    });
    const goals: Goal[] = goalsWithIds.map((item) => item.goal);

    const view = Engine.DEFAULT_VIEW;
    const catalog = Engine.buildCatalog(view);

    let portfolio: any;
    let individualPortfolios: any[] = [];
    let mainGoal = goals[0] || { name: "Crescimento", target: 0, years: 10, risk: riskLevel, priority: 3, nature: "aspirational" as const, liquidity: "medium" as const };

    if (goals.length > 1) {
      individualPortfolios = goals.map(g => Engine.buildPortfolio(g, client, view, catalog));
      portfolio = { alloc: Engine.consolidatePortfolios(individualPortfolios, catalog) };
      mainGoal = goals.reduce((prev, curr) => (curr.priority > prev.priority ? curr : prev));
    } else {
      portfolio = Engine.buildPortfolio(mainGoal, client, view, catalog);
      individualPortfolios = [portfolio];
    }

    const risk = Engine.portfolioRisk(portfolio.alloc, view, catalog);
    const sim = Engine.runMonteCarlo(portfolio.alloc, client.savings, client.monthly, mainGoal.years, mainGoal.target, view, catalog);
    const trafficLight = Engine.planTrafficLight(client, mainGoal, portfolio, sim, view, catalog, risk);
    const planScore = Engine.planScore(client, mainGoal, portfolio, sim, view, catalog, risk);
    const outputGenericoBase = this.outputGenericoNarrative.build({
      probabilidade: sim.prob_meta,
    });
    const aportePlan = this.buildPublicContributionPlan(
      Engine.buildContributionPlan(goals.length > 0 ? goals : [mainGoal], client, individualPortfolios, view, catalog),
      goalsWithIds
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 3: AGREGAR ALOCAÇÃO POR CLASSE (para o Output Genérico)
    // ═══════════════════════════════════════════════════════════════════════════
    const alocacaoAgregada = { renda_fixa: 0, acoes: 0, liquidez: 0 };
    for (const [aid, weight] of Object.entries(portfolio.alloc)) {
      const asset = catalog[aid];
      if (!asset) continue;
      if (asset.cat === "selic") {
        alocacaoAgregada.liquidez += (weight as number);
      } else if (asset.cat === "equity") {
        alocacaoAgregada.acoes += (weight as number);
      } else {
        alocacaoAgregada.renda_fixa += (weight as number);
      }
    }

    // Converter para porcentagem inteira
    const alocacaoPercent = {
      liquidez: Math.round(alocacaoAgregada.liquidez * 100),
    };
    const outputGenerico = {
      ...outputGenericoBase,
      teaser: {
        chance_sucesso: this.buildChanceSucesso(sim.prob_meta),
        aporte_plan: aportePlan,
        asset_groups: this.buildPublicAssetGroups(portfolio.alloc, catalog),
        asset_explanations: this.buildPublicAssetExplanations(),
      },
    };

    // Salvar snapshot do portfólio
    const fullAnalysis = { trafficLight, planScore, enforceLog: portfolio.enforce_log || [] };
    try {
      await this.carteiraRepo.saveSnapshot(userId, mainGoal.target, portfolio.alloc, risk, sim, fullAnalysis, token);
    } catch (e) {
      console.error("[DiagnosticoService] Erro ao salvar snapshot (não-bloqueante):", e);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 4: RETORNAR RESULTADO UNIFICADO
    // ═══════════════════════════════════════════════════════════════════════════
    return {
      alocacao: alocacaoPercent,
      output_generico: outputGenerico,
    };
  }

  private buildPublicAssetGroups(
    alloc: Record<string, number>,
    catalog: Record<string, Asset>
  ): TeaserAssetGroup[] {
    const groups: Record<AssetGroupKey, TeaserAssetGroup> = {
      renda_fixa: { key: "renda_fixa", label: "Renda fixa", assets: [] },
      renda_variavel: { key: "renda_variavel", label: "Renda variável", assets: [] },
      liquidez: { key: "liquidez", label: "Liquidez", assets: [] },
    };

    const liquidityPreview = Object.entries(alloc)
      .filter(([id]) => catalog[id]?.cat === "selic")
      .sort(([, a], [, b]) => b - a)[0];

    if (liquidityPreview) {
      const [id] = liquidityPreview;
      groups.liquidez.assets.push({
        id: "liquidez-preview",
        label: catalog[id].label,
      });
    }

    return [groups.renda_fixa, groups.renda_variavel, groups.liquidez];
  }

  private buildPublicContributionPlan(aportePlan: Engine.ContributionPlan, goalsWithIds: Array<{ id: string }>) {
    return {
      total_mensal: aportePlan.total_mensal,
      goal_count: aportePlan.goal_count,
      objetivos: aportePlan.objetivos.map((objetivo, index) => ({
        id: goalsWithIds[index]?.id || `goal-${index}`,
        goal_index: objetivo.goal_index,
        goal_name: objetivo.goal_name,
      })),
    };
  }

  private buildPublicAssetExplanations() {
    return {
      enabled: true,
      summary:
        "A carteira combina liquidez, protecao e crescimento para equilibrar prazo, risco e objetivo.",
      locked_count: 3,
    };
  }

  private buildChanceSucesso(probabilidade: number | null) {
    if (probabilidade === null) {
      return {
        value: null,
        label: "Indefinida" as const,
        message:
          "Sem uma meta numérica definida, montamos a estratégia como uma rota de crescimento para acompanhar no plano completo.",
      };
    }

    if (probabilidade >= 0.8) {
      return {
        value: probabilidade,
        label: "Alta" as const,
        message:
          "Seu plano está bem alinhado ao objetivo informado. O plano completo mostra os ativos e a projeção detalhada.",
      };
    }

    if (probabilidade >= 0.6) {
      return {
        value: probabilidade,
        label: "Moderada" as const,
        message:
          "Seu objetivo é viável, mas alguns ajustes podem melhorar a margem de segurança da rota.",
      };
    }

    return {
      value: probabilidade,
      label: "Baixa" as const,
      message:
        "No cenário atual, seu objetivo pede ajustes de prazo, aporte ou alvo. O plano completo mostra os caminhos para aumentar a viabilidade.",
    };
  }
}
