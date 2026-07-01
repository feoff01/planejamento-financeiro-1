/**
 * PlanoIdealService (Frontend)
 * Responsável por chamar a API do Motor Financeiro Institucional.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://planejamento-financeiro-backend-scp3.onrender.com";

export type GoalPayload = {
  name: string;
  target: number;
  years: number;
  risk: string;
  priority: number;
  nature: string;
  liquidity: string;
};

type AssetGroupKey = "renda_fixa" | "renda_variavel" | "liquidez";
type TrafficStatus = "green" | "yellow" | "red";

type TrafficLightInfo = {
  status: TrafficStatus;
  title: string;
  desc: string;
  value: number;
};

type ContributionPlan = {
  total_mensal: number;
  ideal_mensal: number;
  goal_count: number;
  objetivos: Array<{
    goal_index: number;
    goal_name: string;
    aporte_mensal: number;
    aporte_necessario_mensal: number;
    percentual: number;
    cobertura: number | null;
    prioridade: number;
    ativos: Array<{
      id: string;
      label: string;
      percentual: number;
      aporte_mensal: number;
    }>;
  }>;
};

export type PlanoIdealResponse = {
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
  allocation_summary?: Partial<Record<AssetGroupKey, number>>;
  asset_groups?: Array<{
    key: AssetGroupKey;
    label: string;
    percentual: number;
    assets: Array<{
      id: string;
      label: string;
      categoria: AssetGroupKey;
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
  portfolio: Record<string, number>;
  rules_applied: unknown;
  risk: {
    mu: number;
    sigma: number;
    sharpe: number;
    var_95: number;
  };
  simulation: {
    prob_meta: number | null;
    prob_perda_real: number;
    median: number;
  };
  contribution_plan?: ContributionPlan;
  analysis: {
    planScore?: {
      score: number;
      rating: string;
    };
    trafficLight: Record<string, TrafficLightInfo> & {
      viability: TrafficLightInfo;
      portfolio_risk: TrafficLightInfo;
    };
  };
};

type ApiResponse = {
  data?: PlanoIdealResponse;
  error?: string;
};

export const PlanoIdealService = {
  /**
   * Dispara a simulação de Monte Carlo e geração de alocação específica.
   */
  async gerar(goal: GoalPayload | GoalPayload[]) {
    const goals = Array.isArray(goal) ? goal : [goal];
    const response = await fetch(`${BACKEND_URL}/api/plano-ideal/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goals }),
      credentials: "include",
    });

    const result = (await response.json()) as ApiResponse;

    if (!response.ok) {
      const error = new Error(result.error || "Erro ao gerar o Plano Ideal.") as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    if (!result.data) {
      throw new Error("Resposta inválida ao gerar o Plano Ideal.");
    }

    return result.data;
  },
};

