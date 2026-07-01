"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export function Guarantee() {
  return (
    <section className="py-14 md:py-24 bg-[#f7f3ea] relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="grid md:grid-cols-[96px_1fr] gap-8 md:gap-10 items-start border-y border-blue-brand-950/12 py-10 md:py-14"
        >
          <div className="w-20 h-20 rounded-full bg-blue-brand-950 text-primary-400 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10" strokeWidth={1.5} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600 mb-4">
              Compromisso
            </p>
            <h3 className="font-editorial text-5xl md:text-7xl leading-[0.95]">
              Rentabilidade ou reembolso.
            </h3>
            <p className="mt-6 text-lg leading-relaxed text-blue-brand-950/62 max-w-3xl">
              Se você não tiver rentabilidade positiva seguindo nossa rota sugerida nos primeiros 12 meses, nós devolvemos 100% do valor da assinatura.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

