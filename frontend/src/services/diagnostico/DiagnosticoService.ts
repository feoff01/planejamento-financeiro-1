import { DiagnosticoCompleto } from "@/schemas/diagnosticoSchemas";
import type { PlanoEspecifico } from "@/components/carteira-ideal/wizard/OutputEspecifico";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

type DiagnosticoResponse = {
  perfil: "conservador" | "moderado" | "arrojado";
  pontos: number;
  alocacao: {
    renda_fixa: number;
    acoes: number;
    liquidez: number;
  };
  alertas: string[];
  output_generico?: {
    status: "meta_critica" | "meta_apertada" | "plano_viavel" | "plano_forte";
    titulo: string;
    subtitulo: string;
    cta_label: string;
  };
  motor: {
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
      prob_perda_nom: number;
      aportado: number;
      median: number;
    };
    analysis: PlanoEspecifico["analysis"];
  };
};

type ApiError = Error & { status?: number };

export const DiagnosticoService = {
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
      const error: ApiError = new Error(
        result.error || "Não foi possível salvar seu diagnóstico. Tente novamente."
      );
      error.status = response.status;
      throw error;
    }

    return result as DiagnosticoResponse;
  },
};
