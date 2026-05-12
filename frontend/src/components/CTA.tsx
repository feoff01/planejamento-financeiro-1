"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";

export function CTA() {
  return (
    <section className="py-12 md:py-24 bg-surface relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[500px] bg-primary-600/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center mb-8 border border-primary-500/20 shadow-[0_0_40px_rgba(201, 162, 75,0.2)]">
            <Clock className="text-primary-500" size={32} />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Seu eu do futuro está te agradecendo pela decisão de <span className="gradient-text">hoje.</span>
          </h2>
          
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
            Quanto mais você adia sua organização, mais distante fica o seu sonho. O tempo não para. <strong>Você vai acelerar ou ficar para trás?</strong>
          </p>
          
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-gold-500 text-blue-brand-950 font-semibold rounded-full flex items-center justify-center gap-2 glow-effect transition-all cursor-pointer mx-auto"
          >
            <motion.div
              className="flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Caminho da prosperidade
              <ArrowRight size={20} />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
