"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  ChevronRight,
  Search,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Carteiras inteligentes",
    desc: "Recomendações alinhadas ao seu perfil, usando indicadores financeiros e lógica de alocação.",
    detail:
      "A Synapta combina dados fundamentalistas, perfil de risco e objetivos pessoais para sugerir carteiras conservadoras, moderadas ou arrojadas com uma lógica clara de rebalanceamento.",
    stat: "150+ indicadores",
  },
  {
    icon: Search,
    title: "Pesquisa de ações",
    desc: "Um raio-x objetivo de empresas da bolsa, sem transformar análise em labirinto.",
    detail:
      "Consulte preço, histórico, múltiplos, rentabilidade, endividamento e leitura do negócio em uma experiência feita para decisão, não para excesso de abas.",
    stat: "400+ ativos",
  },
  {
    icon: Target,
    title: "Planejamento e objetivos",
    desc: "Metas transformadas em aportes, prazos e prioridades mensais.",
    detail:
      "A plataforma cruza renda, gastos, dívidas, reserva e objetivos para organizar a ordem certa de ação e mostrar quanto aportar para cada meta.",
    stat: "Rota mensal",
  },
  {
    icon: TrendingUp,
    title: "Otimizador de carteira",
    desc: "Risco e retorno tratados como projeto, não como sensação.",
    detail:
      "A Synapta usa conceitos de diversificação e fronteira eficiente para sugerir pesos mais coerentes entre os ativos da sua carteira.",
    stat: "Risco x retorno",
  },
  {
    icon: Bot,
    title: "Consultor Synapta",
    desc: "Perguntas sobre ativos, estratégia e uso da plataforma com contexto do seu perfil.",
    detail:
      "O consultor integra a lógica da plataforma para explicar decisões, comparar caminhos e ajudar você a entender o porquê de cada recomendação.",
    stat: "Contextual",
  },
];

type Feature = (typeof features)[number];

function ProductTape() {
  const metrics = [
    { label: "Carteira sugerida", value: "+14,2% a.a.", Icon: BarChart3 },
    { label: "Objetivo principal", value: "Casa própria", Icon: Target },
    { label: "Risco atual", value: "Moderado", Icon: TrendingUp },
  ];

  return (
    <div className="mt-14 overflow-hidden rounded-[1.5rem] bg-blue-brand-950 text-white">
      <div className="grid md:grid-cols-3">
        {metrics.map(({ label, value, Icon }) => (
          <div key={label} className="border-b md:border-b-0 md:border-r last:border-r-0 border-white/10 p-6">
            <Icon size={18} className="text-primary-400 mb-8" />
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">{label}</p>
            <p className="font-editorial text-4xl leading-none mt-2">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailModal({
  isOpen,
  onClose,
  feature,
}: {
  isOpen: boolean;
  onClose: () => void;
  feature: Feature | null;
}) {
  if (!feature) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-blue-brand-950/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            className="relative w-full max-w-xl overflow-hidden rounded-[1.5rem] bg-[#f7f3ea] text-blue-brand-950 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-blue-brand-950/8 flex items-center justify-center text-blue-brand-950/70 hover:text-blue-brand-950 transition-colors"
              aria-label="Fechar detalhes"
            >
              <X size={18} />
            </button>

            <div className="p-7 md:p-9">
              <div className="w-11 h-11 rounded-full bg-blue-brand-950 text-primary-400 flex items-center justify-center mb-7">
                <feature.icon size={20} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 mb-3">
                {feature.stat}
              </p>
              <h2 className="font-editorial text-5xl leading-none mb-5">{feature.title}</h2>
              <p className="text-base leading-relaxed text-blue-brand-950/65">{feature.detail}</p>
            </div>

            <div className="border-t border-blue-brand-950/10 p-5">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full bg-blue-brand-950 text-white font-semibold hover:bg-blue-brand-900 transition-colors"
              >
                Fechar detalhes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Solutions() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  return (
    <>
      <section className="py-16 md:py-28 bg-[#f7f3ea] relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-end mb-14">
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-[0.28em] mb-5">
                Plataforma
              </p>
              <h2 className="font-editorial text-5xl md:text-7xl leading-[0.95]">
                Uma rota única para decisões financeiras.
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-blue-brand-950/62 max-w-xl">
              Em vez de módulos soltos, a Synapta conecta diagnóstico, carteira, objetivos e recomendações em uma leitura contínua do seu patrimônio.
            </p>
          </div>

          <div className="divide-y divide-blue-brand-950/12 border-y border-blue-brand-950/12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="grid md:grid-cols-[64px_1fr_auto] gap-5 md:gap-8 items-center py-7"
              >
                <div className="w-12 h-12 rounded-full bg-blue-brand-950 text-primary-400 flex items-center justify-center">
                  <feature.icon size={20} />
                </div>
                <div>
                  <h3 className="font-editorial text-3xl md:text-4xl leading-none">{feature.title}</h3>
                  <p className="mt-2 text-sm md:text-base text-blue-brand-950/58 max-w-2xl">{feature.desc}</p>
                </div>
                <button
                  onClick={() => setSelectedFeature(feature)}
                  className="justify-self-start md:justify-self-end flex items-center gap-2 text-sm font-semibold text-blue-brand-950/70 hover:text-blue-brand-950 transition-colors"
                >
                  Saiba mais
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          <ProductTape />

          <div className="mt-12 flex justify-center">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 bg-blue-brand-950 hover:bg-blue-brand-900 text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-colors"
            >
              Alcançar meus objetivos
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <DetailModal
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        feature={selectedFeature}
      />
    </>
  );
}
