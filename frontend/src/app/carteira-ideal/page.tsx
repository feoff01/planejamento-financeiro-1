"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { DiagnosticoWizard } from "@/components/carteira-ideal/DiagnosticoWizard";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardPage() {
  const [isResultadoVisible, setIsResultadoVisible] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-blue-brand-950 md:flex">
      <Sidebar />

      <main className="min-h-screen flex-1 md:ml-64">
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-start px-5 py-10 md:px-10 md:py-12">
          <AnimatePresence initial={false}>
            {!isResultadoVisible && (
              <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="mb-10 w-full max-w-4xl text-center"
              >
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">
                  Carteira Ideal
                </p>
                <h1 className="font-editorial text-5xl leading-[0.95] md:text-7xl">
                  Construa uma rota de investimento que responde à sua vida.
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-blue-brand-950/60 md:text-base">
                  Responda o diagnóstico para transformar renda, patrimônio, objetivos e risco em uma estratégia inicial.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className={`w-full rounded-[1.5rem] border border-blue-brand-950/10 bg-white/60 p-5 shadow-[0_24px_80px_rgba(11,37,69,0.08)] backdrop-blur sm:p-8 ${
              isResultadoVisible ? "max-w-6xl" : "max-w-3xl"
            }`}
          >
            <DiagnosticoWizard onResultadoVisibleChange={setIsResultadoVisible} />
          </motion.div>

          {!isResultadoVisible && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-8 max-w-sm text-center text-xs text-blue-brand-950/40"
            >
              <ShieldCheck size={14} className="mr-1 inline-block align-[-2px]" />
              Seus dados financeiros são usados somente para gerar sua estratégia personalizada.
            </motion.p>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
