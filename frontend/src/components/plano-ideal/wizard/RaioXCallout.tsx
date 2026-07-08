"use client";

import { motion } from "framer-motion";
import { ArrowRight, Radar } from "lucide-react";
import Link from "next/link";

type Props = {
  /**
   * "investidor": chamada principal para quem já investe (analisa a carteira atual).
   * "iniciante": chamada secundária para quem acabou de ganhar a carteira de renda fixa.
   */
  variante: "investidor" | "iniciante";
};

const COPY = {
  investidor: {
    eyebrow: "Próximo passo recomendado",
    titulo: "Faça agora o Raio-X da sua carteira.",
    desc: "Descubra concentrações escondidas, setores pesados demais e o que está travando o rendimento da carteira que você já tem. A análise inicial é gratuita.",
    cta: "Fazer o Raio-X da minha carteira",
  },
  iniciante: {
    eyebrow: "Sua carteira, analisada",
    titulo: "Passe sua nova carteira pelo Raio-X.",
    desc: "A carteira de renda fixa que você ganhou é um ótimo começo — o Raio-X mostra o que ainda falta (como ações no peso certo) para ela virar a carteira ideal.",
    cta: "Analisar minha carteira no Raio-X",
  },
} as const;

export function RaioXCallout({ variante }: Props) {
  const copy = COPY[variante];

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-primary-500/40 bg-blue-brand-950 p-5 text-white shadow-[0_0_28px_rgba(201,162,75,0.22)] sm:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-300">
            <Radar size={14} />
            {copy.eyebrow}
          </p>
          <h3 className="mt-2 font-editorial text-3xl leading-none text-white md:text-4xl">
            {copy.titulo}
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-white/55 md:text-sm">{copy.desc}</p>
        </div>

        <Link href="/raio-x" className="shrink-0">
          <motion.span
            whileTap={{ scale: 0.98 }}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-gold-400 px-6 py-3.5 text-sm font-black text-blue-brand-950 transition-all hover:from-primary-400 hover:to-gold-300"
          >
            {copy.cta}
            <ArrowRight size={17} />
          </motion.span>
        </Link>
      </div>
    </section>
  );
}
