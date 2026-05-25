"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  onContinue: () => void;
};

export function ReservaDisclaimerModal({ onContinue }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-blue-brand-950/72 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserva-disclaimer-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-blue-brand-950"
      >
        <div className="p-6 text-center sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/10">
            <ShieldAlert size={36} className="text-amber-400" />
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-400/80">
            Aviso importante
          </p>
          <h2 id="reserva-disclaimer-title" className="mt-2 text-2xl font-black text-white sm:text-3xl">
            Antes de investir nos objetivos, proteja sua base.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/62">
            Antes de seguir nossas recomendacoes para seus objetivos, recomendamos manter uma reserva de emergencia de
            pelo menos 6 meses dos seus gastos em um investimento de renda fixa com liquidez, como LFT/Tesouro Selic.
            Assim, sua estrategia fica mais completa e segura.
          </p>

          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onContinue}
            className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary-500 to-gold-400 px-5 py-4 text-sm font-black text-blue-brand-950 transition-all hover:from-primary-400 hover:to-gold-300"
          >
            <span>Entendi, ver meu diagnostico</span>
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
