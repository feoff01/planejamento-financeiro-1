/**
 * CarteiraIdealService (Frontend)
 * Responsável por chamar a API do Motor Financeiro Institucional.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

export const CarteiraIdealService = {
  /**
   * Dispara a simulação de Monte Carlo e geração de alocação específica.
   */
  async gerar(goal: { 
    name: string; 
    target: number; 
    years: number; 
    risk: string; 
    priority: number; 
    nature: string; 
    liquidity: string 
  }) {
    const response = await fetch(`${BACKEND_URL}/api/carteira-ideal/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal }),
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      const error: any = new Error(result.error || "Erro ao gerar a carteira ideal.");
      error.status = response.status;
      throw error;
    }

    return result.data as {
      portfolio: Record<string, number>;
      rules_applied: any;
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
      analysis: any;
    };
  }
};
