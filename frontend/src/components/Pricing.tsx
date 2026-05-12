"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Search, Eye, BarChart2, Sparkles, Target, TrendingUp, Bot, Lock } from "lucide-react";

const freePlan = {
  name: "Gratuito",
  subtitle: "Explore sem compromisso",
  price: "R$ 0",
  cta: "Criar conta grátis",
  features: [
    {
      icon: Search,
      title: "Pesquisa de Ações",
      desc: "Indicadores, gráfico e tudo que você precisa saber sobre qualquer empresa na bolsa.",
    },
    {
      icon: Eye,
      title: "Prévia do seu plano",
      desc: "Veja um gostinho das nossas recomendações personalizadas — sem pagar nada.",
    },
    {
      icon: BarChart2,
      title: "Sua carteira organizada",
      desc: "Coloque seus investimentos atuais e visualize tudo em gráficos simples e claros.",
    },
  ],
};

const proPlan = {
  name: "Synapta Pro",
  subtitle: "Tudo que você precisa para ir mais longe",
  price: "R$ 49,90",
  period: "/mês",
  cta: "Começar agora",
  features: [
    {
      icon: Sparkles,
      title: "Carteira Synapta completa",
      desc: "Recomendações feitas para o seu perfil: Conservador, Moderado ou Arrojado.",
    },
    {
      icon: Target,
      title: "Controle financeiro total",
      desc: "Seus objetivos, dívidas e reserva de emergência organizados em um só lugar.",
    },
    {
      icon: TrendingUp,
      title: "Análise inteligente da carteira",
      desc: "A matemática a seu favor: otimizamos seus ativos para maximizar retorno e reduzir risco.",
    },
    {
      icon: Bot,
      title: "Chat com IA",
      desc: "Tire qualquer dúvida sobre investimentos ou a plataforma a qualquer hora, sem enrolação.",
    },
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
  title = "Comece de graça. Evolua quando estiver pronto.",
  subtitle = "Não custa caro. Caro é o tempo que você perde tentando ir sem um guia."
}: PricingProps) {
  return (
    <section id="planos" className={`${compact ? '' : 'py-12 md:py-24 bg-background'} relative overflow-hidden`}>
      {/* Background glow */}
      {!compact && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[140px] pointer-events-none" />
      )}

      <div className={`${compact ? '' : 'container mx-auto px-6 max-w-5xl'} relative z-10`}>

        {/* Header */}
        {!compact && (
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-3"
          >
            Planos
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-xl mx-auto"
          >
            {subtitle}
          </motion.p>
        </div>
        )}

        {/* Cards */}
        <div className={`grid grid-cols-1 ${showFree ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-6 items-start`}>

          {/* Free Plan */}
          {showFree && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glass-panel rounded-3xl p-8 border border-border relative"
            >
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{freePlan.name}</p>
              <h3 className="text-2xl font-bold text-white mb-1">{freePlan.subtitle}</h3>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-black text-white">{freePlan.price}</span>
                <span className="text-zinc-500 mb-1 text-sm">para sempre</span>
              </div>
            </div>

            <ul className="space-y-5 mb-8">
              {freePlan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-brand-800 border border-zinc-700 flex items-center justify-center">
                    <f.icon size={16} className="text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Lock hint */}
            <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl bg-blue-brand-900/60 border border-blue-brand-800">
              <Lock size={13} className="text-zinc-600 shrink-0" />
              <p className="text-xs text-zinc-600">Recomendações completas disponíveis no plano Pro</p>
            </div>

            <Link 
              href="/auth/login"
              className="w-full py-3.5 rounded-full font-semibold text-sm bg-surface-light text-white border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer flex items-center justify-center"
            >
              {freePlan.cta}
            </Link>
          </motion.div>
          )}

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative rounded-3xl p-8 border border-primary-500/50 bg-gradient-to-b from-blue-brand-900 to-black shadow-[0_0_50px_rgba(201, 162, 75,0.08)]"
          >
            {/* Most popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-gold-400 text-blue-brand-950 text-xs font-black px-5 py-1.5 rounded-full shadow-lg tracking-wide">
              ✦ MAIS ESCOLHIDO
            </div>

            {/* Glow corner */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="mb-6 relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-1">{proPlan.name}</p>
              <h3 className="text-2xl font-bold text-white mb-1">{proPlan.subtitle}</h3>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-black text-white">{proPlan.price}</span>
                <span className="text-zinc-400 mb-1 text-sm">{proPlan.period}</span>
              </div>
            </div>

            <ul className="space-y-5 mb-8 relative z-10">
              {proPlan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                    <f.icon size={16} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/auth/login"
              className="relative z-10 w-full py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-primary-500 to-gold-400 text-blue-brand-950 hover:from-primary-600 hover:to-gold-400 glow-effect transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <motion.div
                className="flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles size={15} />
                {proPlan.cta}
              </motion.div>
            </Link>
          </motion.div>

        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-zinc-600 mt-8 max-w-lg mx-auto leading-relaxed"
        >
          Investir envolve riscos. As recomendações da plataforma são educacionais e não constituem assessoria de valores mobiliários regulamentada pela CVM.
        </motion.p>
      </div>
    </section>
  );
}
