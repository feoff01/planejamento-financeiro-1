"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticoService } from "@/services/diagnostico/DiagnosticoService";
import {
  Etapa5Data,
  DiagnosticoCompleto,
} from "@/schemas/diagnosticoSchemas";

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
    status: "base_fragil" | "base_incompleta" | "meta_critica" | "meta_apertada" | "plano_viavel" | "plano_forte";
    titulo: string;
    subtitulo: string;
    prioridade_atual: string;
    passos: Array<{
      titulo: string;
      descricao: string;
      status: "agora" | "proximo" | "depois";
    }>;
    cta_label: string;
    mostrar_probabilidade_no_topo: boolean;
    metricas: {
      probabilidade: number | null;
      reserva_atual: number;
      reserva_ideal: number;
      gap_reserva: number;
    };
  };
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

export function useDiagnostico() {
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [dados, setDados] = useState<DiagnosticoState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);

  const avancarEtapa = (dadosEtapa: Partial<DiagnosticoCompleto>) => {
    setDados((prev) => ({ ...prev, ...dadosEtapa }));
    setEtapaAtual((prev) => Math.min(prev + 1, 6)); // Agora vai até 6
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
      setResultado(res);
      setEtapaAtual(6); // Etapa 6 = Resultado
    } catch (err: any) {
      setError(err.message);
      
      // Se a sessão expirou (401), redireciona para login
      if (err.status === 401 || err.message.includes("sessão expirada") || err.message.includes("não autenticado")) {
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
