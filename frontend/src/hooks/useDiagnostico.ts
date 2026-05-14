"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticoService } from "@/services/diagnostico/DiagnosticoService";
import {
  Etapa5Data,
  DiagnosticoCompleto,
} from "@/schemas/diagnosticoSchemas";
import type { PlanoEspecifico } from "@/components/carteira-ideal/wizard/OutputEspecifico";

type DiagnosticoState = Partial<DiagnosticoCompleto>;

type ResultadoDiagnostico = {
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
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [dados, setDados] = useState<DiagnosticoState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);

  const avancarEtapa = (dadosEtapa: Partial<DiagnosticoCompleto>) => {
    setDados((prev) => ({ ...prev, ...dadosEtapa }));
    setEtapaAtual((prev) => Math.min(prev + 1, 6));
  };

  const voltarEtapa = () => {
    setEtapaAtual((prev) => Math.max(prev - 1, 1));
  };

  const submeter = async (dadosEtapa5: Etapa5Data) => {
    setIsLoading(true);
    setError(null);

    const dadosCompletos = { ...dados, ...dadosEtapa5 } as DiagnosticoCompleto;

    try {
      const res = await DiagnosticoService.salvar(dadosCompletos);
      setDados(dadosCompletos);
      setResultado(res);
      setEtapaAtual(6);
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
    etapaAtual,
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
