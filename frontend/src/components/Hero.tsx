"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const goals = [
  {
    key: "house",
    title: "Casa Própria",
    img: "/dream_house.png",
    tradPct: 23,
    synaptaPct: 85,
  },
  {
    key: "car",
    title: "Carro dos Sonhos",
    img: "/dream_car.png",
    tradPct: 30,
    synaptaPct: 91,
  },
  {
    key: "travel",
    title: "Viagem Internacional",
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
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = goals[activeIdx];

  return (
    <section className="relative lg:min-h-screen flex items-center justify-center pt-28 pb-8 lg:pt-24 lg:pb-20 overflow-hidden">

      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-gold-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 w-full max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-16">

          {/* ── LEFT COLUMN ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 lg:mb-6 leading-tight">
              Acelere a conquista do seu <br className="hidden lg:block" />
              <span className="gradient-text">próximo grande sonho.</span>
            </h1>

            {/* Desktop subtitle */}
            <p className="hidden lg:block text-base sm:text-lg text-zinc-400 mb-6 lg:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Seu carro zero, a casa própria ou a aposentadoria antecipada não precisam ser uma realidade distante. A Inteligência Artificial da Synapta analisa sua vida, corrige seus investimentos e cria a rota otimizada para você multiplicar seu patrimônio em menos tempo.
            </p>
            {/* Mobile subtitle */}
            <p className="lg:hidden text-sm text-zinc-400 mb-3 max-w-xs mx-auto text-center leading-relaxed">
              A Synapta analisa sua vida financeira e cria a rota mais rápida para você conquistar seus sonhos.
            </p>

          </motion.div>

          {/* ── RIGHT COLUMN — Auto Slider ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full max-w-lg lg:max-w-none"
          >
            <div className="glass-panel p-5 sm:p-8 rounded-3xl relative">

              {/* Image slide */}
              <div className="mb-5 relative overflow-hidden rounded-2xl border border-white/5 shadow-2xl" style={{ height: "280px" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.key}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={current.img}
                      alt={current.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-70" />

                    {/* Goal title */}
                    <div className="absolute bottom-4 left-4 right-4 z-10">
                      <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-1 drop-shadow-md">
                        Objetivo Mapeado
                      </p>
                      <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                        {current.title}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Dot indicators */}
                <div className="absolute top-4 right-4 flex gap-1.5 z-20 items-center">
                  {goals.map((g, i) => (
                    <button
                      key={g.key}
                      onClick={() => setActiveIdx(i)}
                      className={`block h-1.5 rounded-full transition-all duration-300 ${
                        activeIdx === i
                          ? "bg-primary-500 w-4 shadow-[0_0_8px_rgba(201, 162, 75,0.8)]"
                          : "bg-white/40 w-1.5"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Progress bars */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`bars-${current.key}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  {/* Sem Synapta */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-zinc-500 font-medium">Sem Synapta</span>
                      <span className="text-xs font-mono text-zinc-500">{current.tradPct}% do objetivo</span>
                    </div>
                    <div className="w-full bg-surface-light rounded-full h-2 overflow-hidden border border-border/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${current.tradPct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-zinc-700 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Com Synapta */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-primary-400 font-bold flex items-center gap-1.5">
                        <Sparkles size={13} className="animate-pulse" /> Com Synapta
                      </span>
                      <span className="text-xs font-mono font-bold text-primary-500">{current.synaptaPct}% do objetivo</span>
                    </div>
                    <div className="w-full bg-surface-light rounded-full h-3 overflow-hidden border border-border/30 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${current.synaptaPct}%` }}
                        transition={{ duration: 1.4, delay: 0.15, type: "spring", stiffness: 45, damping: 15 }}
                        className="h-full bg-gradient-to-r from-primary-700 via-primary-500 to-gold-300 rounded-full relative overflow-hidden"
                      >
                        <motion.div
                          animate={{ x: ["-100%", "400%"] }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[30deg]"
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* CTA Button */}
              <Link
                href="/auth/login"
                className="mt-6 w-full justify-center px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-gold-500 text-blue-brand-950 font-semibold rounded-full flex items-center gap-2 glow-effect transition-all cursor-pointer relative z-20"
              >
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Alcançar meus objetivos
                  <ArrowRight size={20} />
                </motion.div>
              </Link>

              {/* Decorative glow */}
              <div className="absolute bottom-0 right-0 left-0 h-1/2 bg-gradient-to-t from-primary-500/10 to-transparent pointer-events-none rounded-b-3xl" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
