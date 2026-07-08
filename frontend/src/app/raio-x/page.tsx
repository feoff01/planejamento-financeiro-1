"use client";

import { motion } from "framer-motion";

import { MobileNav } from "@/components/dashboard/MobileNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { RaioXExperience } from "@/components/raio-x/RaioXExperience";

export default function RaioXPage() {
  return (
    <div className="min-h-screen bg-[#f7f3ea] text-blue-brand-950 md:flex">
      <Sidebar />

      <main className="min-h-screen flex-1 md:ml-64">
        <div className="relative z-10 min-h-screen px-5 py-6 md:px-10 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="w-full rounded-[1.5rem] border border-blue-brand-950/10 bg-white/60 p-5 shadow-[0_24px_80px_rgba(11,37,69,0.08)] sm:p-8"
            >
              <RaioXExperience />
            </motion.div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
