import { DiagnosticoCompleto } from "@/schemas/diagnosticoSchemas";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

type OutputGenericoTeaser = {
  chance_sucesso: {
    value: number | null;
    label: "Alta" | "Moderada" | "Baixa" | "Indefinida";
    message: string;
  };
  aporte_plan?: {
    total_mensal: number;
    goal_count: number;
    objetivos: Array<{
      id?: string;
      goal_index: number;
      goal_name: string;
    }>;
  };
  asset_explanations?: {
    enabled: boolean;
    summary: string;
    locked_count: number;
  };
  asset_groups: Array<{
    key: "renda_fixa" | "renda_variavel" | "liquidez";
    label: string;
    assets: Array<{ id: string; label: string }>;
  }>;
};

type DiagnosticoResponse = {
  alocacao: {
    liquidez: number;
  };
  output_generico?: {
    status: "meta_critica" | "meta_apertada" | "plano_viavel" | "plano_forte";
    titulo: string;
    subtitulo: string;
    cta_label: string;
    teaser?: OutputGenericoTeaser;
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
