"use client";

import { useMemo } from "react";

import {
  PLANO_RESULT_ICONS,
  PlanoResultadoLayout,
  type PlanoAllocation,
  type PlanoAportePlan,
  type PlanoAssetExplanations,
  type PlanoAssetGroup,
  type PlanoAssetGroupKey,
  type PlanoChanceLabel,
  type PlanoMetric,
  type PlanoObjetivo,
} from "./PlanoResultadoLayout";

type Props = {
  plano?: PlanoEspecifico | null;
  onBack: () => void;
};

type TrafficStatus = "green" | "yellow" | "red";

type TrafficLightInfo = {
  status: TrafficStatus;
  title: string;
  desc: string;
  value: number;
};

type ContributionGoal = {
  goal_index: number;
  goal_name: string;
  aporte_mensal: number;
  aporte_necessario_mensal?: number;
  percentual?: number;
  cobertura?: number | null;
};

type ContributionPlan = {
  total_mensal: number;
  ideal_mensal: number;
  goal_count: number;
  objetivos: ContributionGoal[];
};

export type PlanoEspecifico = {
  goals?: Array<{
    goal_index: number;
    name: string;
    target: number;
    years: number;
    risk: string;
    priority: number;
    nature: string;
    liquidity: string;
  }>;
  tempo_estimado?: {
    months: number;
    years: number;
    label: string;
  } | null;
  allocation_summary?: Partial<Record<PlanoAssetGroupKey, number>>;
  asset_groups?: Array<{
    key: PlanoAssetGroupKey;
    label: string;
    percentual: number;
    assets: Array<{
      id: string;
      label: string;
      categoria: PlanoAssetGroupKey;
      percentual: number;
      aporte_mensal: number;
    }>;
  }>;
  asset_explanations?: Array<{
    id: string;
    label: string;
    percentual: number;
    explanation: string;
  }>;
  growth_projection?: Array<{
    ano: number;
    aportado: number;
    projetado: number;
  }>;
  portfolio?: Record<string, number>;
  risk?: {
    mu?: number;
    sigma?: number;
    sharpe?: number;
    var_95?: number;
  };
  simulation?: {
    prob_meta?: number | null;
    prob_perda_real?: number;
    median?: number;
  };
  contribution_plan?: ContributionPlan;
  analysis?: {
    planScore?: {
      score: number;
      rating: string;
    };
    trafficLight?: Record<string, TrafficLightInfo> & {
      viability?: TrafficLightInfo;
      portfolio_risk?: TrafficLightInfo;
    };
  };
};

const ASSET_GROUPS: Array<{ key: PlanoAssetGroupKey; label: string }> = [
  { key: "renda_fixa", label: "Renda fixa" },
  { key: "renda_variavel", label: "Renda variável" },
  { key: "liquidez", label: "Liquidez" },
];

export function OutputEspecifico({ plano }: Props) {
  const safePlano = plano ?? {};

  const chance = useMemo(() => buildChance(safePlano), [safePlano]);

  const metrics = useMemo<PlanoMetric[]>(
    () => [
      {
        icon: PLANO_RESULT_ICONS.CalendarClock,
        label: "Tempo estimado",
        value: safePlano.tempo_estimado?.label ?? "Prazo não informado",
        desc: "Prazo estimado para concluir todos os objetivos, considerando aporte mensal e retorno esperado.",
      },
      {
        icon: PLANO_RESULT_ICONS.Target,
        label: "Chance de sucesso",
        value: chance.value,
        desc:
          safePlano.analysis?.trafficLight?.viability?.desc ??
          "Probabilidade estimada com base no diagnóstico informado.",
        tone: chance.label,
      },
    ],
    [
      chance,
      safePlano.analysis?.trafficLight?.viability?.desc,
      safePlano.tempo_estimado?.label,
    ]
  );

  return (
    <PlanoResultadoLayout
      mode="revealed"
      metrics={metrics}
      objetivos={buildObjetivos(safePlano)}
      aportePlan={buildAportePlan(safePlano)}
      allocation={buildAllocation(safePlano)}
      assetGroups={buildAssetGroups(safePlano)}
      assetExplanations={buildAssetExplanations(safePlano)}
      growthProjection={safePlano.growth_projection ?? []}
    />
  );
}

function buildObjetivos(plano: Partial<PlanoEspecifico>): PlanoObjetivo[] {
  return (plano.goals ?? []).map((goal) => ({
    id: `goal-${goal.goal_index}`,
    label: goal.name,
    valor: goal.target,
    horizonte_anos: goal.years,
    prioridade: goal.priority,
  }));
}

function buildAportePlan(plano: Partial<PlanoEspecifico>): PlanoAportePlan {
  if (plano.contribution_plan) {
    const objetivos = plano.contribution_plan.objetivos ?? [];

    return {
      total_mensal: plano.contribution_plan.total_mensal ?? 0,
      goal_count: plano.contribution_plan.goal_count ?? objetivos.length,
      objetivos: objetivos.map((objetivo) => ({
        id: `goal-${objetivo.goal_index}`,
        goal_index: objetivo.goal_index,
        goal_name: objetivo.goal_name,
        aporte_mensal: objetivo.aporte_mensal ?? 0,
      })),
    };
  }

  const goals = plano.goals ?? [];

  return {
    total_mensal: 0,
    goal_count: goals.length,
    objetivos: goals.map((goal) => ({
      id: `goal-${goal.goal_index}`,
      goal_index: goal.goal_index,
      goal_name: goal.name,
      aporte_mensal: 0,
    })),
  };
}

function buildAllocation(plano: Partial<PlanoEspecifico>): PlanoAllocation {
  return {
    renda_fixa: Number(plano.allocation_summary?.renda_fixa ?? 0),
    renda_variavel: Number(plano.allocation_summary?.renda_variavel ?? 0),
    liquidez: Number(plano.allocation_summary?.liquidez ?? 0),
  };
}

function buildAssetGroups(plano: Partial<PlanoEspecifico>): PlanoAssetGroup[] {
  return ASSET_GROUPS.map((meta) => {
    const group = plano.asset_groups?.find((item) => item.key === meta.key);

    return {
      key: meta.key,
      label: meta.label,
      assets:
        group?.assets?.map((asset) => ({
          id: asset.id,
          label: asset.label,
          percentual: asset.percentual ?? 0,
        })) ?? [],
    };
  });
}

function buildAssetExplanations(plano: Partial<PlanoEspecifico>): PlanoAssetExplanations {
  return {
    enabled: true,
    summary:
      "A carteira combina liquidez, proteção e crescimento para equilibrar prazo, risco e objetivo.",
    items:
      plano.asset_explanations?.map((item) => ({
        id: item.id,
        assetLabel: item.label,
        explanation: item.explanation,
      })) ?? [],
  };
}

function buildChance(plano: Partial<PlanoEspecifico>): {
  value: string;
  label: PlanoChanceLabel;
} {
  const probability = plano.simulation?.prob_meta ?? null;

  if (probability === null || probability === undefined) {
    return { value: "Indefinida", label: "Indefinida" };
  }

  const percent = Math.round(probability * 100);

  if (probability >= 0.8) {
    return { value: `Alta - ${percent}%`, label: "Alta" };
  }

  if (probability >= 0.6) {
    return { value: `Moderada - ${percent}%`, label: "Moderada" };
  }

  return { value: `Baixa - ${percent}%`, label: "Baixa" };
}
