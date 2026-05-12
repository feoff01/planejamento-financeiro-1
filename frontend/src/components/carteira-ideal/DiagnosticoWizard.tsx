"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useDiagnostico } from "@/hooks/useDiagnostico";
import { Etapa1Form } from "./wizard/Etapa1Form";
import { Etapa2Form } from "./wizard/Etapa2Form";
import { Etapa3Form } from "./wizard/Etapa3Form";
import { Etapa4DetalhesObjetivos } from "./wizard/Etapa4DetalhesObjetivos";
import { Etapa5Form } from "./wizard/Etapa5Form";
import { OutputGenerico } from "./wizard/OutputGenerico";
import { EtapaLoadingScreen } from "./wizard/EtapaLoadingScreen";
import { ErrorModal } from "../common/ErrorModal";

const ETAPAS = [
  { num: 1, label: "Renda & Gastos" },
  { num: 2, label: "Patrimônio" },
  { num: 3, label: "Objetivos" },
  { num: 4, label: "Detalhamento" },
  { num: 5, label: "Risco" },
  { num: 6, label: "Resultado" },
];

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
    ignorarReservaERefetch,
  } = useDiagnostico();

  const progressoPercent = ((etapaAtual - 1) / 5) * 100;
  const isResultadoVisible = etapaAtual === 6 && !!resultado && !isLoading;

  useEffect(() => {
    onResultadoVisibleChange?.(isResultadoVisible);
  }, [isResultadoVisible, onResultadoVisibleChange]);

  return (
    <div className={`w-full mx-auto ${isResultadoVisible ? "max-w-5xl" : "max-w-3xl"}`}>
      {/* Cabeçalho */}
      {etapaAtual < 6 && !isLoading && (
        <div className="mb-8">
          {/* Barra de progresso */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Etapa {etapaAtual} de 5
            </p>
            <p className="text-xs font-bold text-primary-400">{Math.round(progressoPercent)}% completo</p>
          </div>
          <div className="w-full bg-surface-light rounded-full h-1.5 overflow-hidden border border-border/30">
            <motion.div
              animate={{ width: `${progressoPercent}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-primary-600 via-primary-500 to-gold-400 rounded-full"
            />
          </div>

          {/* Steps */}
          <div className="flex gap-1 mt-3">
            {ETAPAS.filter((e) => e.num < 6).map((etapa) => (
              <div
                key={etapa.num}
                className={`flex-1 text-center text-[10px] font-medium transition-colors ${
                  etapa.num < etapaAtual
                    ? "text-primary-500"
                    : etapa.num === etapaAtual
                    ? "text-zinc-300"
                    : "text-zinc-700"
                }`}
              >
                {etapa.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Título da Etapa */}
      {etapaAtual < 6 && !isLoading && (
        <motion.div
          key={`title-${etapaAtual}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-white">
            {etapaAtual === 1 && "Vamos começar pelo básico 💰"}
            {etapaAtual === 2 && "Seu patrimônio atual 📊"}
            {etapaAtual === 3 && "Quais os seus sonhos? 🎯"}
            {etapaAtual === 4 && "Detalhando seus planos 🛠️"}
            {etapaAtual === 5 && "Como você lida com risco? 🧠"}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {etapaAtual === 1 && "Precisamos entender sua renda e gastos para desenhar sua alocação."}
            {etapaAtual === 2 && "Seu ponto de partida define a estratégia de crescimento."}
            {etapaAtual === 3 && "Selecione todos os objetivos que você quer atingir. A Synapta cria o plano."}
            {etapaAtual === 4 && "Vamos refinar a matemática por trás de cada um deles."}
            {etapaAtual === 5 && "Sua psicologia com investimentos determina o percentual de risco aceitável."}
          </p>
        </motion.div>
      )}

      {/* Conteúdo das Etapas */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <EtapaLoadingScreen />
          </motion.div>
        ) : (
          <motion.div
            key={etapaAtual}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {etapaAtual === 1 && <Etapa1Form onNext={avancarEtapa} />}
            {etapaAtual === 2 && <Etapa2Form onNext={avancarEtapa} onBack={voltarEtapa} gastosMensais={dados.gastos_mensais || 0} />}
            {etapaAtual === 3 && <Etapa3Form onNext={avancarEtapa} onBack={voltarEtapa} />}
            {etapaAtual === 4 && <Etapa4DetalhesObjetivos onNext={avancarEtapa} onBack={voltarEtapa} objetivos={dados.objetivos_selecionados ?? []} />}
            {etapaAtual === 5 && <Etapa5Form onNext={submeter} onBack={voltarEtapa} isLoading={isLoading} />}
            {etapaAtual === 6 && resultado && <OutputGenerico resultado={resultado} dadosCompletos={dados} onIgnorarReserva={ignorarReservaERefetch} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-up de Erro Padronizado */}
      <ErrorModal 
        isOpen={!!error} 
        message={error} 
        onClose={limparErro} 
      />
    </div>
  );
}
