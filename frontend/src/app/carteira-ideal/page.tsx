"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DiagnosticoWizard } from "@/components/carteira-ideal/DiagnosticoWizard";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [isResultadoVisible, setIsResultadoVisible] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        <div className="fixed top-1/4 right-1/4 w-[400px] h-[400px] bg-primary-600/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-1/4 left-1/3 w-[300px] h-[300px] bg-gold-900/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-6 py-10 md:px-12 md:py-14 flex flex-col items-center justify-start min-h-screen">
          <AnimatePresence initial={false}>
            {!isResultadoVisible && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="text-center mb-10 max-w-xl"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400 mb-4">
                  <Sparkles size={12} className="animate-pulse" />
                  IA Synapta pronta para desenhar sua Carteira Ideal
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Vamos construir sua <span className="gradient-text">Carteira Ideal</span>
                </h1>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Responda as perguntas abaixo para que a IA Synapta possa definir onde você deve investir exatamente e desbloquear as ferramentas da plataforma.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={`w-full glass-panel rounded-3xl border border-white/5 p-5 sm:p-8 ${
              isResultadoVisible ? "max-w-5xl" : "max-w-3xl"
            }`}
          >
            <DiagnosticoWizard onResultadoVisibleChange={setIsResultadoVisible} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-xs text-zinc-700 text-center max-w-sm"
          >
            <ShieldCheck size={14} className="inline-block mr-1 align-[-2px]" />
            Seus dados financeiros são criptografados e usados somente para gerar sua estratégia personalizada.
          </motion.p>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
