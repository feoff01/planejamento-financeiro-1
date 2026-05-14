"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart2, Bot, Eye, Lock, Search, Sparkles, Target, TrendingUp } from "lucide-react";

const freePlan = {
  name: "Gratuito",
  subtitle: "Explore sem compromisso",
  price: "R$ 0",
  cta: "Criar conta grátis",
  features: [
    { icon: Search, title: "Pesquisa de ações" },
    { icon: Eye, title: "Prévia do seu plano" },
    { icon: BarChart2, title: "Carteira organizada" },
  ],
};

const proPlan = {
  name: "Synapta Pro",
  subtitle: "Direção completa para o seu patrimônio",
  price: "R$ 49,90",
  period: "/mês",
  cta: "Começar agora",
  features: [
    { icon: Sparkles, title: "Carteira Synapta completa" },
    { icon: Target, title: "Objetivos, dívidas e reserva" },
    { icon: TrendingUp, title: "Análise inteligente da carteira" },
    { icon: Bot, title: "Consultor Synapta" },
  ],
};

type PricingProps = {
  showFree?: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
};

export function Pricing({
  showFree = true,
  compact = false,
  title = "Comece simples. Evolua quando a rota pedir.",
  subtitle = "O plano gratuito deixa você conhecer a lógica. O Pro transforma a plataforma em acompanhamento financeiro contínuo.",
}: PricingProps) {
  return (
    <section id="planos" className={`${compact ? "" : "py-16 md:py-28 bg-[#f7f3ea]"} relative overflow-hidden`}>
      <div className={`${compact ? "" : "container mx-auto px-6 max-w-5xl"} relative z-10`}>
        {!compact && (
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-[0.28em] mb-5">
              Planos
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-editorial text-5xl md:text-7xl leading-[0.95] max-w-3xl mx-auto"
            >
              {title}
            </motion.h2>
            <p className="mt-6 text-lg text-blue-brand-950/62 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>
        )}

        <div className={`grid grid-cols-1 ${showFree ? "md:grid-cols-2" : "max-w-md mx-auto"} gap-5 items-stretch`}>
          {showFree && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="rounded-[1.5rem] border border-blue-brand-950/12 bg-white/45 p-7 md:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-brand-950/45">
                {freePlan.name}
              </p>
              <h3 className="font-editorial text-4xl leading-none mt-3">{freePlan.subtitle}</h3>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold">{freePlan.price}</span>
                <span className="text-blue-brand-950/50 mb-1 text-sm">para sempre</span>
              </div>

              <ul className="space-y-4 mt-8">
                {freePlan.features.map((feature) => (
                  <li key={feature.title} className="flex items-center gap-3 text-sm text-blue-brand-950/72">
                    <feature.icon size={17} className="text-blue-brand-950/55" />
                    {feature.title}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center gap-2 text-xs text-blue-brand-950/45">
                <Lock size={13} />
                Recomendações completas ficam no Pro
              </div>

              <Link
                href="/auth/login"
                className="mt-8 w-full py-3.5 rounded-full font-semibold text-sm border border-blue-brand-950/18 text-blue-brand-950 hover:border-blue-brand-950/36 transition-colors flex items-center justify-center"
              >
                {freePlan.cta}
              </Link>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="rounded-[1.5rem] bg-blue-brand-950 text-white p-7 md:p-8 relative overflow-hidden"
          >
            <div className="absolute top-5 right-5 rounded-full bg-primary-400 text-blue-brand-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]">
              Mais escolhido
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-300">
              {proPlan.name}
            </p>
            <h3 className="font-editorial text-4xl leading-none mt-3 max-w-sm">{proPlan.subtitle}</h3>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-semibold">{proPlan.price}</span>
              <span className="text-white/50 mb-1 text-sm">{proPlan.period}</span>
            </div>

            <ul className="space-y-4 mt-8">
              {proPlan.features.map((feature) => (
                <li key={feature.title} className="flex items-center gap-3 text-sm text-white/72">
                  <feature.icon size={17} className="text-primary-300" />
                  {feature.title}
                </li>
              ))}
            </ul>

            <Link
              href="/auth/login"
              className="mt-8 w-full py-3.5 rounded-full font-semibold text-sm bg-primary-400 text-blue-brand-950 hover:bg-primary-500 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={15} />
              {proPlan.cta}
            </Link>
          </motion.div>
        </div>

        <p className="text-center text-xs text-blue-brand-950/45 mt-8 max-w-lg mx-auto leading-relaxed">
          Investir envolve riscos. As recomendações da plataforma são educacionais e não constituem assessoria de valores mobiliários regulamentada pela CVM.
        </p>
      </div>
    </section>
  );
}
