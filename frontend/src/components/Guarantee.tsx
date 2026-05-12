"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export function Guarantee() {
  return (
    <section className="pt-4 md:pt-8 pb-12 md:pb-24 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative glass-panel rounded-3xl p-8 md:p-12 border border-primary-500/20 overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center gap-8 md:gap-12 shadow-[0_0_40px_rgba(201, 162, 75,0.05)]"
        >
          {/* Fundo dourado suave no cartão */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
          
          <div className="shrink-0 relative">
            <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-primary-500/30 bg-background/50 backdrop-blur flex items-center justify-center dashboard-card-glow">
              <ShieldCheck className="text-primary-500 w-12 h-12 sm:w-16 sm:h-16" strokeWidth={1.5} />
            </div>
          </div>
          
          <div className="relative z-10 flex-1">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white">
              Risco Zero: <br className="hidden md:block" />
              <span className="gradient-text">Rentabilidade ou Reembolso</span>
            </h3>
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed md:pr-8">
              Confiamos tanto na inteligência e nas recomendações da Synapta que colocamos nossa pele em jogo. Se você não tiver rentabilidade positiva seguindo nossa rota sugerida nos primeiros 12 meses, nós <strong>devolvemos 100% do valor da sua assinatura</strong>. Sem letras miúdas, sem enrolação.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
