"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Brain, Shield, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const LOADING_STEPS = [
  { icon: Brain, text: "Analisando seu perfil de risco..." },
  { icon: BarChart3, text: "Simulando cenários de mercado..." },
  { icon: Shield, text: "Ajustando a alocação sugerida..." },
  { icon: Sparkles, text: "Preparando seu plano personalizado..." },
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
    <div className="relative flex flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-blue-brand-950 text-primary-400"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.3 }}
          >
            <Icon size={32} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Motor Synapta</p>
      <div className="relative z-10 h-12">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="font-editorial text-4xl leading-none text-blue-brand-950"
          >
            {step.text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative z-10 mt-8 flex gap-2">
        {LOADING_STEPS.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === currentStep ? 28 : 8,
              backgroundColor: i === currentStep ? "rgb(201 162 75)" : "rgba(11, 37, 69, 0.18)",
            }}
            transition={{ duration: 0.3 }}
            className="h-2 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}

