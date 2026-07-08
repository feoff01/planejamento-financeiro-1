"use client";

import { useMemo, useState } from "react";

import {
  ALOCACAO_RF_SYNAPTA,
  CARTEIRA_RF_GRATIS,
  calcularPlanoReserva,
  type PerfilRisco,
} from "@/lib/plano/projecoes";

import { ReservaDisclaimerModal } from "./ModalIntermediarioReserva";
import { RaioXCallout } from "./RaioXCallout";
import { ReservaEmergenciaCard } from "./ReservaEmergenciaCard";
import {
  PLANO_RESULT_ICONS,
  PlanoResultadoLayout,
  PlanoUnlockFooter,
  type PlanoAllocation,
  type PlanoAportePlan,
  type PlanoAssetExplanations,
  type PlanoAssetGroup,
  type PlanoAssetGroupKey,
  type PlanoChanceLabel,
  type PlanoMetric,
  type PlanoObjetivo,
} from "./PlanoResultadoLayout";

type Resultado = {
  alocacao: { liquidez: number };
  output_generico?: OutputGenericoNarrativa;
};

type OutputGenericoNarrativa = {
  status: "meta_critica" | "meta_apertada" | "plano_viavel" | "plano_forte";
  titulo: string;
  subtitulo: string;
  cta_label: string;
  teaser?: OutputGenericoTeaser;
};

type OutputGenericoTeaser = {
  chance_sucesso: {
    value: number | null;
    label: PlanoChanceLabel;
    message: string;
  };
  aporte_plan?: PlanoAportePlan;
  asset_explanations?: AssetExplanationsTeaser;
  asset_groups: TeaserAssetGroup[];
};

type AssetExplanationsTeaser = {
  enabled: boolean;
  summary: string;
  locked_count: number;
};

type TeaserAssetGroup = {
  key: PlanoAssetGroupKey;
  label: string;
  assets: Array<{ id: string; label: string }>;
};

type ObjetivoSelecionado = {
  id: string;
  label: string;
  emoji?: string;
};

type DetalheObjetivo = {
  valor?: number;
  horizonte_anos?: number;
  natureza?: "need" | "want";
  liquidez?: "low" | "medium" | "high";
  prioridade?: number;
};

type DadosCompletos = {
  aporte_mensal?: number;
  patrimonio_total?: number;
  gastos_mensais?: number;
  objetivos_selecionados?: ObjetivoSelecionado[];
  detalhes_objetivos?: Record<string, DetalheObjetivo>;
};

type Props = {
  resultado: Resultado;
  dadosCompletos: DadosCompletos;
  onUnlock: () => void;
  isUnlocking?: boolean;
  /** Ramo do onboarding: define o que fica liberado e qual chamada do Raio-X aparece. */
  investeAtualmente?: "sim" | "nao";
  /** Perfil calculado no diagnóstico (usado para montar a carteira RF liberada). */
  perfil?: PerfilRisco;
  /** Pula o disclaimer de reserva (quando ele já foi exibido em uma tela anterior). */
  exibirDisclaimerReserva?: boolean;
};

const ASSET_GROUPS: Array<{ key: PlanoAssetGroupKey; label: string }> = [
  { key: "renda_fixa", label: "Renda fixa" },
  { key: "renda_variavel", label: "Renda variável" },
  { key: "liquidez", label: "Liquidez" },
];

const LOCKED_ASSET_PLACEHOLDERS: Record<PlanoAssetGroupKey, string[]> = {
  renda_fixa: ["Tesouro IPCA+ 2035", "CDB liquidez planejada", "Tesouro Prefixado 2031"],
  renda_variavel: ["Carteira Dividendos", "Portfolio Z", "Ações de crescimento"],
  liquidez: ["Reserva tática", "Tesouro Selic", "Caixa estratégico"],
};

const LOCKED_TIME_PLACEHOLDER = "12 anos";

export function OutputGenerico({
  resultado,
  dadosCompletos,
  onUnlock,
  isUnlocking = false,
  investeAtualmente,
  perfil = "moderado",
  exibirDisclaimerReserva = true,
}: Props) {
  const [showReservaDisclaimer, setShowReservaDisclaimer] = useState(exibirDisclaimerReserva);
  const carteiraRfLiberada = investeAtualmente === "nao";
  const objetivos = useMemo(() => buildObjetivosResumo(dadosCompletos), [dadosCompletos]);
  const teaser = useMemo(
    () => normalizeTeaser(resultado.output_generico?.teaser),
    [resultado.output_generico?.teaser]
  );
  const assetGroups = useMemo(() => {
    const grupos = buildLockedAssetGroups(teaser.asset_groups);
    if (!carteiraRfLiberada) return grupos;

    // Virada de chave: a renda fixa foi entregue de graça — aparece 100% aberta.
    return grupos.map((grupo) =>
      grupo.key === "renda_fixa"
        ? {
            ...grupo,
            assets: CARTEIRA_RF_GRATIS[perfil].map((ativo) => ({
              id: ativo.id,
              label: ativo.label,
              percentual: ativo.percentual,
              locked: false,
            })),
          }
        : grupo
    );
  }, [carteiraRfLiberada, perfil, teaser.asset_groups]);
  const aportePlan = useMemo(
    () => normalizeAportePlan(teaser.aporte_plan, dadosCompletos, objetivos),
    [dadosCompletos, objetivos, teaser.aporte_plan]
  );
  const assetExplanations = useMemo(() => {
    const base = buildLockedAssetExplanations(teaser.asset_explanations, assetGroups);
    if (!carteiraRfLiberada) return base;

    return {
      ...base,
      summary:
        "A parte de renda fixa já é sua e está aberta abaixo. Os ativos de renda variável — e o peso certo de cada um — fazem parte da recomendação completa.",
      items: [
        ...CARTEIRA_RF_GRATIS[perfil].map((ativo) => ({
          id: `rf-${ativo.id}`,
          assetLabel: ativo.label,
          explanation: ativo.papel,
          locked: false,
        })),
        ...base.items,
      ],
    };
  }, [assetGroups, carteiraRfLiberada, perfil, teaser.asset_explanations]);
  const metrics = useMemo<PlanoMetric[]>(
    () => [
      {
        icon: PLANO_RESULT_ICONS.CalendarClock,
        label: "Tempo estimado",
        value: LOCKED_TIME_PLACEHOLDER,
        desc: "O prazo real fica protegido no plano completo para manter o foco nos próximos passos.",
        locked: true,
      },
      {
        icon: PLANO_RESULT_ICONS.Target,
        label: "Chance de sucesso",
        value: formatChanceValue(teaser.chance_sucesso),
        desc: teaser.chance_sucesso.message,
        tone: teaser.chance_sucesso.label,
      },
    ],
    [teaser.chance_sucesso]
  );
  const planoReserva = calcularPlanoReserva(
    dadosCompletos.gastos_mensais ?? 0,
    dadosCompletos.patrimonio_total ?? 0,
    dadosCompletos.aporte_mensal ?? 0
  );

  const allocation: PlanoAllocation = {
    renda_fixa: carteiraRfLiberada ? ALOCACAO_RF_SYNAPTA[perfil] : 70,
    renda_variavel: carteiraRfLiberada ? 100 - ALOCACAO_RF_SYNAPTA[perfil] - Math.round(resultado.alocacao.liquidez) : 38,
    liquidez: resultado.alocacao.liquidez,
  };

  return (
    <>
      <PlanoResultadoLayout
        mode="locked"
        metrics={metrics}
        objetivos={objetivos}
        aportePlan={aportePlan}
        allocation={allocation}
        assetGroups={assetGroups}
        assetExplanations={assetExplanations}
        growthProjection={[]}
        revealedGroups={carteiraRfLiberada ? ["renda_fixa"] : []}
        extraSection={<ReservaEmergenciaCard plano={planoReserva} notaProjecoes />}
        footer={
          <>
            <RaioXCallout variante={investeAtualmente === "sim" ? "investidor" : "iniciante"} />
            <PlanoUnlockFooter
              onUnlock={onUnlock}
              isUnlocking={isUnlocking}
              label={carteiraRfLiberada ? "Ver recomendação completa" : "Desbloquear plano completo"}
            />
          </>
        }
      />

      {showReservaDisclaimer && <ReservaDisclaimerModal onContinue={() => setShowReservaDisclaimer(false)} />}
    </>
  );
}

function normalizeTeaser(teaser: OutputGenericoTeaser | undefined): OutputGenericoTeaser {
  if (teaser) {
    return {
      ...teaser,
      asset_groups: normalizeTeaserAssetGroups(teaser.asset_groups),
    };
  }

  return {
    chance_sucesso: buildChanceSucesso(null),
    asset_explanations: normalizeAssetExplanations(undefined),
    asset_groups: normalizeTeaserAssetGroups([]),
  };
}

function normalizeAssetExplanations(teaser: AssetExplanationsTeaser | undefined): AssetExplanationsTeaser {
  return {
    enabled: teaser?.enabled ?? true,
    summary:
      teaser?.summary ??
      "A carteira combina liquidez, proteção e crescimento para equilibrar prazo, risco e objetivo.",
    locked_count: Math.max(1, Math.min(teaser?.locked_count ?? 3, 4)),
  };
}

function normalizeAportePlan(
  plan: PlanoAportePlan | undefined,
  dados: DadosCompletos,
  objetivos: PlanoObjetivo[]
): PlanoAportePlan {
  if (plan) {
    return {
      ...plan,
      total_mensal: plan.total_mensal ?? 0,
      goal_count: plan.goal_count ?? plan.objetivos.length,
      objetivos: plan.objetivos ?? [],
    };
  }

  return {
    total_mensal: dados.aporte_mensal ?? 0,
    goal_count: objetivos.length,
    objetivos: objetivos.map((objetivo, index) => ({
      id: objetivo.id,
      goal_index: index,
      goal_name: objetivo.label,
    })),
  };
}

function normalizeTeaserAssetGroups(groups: TeaserAssetGroup[]): TeaserAssetGroup[] {
  return ASSET_GROUPS.map((meta) => {
    const group = groups.find((item) => item.key === meta.key);
    return {
      key: meta.key,
      label: group?.label ?? meta.label,
      assets: group?.assets ?? [],
    };
  });
}

function buildLockedAssetGroups(groups: TeaserAssetGroup[]): PlanoAssetGroup[] {
  return normalizeTeaserAssetGroups(groups).map((group) => {
    const placeholders = LOCKED_ASSET_PLACEHOLDERS[group.key].map((label, index) => ({
      id: `${group.key}-locked-${index}`,
      label,
      locked: true,
    }));

    if (group.key === "liquidez" && group.assets.length > 0) {
      return {
        key: group.key,
        label: group.label,
        assets: [
          { ...group.assets[0], preview: true },
          ...placeholders.slice(0, 2),
        ],
      };
    }

    return {
      key: group.key,
      label: group.label,
      assets: placeholders,
    };
  });
}

function buildLockedAssetExplanations(
  teaser: AssetExplanationsTeaser | undefined,
  assetGroups: PlanoAssetGroup[]
): PlanoAssetExplanations {
  const normalized = normalizeAssetExplanations(teaser);
  const liquidityPreview = assetGroups.find((group) => group.key === "liquidez")?.assets.find((asset) => asset.preview);
  const protectedLineCount = Math.max(0, normalized.locked_count - (liquidityPreview ? 1 : 0));

  return {
    enabled: normalized.enabled,
    summary: normalized.summary,
    items: [
      ...(liquidityPreview
        ? [{ assetLabel: liquidityPreview.label, locked: true }]
        : []),
      ...Array.from({ length: protectedLineCount }).map((_, index) => ({
        id: `locked-explanation-${index}`,
        assetLabel: "Ativo protegido",
        locked: true,
      })),
    ],
  };
}

function buildObjetivosResumo(dados: DadosCompletos): PlanoObjetivo[] {
  return (dados.objetivos_selecionados ?? []).map((objetivo) => ({
    id: objetivo.id,
    label: objetivo.label,
    valor: dados.detalhes_objetivos?.[objetivo.id]?.valor,
    horizonte_anos: dados.detalhes_objetivos?.[objetivo.id]?.horizonte_anos,
    prioridade: dados.detalhes_objetivos?.[objetivo.id]?.prioridade,
  }));
}

function buildChanceSucesso(value: number | null): OutputGenericoTeaser["chance_sucesso"] {
  if (value === null) {
    return {
      value,
      label: "Indefinida",
      message: "Sem uma meta numérica definida, montamos uma rota de crescimento para acompanhar no plano completo.",
    };
  }

  if (value >= 0.8) {
    return {
      value,
      label: "Alta",
      message: "Seu plano está bem alinhado ao objetivo informado. O plano completo mostra ativos e projeções.",
    };
  }

  if (value >= 0.6) {
    return {
      value,
      label: "Moderada",
      message: "Seu objetivo é viável, mas alguns ajustes podem aumentar a margem de segurança da rota.",
    };
  }

  return {
    value,
    label: "Baixa",
    message: "No cenário atual, seu objetivo pede ajustes. O plano completo mostra como melhorar a viabilidade.",
  };
}

function formatChanceValue(chance: OutputGenericoTeaser["chance_sucesso"]) {
  if (chance.value === null) return chance.label;
  return `${chance.label} - ${Math.round(chance.value * 100)}%`;
}

