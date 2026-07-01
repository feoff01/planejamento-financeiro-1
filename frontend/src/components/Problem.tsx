"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function Problem() {
  return (
    <section className="py-16 md:py-28 bg-blue-brand-950 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-400 mb-5">
              O problema
            </p>
            <h2 className="font-editorial text-5xl md:text-7xl leading-[0.95]">
              Esforço financeiro sem direção ainda é desperdício.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-10 items-end"
          >
            <div className="relative h-[360px] md:h-[500px] overflow-hidden rounded-[1.5rem]">
              <Image
                src="/tired_worker.png"
                alt="Profissional frustrado com os resultados financeiros"
                fill
                className="object-cover object-center grayscale-[20%] contrast-110"
              />
              <div className="absolute inset-0 bg-blue-brand-950/20" />
            </div>

            <div className="pb-2">
              <p className="text-lg md:text-xl leading-relaxed text-white/68">
                O problema não é apenas quanto você ganha ou investe. É quando dívidas, aportes, reserva e carteira caminham sem uma lógica única.
              </p>
              <p className="mt-7 text-base leading-relaxed text-white/50">
                A Synapta entra para tirar ruído: identifica onde o dinheiro está travado, organiza prioridades e transforma objetivos em uma rota patrimonial mensurável.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

