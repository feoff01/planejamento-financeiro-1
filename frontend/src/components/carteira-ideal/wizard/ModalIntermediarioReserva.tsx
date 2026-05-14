"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldAlert } from "lucide-react";

type Props = {
  onContinue: () => void;
};

export function ReservaDisclaimerModal({ onContinue }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-blue-brand-950/10 bg-[#f7f3ea] shadow-[0_24px_80px_rgba(11,37,69,0.12)]"
    >
      <div className="p-6 text-center sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-brand-950 text-primary-400">
          <ShieldAlert size={36} />
        </div>

        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
          Aviso importante
        </p>
        <h2 className="mx-auto mt-3 max-w-lg font-editorial text-5xl leading-[0.95] text-blue-brand-950">
          Antes dos objetivos, proteja a base.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-blue-brand-950/60">
          Antes de seguir recomendações para metas de longo prazo, recomendamos manter uma reserva de emergência de pelo menos 6 meses dos seus gastos em renda fixa com liquidez, como Tesouro Selic.
        </p>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-blue-brand-950 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
        >
          <span>Entendi, ver diagnóstico</span>
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}
