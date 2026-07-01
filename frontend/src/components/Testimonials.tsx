"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const testimonials = [
  {
    name: "Marcos LaTorre",
    age: "40",
    dream: "Multiplicação de patrimônio",
    avatar: "/marcos_selfie.png",
    quote:
      "Eu tinha capital investido, mas pouca clareza. A Synapta organizou minha carteira, explicou os próximos passos e me deu confiança para agir com método.",
  },
  {
    name: "Camila Vasconcelos",
    age: "29",
    dream: "Abrir clínica de estética",
    avatar: "/camila_selfie.png",
    quote:
      "Pela primeira vez consegui ver meus objetivos como um plano financeiro concreto. A plataforma mostrou quanto aportar, onde ajustar e o que priorizar.",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-28 bg-blue-brand-950 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-400 mb-5">
              Histórias
            </p>
            <h2 className="font-editorial text-5xl md:text-7xl leading-[0.95]">
              Clareza muda o jeito de investir.
            </h2>
          </div>

          <div className="divide-y divide-white/12 border-y border-white/12">
            {testimonials.map((testi, index) => (
              <motion.article
                key={testi.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="py-8"
              >
                <p className="font-editorial text-3xl md:text-4xl leading-[1.08] text-white">
                  “{testi.quote}”
                </p>

                <div className="mt-7 flex items-center gap-4">
                  <Image
                    src={testi.avatar}
                    alt={testi.name}
                    width={52}
                    height={52}
                    className="w-[52px] h-[52px] rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-base">
                      {testi.name}, {testi.age}
                    </h4>
                    <p className="text-primary-300 text-sm">Objetivo: {testi.dream}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

