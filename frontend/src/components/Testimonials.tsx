"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    name: "Marcos LaTorre",
    age: "40",
    dream: "Multiplicação de Patrimônio",
    avatar: "/marcos_selfie.png",
    quote: "Para ser sincero, quando comecei a usar fiquei um pouco inseguro por não saber muito sobre ações. Mas as ferramentas, a IA e o suporte humano da Synapta são de extrema qualidade. Já cheguei a ter um rendimento de 30% em três meses: R$ 100 mil que investi na carteira da Synapta viraram R$ 130 mil em 3 meses. A IA da Synapta é muito boa no que faz!"
  },
  {
    name: "Camila Vasconcelos",
    age: "29",
    dream: "Abrir Clínica de Estética",
    avatar: "/camila_selfie.png",
    quote: "Eu trabalhava como gerente de marketing e o meu maior sonho sempre foi abrir a minha própria clínica de estética. Comecei aportando R$ 2.500 por mês na carteira recomendada pela Synapta. A estratégia calculada pela Inteligência Artificial foi tão precisa e rentável que, em apenas 12 meses, alcancei todo o dinheiro necessário para inaugurar minha clínica! Recomendo demais."
  }
];

export function Testimonials() {
  return (
    <section className="py-12 md:py-24 bg-surface text-center relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-bold mb-6">
            Não é só sobre números, <br/>
            <span className="gradient-text">é sobre a nova chave na sua mão.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="glass-panel p-8 md:p-10 rounded-3xl text-left relative"
            >
              <Quote className="text-primary-500/20 absolute top-6 right-6 md:top-8 md:right-8" size={48} />
              <div className="relative z-10">
                <p className="text-base md:text-xl text-zinc-300 italic mb-6 md:mb-8 leading-relaxed">
                  "{testi.quote}"
                </p>
                <div className="flex items-center gap-4">
                  {testi.avatar ? (
                    <Image src={testi.avatar} alt={testi.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover shadow-lg border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-blue-brand-950 font-bold text-xl shadow-lg border border-white/10">
                      {testi.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-base md:text-lg">{testi.name}, {testi.age}</h4>
                    <p className="text-primary-500 text-xs md:text-sm font-medium">Sonho: {testi.dream}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
