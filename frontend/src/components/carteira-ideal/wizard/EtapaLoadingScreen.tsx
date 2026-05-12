"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Brain, BarChart3, Shield, Sparkles } from "lucide-react";

const LOADING_STEPS = [
  { icon: Brain, text: "Analisando seu perfil de risco...", color: "text-blue-400" },
  { icon: BarChart3, text: "Simulando 10.000 cenários de mercado...", color: "text-primary-400" },
  { icon: Shield, text: "Otimizando sua alocação de ativos...", color: "text-emerald-400" },
  { icon: Sparkles, text: "Preparando seu plano personalizado...", color: "text-gold-400" },
];

export function EtapaLoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const step = LOADING_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Glow de fundo */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-64 h-64 bg-primary-500/10 rounded-full blur-[100px]"
      />

      {/* Ícone principal pulsante */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-gold-500/20 border border-primary-500/30 flex items-center justify-center mb-8"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
            transition={{ duration: 0.4 }}
          >
            <Icon size={32} className={step.color} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Texto rotativo */}
      <div className="relative z-10 text-center h-12">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-semibold text-zinc-300"
          >
            {step.text}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="relative z-10 flex gap-2 mt-6">
        {LOADING_STEPS.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i === currentStep ? 1.3 : 1,
              backgroundColor: i === currentStep ? "rgb(245 158 11)" : "rgb(63 63 70)",
            }}
            transition={{ duration: 0.3 }}
            className="w-2 h-2 rounded-full"
          />
        ))}
      </div>

      {/* Barra de progresso sutil */}
      <div className="relative z-10 w-48 h-1 bg-blue-brand-800 rounded-full mt-6 overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500 to-transparent"
        />
      </div>

      <p className="relative z-10 text-[10px] text-zinc-600 mt-4 uppercase tracking-widest font-bold">
        Motor Synapta Processando
      </p>
    </div>
  );
}
