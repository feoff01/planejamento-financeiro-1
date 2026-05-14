/**
 * CarteiraIdealService (Frontend)
 * Responsável por chamar a API do Motor Financeiro Institucional.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

type GoalPayload = {
  name: string;
  target: number;
  years: number;
  risk: string;
  priority: number;
  nature: string;
  liquidity: string;
};

type CarteiraIdealResponse = {
  portfolio: Record<string, number>;
  rules_applied: unknown;
  risk: {
    mu: number;
    sigma: number;
    sharpe: number;
    var_95: number;
  };
  simulation: {
    prob_meta: number;
    prob_perda_real: number;
    median: number;
  };
  analysis: unknown;
};

type ApiResponse = {
  data?: CarteiraIdealResponse;
  error?: string;
};

export const CarteiraIdealService = {
  /**
   * Dispara a simulação de Monte Carlo e geração de alocação específica.
   */
  async gerar(goal: GoalPayload) {
    const response = await fetch(`${BACKEND_URL}/api/carteira-ideal/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal }),
      credentials: "include",
    });

    const result = (await response.json()) as ApiResponse;

    if (!response.ok) {
      const error = new Error(result.error || "Erro ao gerar a carteira ideal.") as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    if (!result.data) {
      throw new Error("Resposta inválida ao gerar a carteira ideal.");
    }

    return result.data;
  },
};
