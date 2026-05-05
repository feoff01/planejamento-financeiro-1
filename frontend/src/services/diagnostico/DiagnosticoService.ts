import { DiagnosticoCompleto } from "@/schemas/diagnosticoSchemas";

/**
 * DiagnosticoService (Camada 2 - Serviço)
 * Ponte entre o Wizard do frontend e a API do Backend.
 * NÃO conhece o Supabase. NÃO calcula o perfil. Só transporta dados.
 */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

export const DiagnosticoService = {
  /**
   * Envia todos os dados das 5 etapas para o backend calcular o perfil,
   * rodar o Motor Real (Monte Carlo) e persistir no banco de dados.
   * Retorna resultado unificado (perfil + alocação real + simulação + análise).
   */
  async salvar(dados: DiagnosticoCompleto) {
    const response = await fetch(`${BACKEND_URL}/api/user/diagnostico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      const error: any = new Error(
        result.error || "Não foi possível salvar seu diagnóstico. Tente novamente."
      );
      error.status = response.status;
      throw error;
    }

    return result as {
      perfil: "conservador" | "moderado" | "arrojado";
      pontos: number;
      alocacao: {
        renda_fixa: number;
        acoes: number;
        liquidez: number;
      };
      alertas: string[];
      motor: {
        portfolio: Record<string, number>;
        rules_applied: any;
        risk: {
          mu: number;
          sigma: number;
          sharpe: number;
          var_95: number;
        };
        simulation: {
          prob_meta: number | null;
          prob_perda_real: number;
          prob_perda_nom: number;
          aportado: number;
          median: number;
        };
        analysis: any;
      };
    };
  },
};
