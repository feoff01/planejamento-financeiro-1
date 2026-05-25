"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { DiagnosticoWizard } from "@/components/plano-ideal/DiagnosticoWizard";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function PlanoIdealPage() {
  const [isResultadoVisible, setIsResultadoVisible] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-blue-brand-950 md:flex">
      <Sidebar />

      <main className="min-h-screen flex-1 md:ml-64">
        <div
          className={`relative z-10 min-h-screen px-5 py-6 md:px-10 md:py-8 ${
            isResultadoVisible ? "flex justify-center" : ""
          }`}
        >
          <div
            className={
              isResultadoVisible
                ? "w-full max-w-6xl"
                : "absolute left-1/2 top-1/2 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 px-5 md:px-0"
            }
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className={`w-full rounded-[1.5rem] bg-white/60 p-5 sm:p-8 ${
                isResultadoVisible ? "border border-blue-brand-950/10 shadow-[0_24px_80px_rgba(11,37,69,0.08)]" : ""
              }`}
            >
              <DiagnosticoWizard onResultadoVisibleChange={setIsResultadoVisible} />
            </motion.div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
