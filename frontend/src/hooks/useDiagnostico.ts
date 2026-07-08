"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticoService } from "@/services/diagnostico/DiagnosticoService";
import {
  Etapa5Data,
  DiagnosticoCompleto,
} from "@/schemas/diagnosticoSchemas";

type DiagnosticoState = Partial<DiagnosticoCompleto>;

/**
 * Fluxo do onboarding com ramificação:
 *  renda → patrimonio (pergunta "você investe?") → objetivos → detalhes →
 *    ├─ investe = "nao" → comparativo (obrigatório) → risco
 *    └─ investe = "sim" → investimentos (aprofundamento) → risco
 *  → resultado
 */
export type EtapaKey =
  | "renda"
  | "patrimonio"
  | "objetivos"
  | "detalhes"
  | "comparativo"
  | "investimentos"
  | "risco"
  | "resultado";

export function montarFluxo(investe?: "sim" | "nao"): EtapaKey[] {
  const ramo: EtapaKey[] =
    investe === "nao" ? ["comparativo"] : investe === "sim" ? ["investimentos"] : [];

  // Objetivos vêm primeiro: todo plano começa por um destino.
  return ["objetivos", "detalhes", "renda", "patrimonio", ...ramo, "risco", "resultado"];
}

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

type ResultadoDiagnostico = {
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível salvar seu diagnóstico. Tente novamente.";
}

function getErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function useDiagnostico() {
  const router = useRouter();
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [dados, setDados] = useState<DiagnosticoState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);

  const fluxo = useMemo(() => montarFluxo(dados.investe_atualmente), [dados.investe_atualmente]);
  const etapaAtual = fluxo[Math.min(indiceEtapa, fluxo.length - 1)];
  const totalPerguntas = fluxo.length - 1; // exclui "resultado"

  const avancarEtapa = (dadosEtapa: Partial<DiagnosticoCompleto> = {}) => {
    const mesclados = { ...dados, ...dadosEtapa };
    setDados(mesclados);

    const novoFluxo = montarFluxo(mesclados.investe_atualmente);
    setIndiceEtapa((prev) => Math.min(prev + 1, novoFluxo.length - 1));
  };

  const voltarEtapa = () => {
    setIndiceEtapa((prev) => Math.max(prev - 1, 0));
  };

  const submeter = async (dadosEtapa5: Etapa5Data) => {
    setIsLoading(true);
    setError(null);

    const dadosCompletos = { ...dados, ...dadosEtapa5 } as DiagnosticoCompleto;

    try {
      const res = await DiagnosticoService.salvar(dadosCompletos);
      setDados(dadosCompletos);
      setResultado(res);
      setIndiceEtapa(montarFluxo(dadosCompletos.investe_atualmente).length - 1);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      const status = getErrorStatus(err);
      setError(message);

      if (
        status === 401 ||
        message.includes("sessão expirada") ||
        message.includes("sessao expirada") ||
        message.includes("não autenticado") ||
        message.includes("nao autenticado")
      ) {
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const limparErro = () => setError(null);

  return {
    fluxo,
    etapaAtual,
    indiceEtapa,
    totalPerguntas,
    dados,
    resultado,
    isLoading,
    error,
    limparErro,
    avancarEtapa,
    voltarEtapa,
    submeter,
  };
}
