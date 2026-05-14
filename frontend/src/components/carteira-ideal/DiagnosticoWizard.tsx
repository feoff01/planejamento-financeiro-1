"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { useDiagnostico } from "@/hooks/useDiagnostico";
import { ErrorModal } from "../common/ErrorModal";
import { Etapa1Form } from "./wizard/Etapa1Form";
import { Etapa2Form } from "./wizard/Etapa2Form";
import { Etapa3Form } from "./wizard/Etapa3Form";
import { Etapa4DetalhesObjetivos } from "./wizard/Etapa4DetalhesObjetivos";
import { Etapa5Form } from "./wizard/Etapa5Form";
import { EtapaLoadingScreen } from "./wizard/EtapaLoadingScreen";
import { OutputGenerico } from "./wizard/OutputGenerico";

const ETAPAS = [
  { num: 1, label: "Renda" },
  { num: 2, label: "Patrimônio" },
  { num: 3, label: "Objetivos" },
  { num: 4, label: "Detalhes" },
  { num: 5, label: "Risco" },
  { num: 6, label: "Resultado" },
];

const STEP_COPY: Record<number, { title: string; desc: string }> = {
  1: {
    title: "Comece pelo fluxo mensal.",
    desc: "Renda, gastos e capacidade de aporte mostram o ritmo real do plano.",
  },
  2: {
    title: "Defina seu ponto de partida.",
    desc: "Seu patrimônio atual ajuda a calibrar a rota de crescimento.",
  },
  3: {
    title: "Escolha os objetivos que importam.",
    desc: "A Synapta usa essas metas para organizar prioridade, prazo e alocação.",
  },
  4: {
    title: "Dê números aos planos.",
    desc: "Valor, prazo e prioridade transformam intenção em estratégia.",
  },
  5: {
    title: "Calibre sua relação com risco.",
    desc: "A carteira ideal precisa caber também no seu comportamento em momentos difíceis.",
  },
};

type Props = {
  onResultadoVisibleChange?: (isVisible: boolean) => void;
};

export function DiagnosticoWizard({ onResultadoVisibleChange }: Props) {
  const {
    etapaAtual,
    isLoading,
    error,
    limparErro,
    resultado,
    avancarEtapa,
    voltarEtapa,
    submeter,
    dados,
  } = useDiagnostico();

  const progressoPercent = ((etapaAtual - 1) / 5) * 100;
  const isResultadoVisible = etapaAtual === 6 && !!resultado && !isLoading;
  const copy = STEP_COPY[etapaAtual];

  useEffect(() => {
    onResultadoVisibleChange?.(isResultadoVisible);
  }, [isResultadoVisible, onResultadoVisibleChange]);

  return (
    <div className={`mx-auto w-full ${isResultadoVisible ? "max-w-6xl" : "max-w-3xl"}`}>
      {etapaAtual < 6 && !isLoading && (
        <div className="mb-9">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-brand-950/40">
              Etapa {etapaAtual} de 5
            </p>
            <p className="text-xs font-bold text-primary-700">{Math.round(progressoPercent)}% completo</p>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-brand-950/10">
            <motion.div
              animate={{ width: `${progressoPercent}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="h-full rounded-full bg-primary-500"
            />
          </div>

          <div className="mt-4 grid grid-cols-5 gap-1">
            {ETAPAS.filter((e) => e.num < 6).map((etapa) => (
              <div
                key={etapa.num}
                className={`truncate text-center text-[10px] font-semibold transition-colors ${
                  etapa.num < etapaAtual
                    ? "text-primary-700"
                    : etapa.num === etapaAtual
                    ? "text-blue-brand-950"
                    : "text-blue-brand-950/30"
                }`}
              >
                {etapa.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {etapaAtual < 6 && !isLoading && copy && (
        <motion.div
          key={`title-${etapaAtual}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
        >
          <h2 className="font-editorial text-4xl leading-none text-blue-brand-950 md:text-5xl">{copy.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-blue-brand-950/60">{copy.desc}</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <EtapaLoadingScreen />
          </motion.div>
        ) : (
          <motion.div
            key={etapaAtual}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.28 }}
          >
            {etapaAtual === 1 && <Etapa1Form onNext={avancarEtapa} />}
            {etapaAtual === 2 && (
              <Etapa2Form onNext={avancarEtapa} onBack={voltarEtapa} gastosMensais={dados.gastos_mensais || 0} />
            )}
            {etapaAtual === 3 && <Etapa3Form onNext={avancarEtapa} onBack={voltarEtapa} />}
            {etapaAtual === 4 && (
              <Etapa4DetalhesObjetivos
                onNext={avancarEtapa}
                onBack={voltarEtapa}
                objetivos={dados.objetivos_selecionados ?? []}
              />
            )}
            {etapaAtual === 5 && <Etapa5Form onNext={submeter} onBack={voltarEtapa} isLoading={isLoading} />}
            {etapaAtual === 6 && resultado && <OutputGenerico resultado={resultado} dadosCompletos={dados} />}
          </motion.div>
        )}
      </AnimatePresence>

      <ErrorModal isOpen={!!error} message={error} onClose={limparErro} />
    </div>
  );
}
