"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-16 md:py-28 bg-blue-brand-950 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-400 mb-6">
            Próximo passo
          </p>
          <h2 className="font-editorial text-5xl md:text-8xl leading-[0.9]">
            Dê uma forma melhor ao seu futuro financeiro.
          </h2>

          <p className="text-lg text-white/62 mt-7 mb-10 max-w-2xl mx-auto leading-relaxed">
            Organize carteira, objetivos e decisões em uma plataforma que trabalha pela clareza antes de pedir ação.
          </p>

          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 bg-primary-400 hover:bg-primary-500 text-blue-brand-950 font-semibold rounded-full inline-flex items-center justify-center gap-2 transition-colors"
          >
            Entrar na plataforma
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

