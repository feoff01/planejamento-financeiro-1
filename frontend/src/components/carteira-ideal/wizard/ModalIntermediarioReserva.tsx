"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight, Target } from "lucide-react";

type Props = {
  onTracarReserva: () => void;
  onPularReserva: () => void;
};

export function ModalIntermediarioReserva({ onTracarReserva, onPularReserva }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-surface/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
    >
      <div className="p-6 text-center sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/10 shadow-[0_0_42px_rgba(245,158,11,0.18)]">
          <ShieldAlert size={36} className="text-amber-400" />
        </div>
        
        <h2 className="mt-6 text-2xl font-black text-white sm:text-3xl">Ponto de Atenção</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
          Percebemos que você não possui uma reserva de emergência completa. A reserva é essencial antes de começar a correr atrás dos seus objetivos de longo prazo.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onTracarReserva}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-300 transition-colors hover:bg-amber-500/20"
          >
            <ShieldAlert size={24} className="mb-2 text-amber-400" />
            <span className="text-sm font-black uppercase tracking-wider">Traçar Reserva</span>
            <span className="mt-1 text-xs font-medium text-amber-400/70">Recomendado</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPularReserva}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border/40 bg-surface-light p-5 text-zinc-300 transition-colors hover:bg-surface-light/80"
          >
            <Target size={24} className="mb-2 text-primary-500" />
            <span className="text-sm font-black uppercase tracking-wider">Pular para Objetivos</span>
            <span className="mt-1 text-xs font-medium text-zinc-500">Assumir os riscos</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
