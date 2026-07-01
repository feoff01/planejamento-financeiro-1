"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const goals = [
  {
    key: "house",
    title: "Casa própria",
    img: "/dream_house.png",
    tradPct: 23,
    synaptaPct: 85,
  },
  {
    key: "car",
    title: "Carro dos sonhos",
    img: "/dream_car.png",
    tradPct: 30,
    synaptaPct: 91,
  },
  {
    key: "travel",
    title: "Viagem internacional",
    img: "/dream_travel.png",
    tradPct: 20,
    synaptaPct: 88,
  },
];

export function Hero() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % goals.length);
    }, 3600);
    return () => clearInterval(interval);
  }, []);

  const current = goals[activeIdx];

  return (
    <section className="relative min-h-[92vh] pt-24 pb-14 md:pt-28 md:pb-20 overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl text-center lg:text-left"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600 mb-6">
              Planejamento patrimonial inteligente
            </p>

            <h1 className="font-editorial text-[4rem] leading-[0.88] sm:text-7xl lg:text-8xl text-blue-brand-950">
              Seu patrimônio, finalmente, com direção.
            </h1>

            <p className="mt-8 text-base sm:text-lg leading-relaxed text-blue-brand-950/66 max-w-2xl mx-auto lg:mx-0">
              A Synapta organiza sua vida financeira, corrige sua carteira e transforma objetivos em uma rota clara de aportes, risco e prazo.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link
                href="/auth/login"
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-brand-950 hover:bg-blue-brand-900 text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-colors"
              >
                Entrar na plataforma
                <ArrowRight size={18} />
              </Link>
              <a
                href="#planos"
                className="w-full sm:w-auto px-7 py-3.5 text-blue-brand-950/75 hover:text-blue-brand-950 font-semibold rounded-full border border-blue-brand-950/15 hover:border-blue-brand-950/35 transition-colors"
              >
                Ver planos
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="relative"
          >
            <div className="relative mx-auto w-full max-w-[560px]">
              <div className="absolute -bottom-7 left-5 right-5 h-10 bg-blue-brand-950/15 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] bg-blue-brand-950 text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Objetivo ativo</p>
                    <p className="font-editorial text-3xl leading-none mt-1">{current.title}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {goals.map((goal, idx) => (
                      <button
                        key={goal.key}
                        onClick={() => setActiveIdx(idx)}
                        aria-label={`Ver ${goal.title}`}
                        className={`h-2 rounded-full transition-all ${
                          activeIdx === idx ? "w-7 bg-primary-400" : "w-2 bg-white/35"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-[0.9fr_1.1fr] min-h-[360px]">
                  <div className="relative min-h-[260px] md:min-h-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={current.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={current.img}
                          alt={current.title}
                          fill
                          className="object-cover"
                          priority
                        />
                        <div className="absolute inset-0 bg-blue-brand-950/25" />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`metrics-${current.key}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35 }}
                      className="p-6 sm:p-8 flex flex-col justify-center gap-7"
                    >
                      <div>
                        <div className="flex justify-between text-xs text-white/50 mb-2">
                          <span>Sem rota clara</span>
                          <span>{current.tradPct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/12 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${current.tradPct}%` }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="h-full bg-white/40"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-primary-300">Com Synapta</span>
                          <span className="text-primary-300">{current.synaptaPct}%</span>
                        </div>
                        <div className="h-2 bg-white/12 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${current.synaptaPct}%` }}
                            transition={{ duration: 1.1, ease: "easeOut" }}
                            className="h-full bg-primary-400"
                          />
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-6">
                        <p className="font-editorial text-4xl leading-none text-white">
                          Rota antes de impulso.
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-white/55">
                          A plataforma traduz sonho, renda e carteira em decisões mensais.
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

