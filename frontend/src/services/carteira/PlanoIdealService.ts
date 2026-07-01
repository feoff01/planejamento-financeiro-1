import type { DiagnosticoCompleto } from "@/schemas/diagnosticoSchemas";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://planejamento-financeiro-backend-scp3.onrender.com";

export type GoalPayload = {
  nome?: string;
  objetivo?: string;
  goal?: string;
  valorObjetivo?: number;
  valor?: number;
  prazoMeses?: number;
  prazo?: number;
  perfilRisco?: string;
  risco?: string;
  [key: string]: unknown;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let result: any = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        `Erro na requisição para ${path}`
    );
  }

  // O backend retorna { data: plano }, então aqui devolvemos apenas o plano.
  return (result?.data ?? result) as T;
}

async function generatePlano(
  payload?: GoalPayload | DiagnosticoCompleto | unknown
) {
  return apiRequest("/api/plano-ideal/generate", {
    method: "POST",
    body: payload || {},
  });
}

export const PlanoIdealService: any = {
  generate: generatePlano,
  gerar: generatePlano,
  gerarPlano: generatePlano,
  gerarPlanoIdeal: generatePlano,
  gerarPlanoCompleto: generatePlano,
  desbloquearPlano: generatePlano,
  desbloquearTudo: generatePlano,
  calcularPlanoIdeal: generatePlano,
  criarPlanoIdeal: generatePlano,

  async buscarPlanoIdeal() {
    return generatePlano({});
  },

  async getPlanoIdeal() {
    return generatePlano({});
  },

  async salvarObjetivo(payload: GoalPayload) {
    return generatePlano(payload);
  },

  async saveGoal(payload: GoalPayload) {
    return generatePlano(payload);
  },

  async createGoal(payload: GoalPayload) {
    return generatePlano(payload);
  },
};
