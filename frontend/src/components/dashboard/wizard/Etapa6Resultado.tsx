"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Etapa7PlanoDetalhado } from "./Etapa7PlanoDetalhado";

type Resultado = {
  perfil: "conservador" | "moderado" | "arrojado";
  pontos: number;
  alocacao: { renda_fixa: number; acoes: number; liquidez: number };
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

type Props = { 
  resultado: Resultado;
  dadosCompletos: any;
};

export function Etapa6Resultado({ resultado, dadosCompletos }: Props) {
  const router = useRouter();
  const [showDetalhado, setShowDetalhado] = useState(false);
  const config = PERFIL_CONFIG[resultado.perfil];

  // Os dados do motor já estão carregados — sem nova chamada API
  const planoCompleto = {
    portfolio: resultado.motor.portfolio,
    rules_applied: resultado.motor.rules_applied,
    risk: resultado.motor.risk,
    simulation: resultado.motor.simulation,
    analysis: resultado.motor.analysis,
  };

  if (showDetalhado) {
    return <Etapa7PlanoDetalhado plano={planoCompleto} onBack={() => setShowDetalhado(false)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Badge de Perfil */}
      <div className={`flex flex-col items-center text-center px-6 py-6 rounded-2xl border ${config.border} ${config.bg}`}>
        <span className="text-4xl mb-2">{config.emoji}</span>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Seu perfil de investidor</p>
        <h2 className={`text-2xl font-bold ${config.color} mb-2`}>{config.label}</h2>
        <p className="text-sm text-zinc-400 max-w-xs">{config.desc}</p>

        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-xs text-zinc-600 mb-0.5">Retorno esperado</p>
            <p className={`text-sm font-bold ${config.color}`}>
              {(resultado.motor.risk.mu * 100).toFixed(1)}% a.a.
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-600 mb-0.5">Volatilidade est.</p>
            <p className="text-sm font-bold text-zinc-300">
              {(resultado.motor.risk.sigma * 100).toFixed(1)}% a.a.
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-600 mb-0.5">Sharpe</p>
            <p className="text-sm font-bold text-zinc-300">
              {resultado.motor.risk.sharpe.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de alocação — derivada do Motor Real */}
      <div>
        <p className="text-sm font-semibold text-zinc-300 mb-3">Sua Estratégia Macro</p>
        <div className="flex rounded-full overflow-hidden h-4 mb-3 bg-zinc-800">
          {Object.entries(resultado.alocacao).map(([key, val]) => (
            val > 0 && (
              <motion.div
                key={key}
                initial={{ width: 0 }}
                animate={{ width: `${val}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`${ALOCACAO_COLORS[key]} h-full`}
              />
            )
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(resultado.alocacao).map(([key, val]) => (
            val > 0 && (
              <div key={key} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-light border border-border/30">
                <div className={`w-2 h-2 rounded-full ${ALOCACAO_COLORS[key]} shrink-0`} />
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{ALOCACAO_LABELS[key]}</span>
                <span className="text-xs text-zinc-200 font-bold ml-auto">{val}%</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Probabilidade de Meta */}
      {resultado.motor.simulation.prob_meta !== null && (
        <div className="px-4 py-3 rounded-xl border border-primary-500/20 bg-primary-500/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-300">Probabilidade de atingir sua meta</p>
            <p className={`text-lg font-bold ${
              resultado.motor.simulation.prob_meta >= 0.8 ? "text-emerald-400" :
              resultado.motor.simulation.prob_meta >= 0.6 ? "text-amber-400" : "text-red-400"
            }`}>
              {(resultado.motor.simulation.prob_meta * 100).toFixed(0)}%
            </p>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Baseado em 10.000 simulações de Monte Carlo</p>
        </div>
      )}

      {/* Alertas */}
      {resultado.alertas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-400" /> Diagnóstico da Saúde Financeira
          </p>
          <div className="grid grid-cols-1 gap-2">
            {resultado.alertas.map((alerta, i) => (
              <div key={i} className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-200/80">
                <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-500" />
                {alerta}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA para ver Plano Detalhado — agora instantâneo (sem nova chamada API) */}
      <div className="pt-4 space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDetalhado(true)}
          className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-amber-500 text-black flex flex-col items-center justify-center gap-0.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>Ver Plano de Ação Detalhado</span>
            <ArrowRight size={16} />
          </div>
          <span className="text-[9px] opacity-70 uppercase tracking-widest font-bold">Ativos reais • Score do plano • Análise completa</span>
        </motion.button>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-3 rounded-xl font-medium text-xs text-zinc-500 hover:text-zinc-300 transition-all text-center"
        >
          Pular por enquanto e ir para o Dashboard
        </button>
      </div>
    </motion.div>
  );
}

const PERFIL_CONFIG = {
  conservador: {
    label: "Conservador",
    emoji: "🛡️",
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/10",
    desc: "Seu foco é proteger o que já conquistou. Você prefere segurança a retornos altos.",
  },
  moderado: {
    label: "Moderado",
    emoji: "⚖️",
    color: "text-primary-400",
    bg: "bg-primary-500/5",
    border: "border-primary-500/10",
    desc: "Você busca equilíbrio. Aceita oscilações pequenas em troca de um crescimento constante.",
  },
  arrojado: {
    label: "Arrojado",
    emoji: "🚀",
    color: "text-orange-400",
    bg: "bg-orange-500/5",
    border: "border-orange-500/10",
    desc: "Seu foco é aceleração. Você entende que o risco é o combustível para grandes retornos.",
  },
};

const ALOCACAO_COLORS: Record<string, string> = {
  renda_fixa: "bg-blue-500",
  acoes: "bg-primary-500",
  liquidez: "bg-zinc-400",
};

const ALOCACAO_LABELS: Record<string, string> = {
  renda_fixa: "Renda Fixa",
  acoes: "Ações",
  liquidez: "Liquidez",
};
