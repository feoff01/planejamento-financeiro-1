import { DiagnosticoInput } from "../domain/diagnosticoSchemas";
import { DiagnosticoRepository } from "../repositories/DiagnosticoRepository";
import { CarteiraIdealRepository } from "../repositories/CarteiraIdealRepository";
import * as Engine from "./CarteiraIdealEngine";
import { Client, Goal } from "../domain/carteiraIdealSchemas";

type Perfil = "conservador" | "moderado" | "arrojado";

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

  constructor() {
    this.repo = new DiagnosticoRepository();
    this.carteiraRepo = new CarteiraIdealRepository();
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

    // Penalidade por reserva insuficiente (< 3 meses)
    if (dados.meses_reserva < 3) pontos -= 1;

    // Determinar perfil
    const perfil: Perfil =
      pontos <= 3 ? "conservador" : pontos <= 7 ? "moderado" : "arrojado";

    // Gerar alertas personalizados
    const alertas: string[] = [];
    if (dados.meses_reserva < 6) {
      alertas.push("Sua reserva de emergência está abaixo de 6 meses de gastos. Esse é o primeiro passo antes de investir em ativos de maior risco.");
    }

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
      emergency: null,
    };

    // Mapear objetivos detalhados para o formato do Motor
    const riskLevel = perfil === "arrojado" ? "aggressive" : perfil === "moderado" ? "moderate" : "conservative";
    const goals: Goal[] = Object.entries(dados.detalhes_objetivos || {}).map(([key, det]: [string, any]) => {
      const baseGoal = (dados.objetivos_selecionados || []).find((o: any) => o.id === key);
      return {
        name: baseGoal ? baseGoal.label : key,
        target: det.valor || 0,
        years: det.horizonte_anos || 5,
        risk: riskLevel,
        priority: det.prioridade || 3,
        nature: det.natureza === "need" ? "essential" as const : "aspirational" as const,
        liquidity: (det.liquidez || "medium") as "low" | "medium" | "high",
      };
    });

    const view = Engine.DEFAULT_VIEW;
    const catalog = Engine.buildCatalog(view);

    let portfolio: any;
    let mainGoal = goals[0] || { name: "Crescimento", target: 0, years: 10, risk: riskLevel, priority: 3, nature: "aspirational" as const, liquidity: "medium" as const };

    if (goals.length > 1) {
      const portfolios = goals.map(g => Engine.buildPortfolio(g, client, view, catalog));
      portfolio = { alloc: Engine.consolidatePortfolios(portfolios, catalog) };
      mainGoal = goals.reduce((prev, curr) => (curr.priority > prev.priority ? curr : prev));
    } else {
      portfolio = Engine.buildPortfolio(mainGoal, client, view, catalog);
    }

    const risk = Engine.portfolioRisk(portfolio.alloc, view, catalog);
    const sim = Engine.runMonteCarlo(portfolio.alloc, client.savings, client.monthly, mainGoal.years, mainGoal.target, view, catalog);
    const trafficLight = Engine.planTrafficLight(client, mainGoal, portfolio, sim, view, catalog, risk);
    const planScore = Engine.planScore(client, mainGoal, portfolio, sim, view, catalog, risk);

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
      renda_fixa: Math.round(alocacaoAgregada.renda_fixa * 100),
      acoes: Math.round(alocacaoAgregada.acoes * 100),
      liquidez: Math.round(alocacaoAgregada.liquidez * 100),
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
      perfil,
      pontos,
      alocacao: alocacaoPercent,
      alertas,
      // Dados expandidos do Motor Real
      motor: {
        portfolio: portfolio.alloc,
        rules_applied: portfolio.rules,
        risk: {
          mu: risk.mu,
          sigma: risk.sigma,
          sharpe: risk.sharpe,
          var_95: risk.var_95,
        },
        simulation: {
          prob_meta: sim.prob_meta,
          prob_perda_real: sim.prob_perda_real,
          prob_perda_nom: sim.prob_perda_nom,
          aportado: sim.aportado,
          median: sim.median,
        },
        analysis: fullAnalysis,
      },
    };
  }
}
