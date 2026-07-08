"use client";

import { motion } from "framer-motion";
import { ArrowRight, LineChart, Sparkles, Target } from "lucide-react";

type Props = {
  onComecar: () => void;
};

const PASSOS = [
  {
    icon: Target,
    titulo: "Seus objetivos",
    desc: "Você conta aonde quer chegar — e em quanto tempo.",
  },
  {
    icon: LineChart,
    titulo: "Seu diagnóstico",
    desc: "Renda, reserva e perfil: o retrato real do seu momento.",
  },
  {
    icon: Sparkles,
    titulo: "Sua rota",
    desc: "Um plano com números, prazos e a estratégia sob medida.",
  },
];

export function BoasVindas({ onComecar }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-2xl py-4 text-center text-blue-brand-950"
    >
      {/* Avatar do Guia — a mesma identidade do chat */}
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-primary-500 text-blue-brand-950 shadow-[0_12px_32px_rgba(201,162,75,0.45)]">
        <Sparkles size={22} />
      </span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">
        Guia Synapta
      </p>

      <h2 className="mt-4 font-editorial text-5xl leading-[0.96] md:text-6xl">
        Você fez a escolha certa.
      </h2>

      <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-blue-brand-950/65 md:text-base">
        Vamos começar agora o seu <strong>planejamento financeiro</strong> — e a sua mudança de vida
        rumo à materialização dos seus sonhos. Em poucos minutos, seus objetivos viram uma rota com
        números, prazos e uma estratégia feita para você.
      </p>

      <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
        {PASSOS.map((passo) => {
          const Icon = passo.icon;
          return (
            <div key={passo.titulo} className="rounded-[1.25rem] bg-white/70 p-4">
              <Icon size={20} className="text-blue-brand-950" strokeWidth={1.8} />
              <p className="mt-2.5 text-sm font-bold">{passo.titulo}</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-brand-950/60">{passo.desc}</p>
            </div>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onComecar}
        className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-gold-400 px-6 py-4 text-sm font-black text-blue-brand-950 transition-all hover:from-primary-400 hover:to-gold-300"
      >
        Começar meu planejamento financeiro
        <ArrowRight size={17} />
      </motion.button>

      <p className="mt-4 text-[11px] text-blue-brand-950/40">
        Eu te acompanho em cada etapa, explicando o porquê de cada pergunta. ✦
      </p>
    </motion.div>
  );
}
