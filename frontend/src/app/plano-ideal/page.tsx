"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { DiagnosticoWizard } from "@/components/plano-ideal/DiagnosticoWizard";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function PlanoIdealPage() {
  const [isTelaLarga, setIsTelaLarga] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-blue-brand-950 md:flex">
      <Sidebar />

      <main className="min-h-screen flex-1 md:ml-64">
        {/*
          Centralização com flex + m-auto (em vez de position:absolute + translate):
          etapas curtas continuam centralizadas na tela, e etapas mais altas que a
          viewport passam a rolar normalmente a partir do topo — sem conteúdo
          "preso" acima da área visível.
        */}
        <div className="relative z-10 flex min-h-screen px-5 py-6 md:px-10 md:py-8">
          <div className={`m-auto w-full ${isTelaLarga ? "max-w-6xl" : "max-w-3xl"}`}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className={`w-full rounded-[1.5rem] bg-white/60 p-5 sm:p-8 ${
                isTelaLarga ? "border border-blue-brand-950/10 shadow-[0_24px_80px_rgba(11,37,69,0.08)]" : ""
              }`}
            >
              <DiagnosticoWizard onResultadoVisibleChange={setIsTelaLarga} />
            </motion.div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
