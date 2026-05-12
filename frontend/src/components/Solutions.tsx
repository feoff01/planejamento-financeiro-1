"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Target, TrendingUp, Bot, Sparkles, X, ChevronRight, BrainCircuit, ArrowRight } from "lucide-react";

/* ─── Animated Mockups ─── */

function ScreeningMockup() {
  return (
    <div className="w-full h-full bg-blue-brand-950 p-4 flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <span className="text-gold-400 font-bold text-sm">PETR4</span>
        <span className="text-green-400 text-xs">▲ +2,14%</span>
      </div>
      <div className="flex items-end gap-1 h-14">
        {[55,45,60,40,70,50,80,55,75,90,65,85].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
            className={`flex-1 rounded-sm ${i === 11 ? "bg-gold-400" : i % 2 === 0 ? "bg-zinc-600" : "bg-zinc-700"}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[["P/L", "7.2"], ["ROE", "18%"], ["Div. Yield", "11%"], ["P/VP", "0.9"]].map(([label, val]) => (
          <div key={label} className="bg-blue-brand-900 rounded-lg px-2 py-1.5 flex justify-between">
            <span className="text-zinc-500">{label}</span>
            <span className="text-zinc-200 font-semibold">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceiroMockup() {
  return (
    <div className="w-full h-full bg-blue-brand-950 p-4 flex flex-col gap-3 text-xs">
      <p className="text-zinc-400 font-medium text-[11px] uppercase tracking-wider">Seus objetivos</p>
      {[
        { label: "Casa Própria", pct: 42, color: "bg-gold-500" },
        { label: "Reserva de Emergência", pct: 78, color: "bg-emerald-500" },
        { label: "Aposentadoria", pct: 15, color: "bg-blue-500" },
      ].map((g) => (
        <div key={g.label}>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-300">{g.label}</span>
            <span className="text-zinc-500">{g.pct}%</span>
          </div>
          <div className="w-full bg-blue-brand-800 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${g.pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className={`${g.color} h-1.5 rounded-full`}
            />
          </div>
        </div>
      ))}
      <div className="mt-1 bg-blue-brand-900 rounded-xl p-3 flex justify-between items-center">
        <span className="text-zinc-400 text-[11px]">Aporte mensal sugerido</span>
        <span className="text-gold-400 font-bold text-sm">R$ 1.250</span>
      </div>
    </div>
  );
}

function CarteiraMockup() {
  const slices = [
    { pct: 40, color: "#f59e0b", label: "IVVB11" },
    { pct: 30, color: "#6366f1", label: "KNRI11" },
    { pct: 20, color: "#22d3ee", label: "PETR4" },
    { pct: 10, color: "#34d399", label: "SELIC" },
  ];
  let cumulative = 0;
  const r = 30, cx = 40, cy = 40, circumference = 2 * Math.PI * r;
  return (
    <div className="w-full h-full bg-blue-brand-950 p-4 flex flex-col gap-3 text-xs">
      <p className="text-zinc-400 font-medium text-[11px] uppercase tracking-wider">Alocação otimizada</p>
      <div className="flex items-center gap-4">
        <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth="12" />
          {slices.map((s, i) => {
            const offset = circumference * (1 - cumulative / 100);
            const dash = circumference * (s.pct / 100);
            const el = (
              <motion.circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
              />
            );
            cumulative += s.pct;
            return el;
          })}
        </svg>
        <div className="flex flex-col gap-1.5 flex-1">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-zinc-300">{s.label}</span>
              </div>
              <span className="text-zinc-500">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-blue-brand-900 rounded-xl p-2.5 flex justify-between">
        <span className="text-zinc-500">Retorno esperado</span>
        <span className="text-emerald-400 font-bold">+14,2% a.a.</span>
      </div>
    </div>
  );
}

function ChatMockup() {
  const msgs = [
    { from: "user", text: "PETR4 vale a pena agora?" },
    { from: "ai", text: "Com base no seu perfil moderado: P/L de 7.2 está abaixo da média. Dividend yield de 11% é atrativo. Sugiro até 15% da carteira." },
    { from: "user", text: "E IVVB11?" },
  ];
  return (
    <div className="w-full h-full bg-blue-brand-950 p-4 flex flex-col gap-2.5 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
          <Sparkles size={10} className="text-blue-brand-950" />
        </div>
        <span className="text-zinc-300 font-semibold text-[11px]">Synapta IA</span>
      </div>
      {msgs.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.25, duration: 0.3 }}
          className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
            m.from === "user"
              ? "ml-auto bg-gold-500/20 text-gold-100 rounded-br-sm"
              : "bg-blue-brand-800 text-zinc-200 rounded-bl-sm"
          }`}
        >
          {m.text}
        </motion.div>
      ))}
      <div className="mt-auto flex gap-2 bg-blue-brand-900 rounded-xl px-3 py-2">
        <span className="text-zinc-600 flex-1">Pergunte algo...</span>
        <Bot size={14} className="text-gold-500" />
      </div>
    </div>
  );
}

function AiPortfolioMockup() {
  return (
    <div className="w-full h-full bg-blue-brand-950 p-5 flex flex-col gap-3 font-mono text-xs relative overflow-hidden">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03]">
        <BrainCircuit size={120} className="text-gold-500" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
         <div className="flex flex-col">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
               <Bot size={12} className="text-gold-500" />
               Mix recomendado pela IA
            </span>
            <span className="text-zinc-100 font-bold text-sm">Carteira Crescimento</span>
         </div>
         <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
           Alta Confiança
         </span>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-end mt-1 mb-2">
         <div className="flex flex-col gap-0.5">
            <span className="text-zinc-500 text-[10px]">Retorno projetado (12m)</span>
            <span className="text-emerald-400 font-bold text-lg">+24,5%</span>
         </div>
         <div className="flex flex-col gap-1 text-right">
            <span className="text-zinc-500 text-[10px]">Risco (Volatilidade)</span>
            <div className="flex gap-1 justify-end">
               <div className="w-3 h-1.5 bg-gold-500 rounded-sm"></div>
               <div className="w-3 h-1.5 bg-gold-500 rounded-sm"></div>
               <div className="w-3 h-1.5 bg-blue-brand-800 rounded-sm"></div>
            </div>
         </div>
      </div>

      {/* Assets Allocation */}
      <div className="flex-1 relative z-10 flex flex-col gap-2 mt-1">
         <div className="text-[9px] text-zinc-500 flex justify-between px-1 uppercase tracking-widest font-sans">
            <span>Ativo</span>
            <span>Alocação sugerida</span>
         </div>
         {[
           { ticker: "WEGE3", pct: "25%" },
           { ticker: "PRIO3", pct: "20%" },
           { ticker: "RENT3", pct: "15%" },
           { ticker: "PETR4", pct: "10%" },
         ].map((t, i) => (
           <div key={t.ticker} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs px-1">
                 <span className="text-zinc-200 font-semibold">{t.ticker}</span>
                 <span className="text-gold-400">{t.pct}</span>
              </div>
              <div className="w-full h-1.5 bg-blue-brand-800 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: t.pct }}
                   transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                   className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full" 
                 />
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}

/* ─── Cards data ─── */

const features = [
  {
    icon: BrainCircuit,
    title: "Carteiras Inteligentes: Recomendadas por IA",
    desc: "O futuro do mercado financeiro somado ao futuro da tecnologia na sua mão. Acesse carteiras otimizadas por nossa IA, treinada com centenas de indicadores financeiros.",
    Mockup: AiPortfolioMockup,
    accent: true,
    fullWidth: true,
    details: {
      subtitle: "Treinamento Exclusivo Synapta",
      content: "Nossa inteligência artificial não apenas segue tendências. Ela foi treinada pela equipe da Synapta utilizando uma vasta base de dados históricos e indicadores fundamentalistas (P/L, ROE, Dívida/EBITDA, etc.) para identificar padrões de crescimento que o olho humano pode deixar passar.",
      stats: [
        { label: "Indicadores Analisados", value: "150+" },
        { label: "Atualização", value: "Em Tempo Real" },
        { label: "Perfil", value: "Personalizado" }
      ],
      features: [
        "Carteira Conservadora: Foco em dividendos e proteção de capital.",
        "Carteira Moderada: Equilíbrio entre crescimento e proventos.",
        "Carteira Arrojada: Máximo potencial de valorização com IA.",
        "Rebalanceamento sugerido automaticamente baseado no mercado."
      ]
    }
  },
  {
    icon: Search,
    title: "Pesquise qualquer ação da bolsa",
    desc: "Dados fundamentalistas e preço atual explicados de forma simples para você tomar decisões rápidas.",
    Mockup: ScreeningMockup,
    accent: false,
    details: {
      subtitle: "Screening Completo",
      content: "Tenha acesso a um raio-x completo de qualquer ativo listado na B3. Nossa ferramenta simplifica indicadores complexos para que investidores de qualquer nível possam entender a saúde real de uma empresa.",
      stats: [
        { label: "Ativos Mapeados", value: "400+" },
        { label: "Dados Históricos", value: "5 Anos" },
        { label: "Delay", value: "0ms" }
      ],
      features: [
        "Preço atual e histórico de variação.",
        "Indicadores de preço (P/L, P/VP, EV/EBITDA).",
        "Indicadores de rentabilidade (ROE, ROIC, Margens).",
        "Descrição detalhada do modelo de negócio da empresa."
      ]
    }
  },
  {
    icon: Target,
    title: "Planejamento e Objetivos",
    desc: "A gente monta o plano de aportes mês a mês para você chegar nos seus sonhos, controlando dívidas e reserva.",
    Mockup: FinanceiroMockup,
    accent: true,
    details: {
      subtitle: "Sua Estrada para a Liberdade",
      content: "O Synapta transforma seus sonhos em números reais. Ao inserir sua renda, gastos e metas, geramos um plano de aportes otimizado que considera a quitação de dívidas e a construção da sua reserva de segurança primeiro.",
      stats: [
        { label: "Projeção", value: "Juros Compostos" },
        { label: "Foco", value: "Priorização" },
        { label: "Gestão", value: "Dívidas" }
      ],
      features: [
        "Aba de Objetivos: transforme metas em realidade.",
        "Gestor de Dívidas: as maiores taxas são priorizadas automaticamente.",
        "Cálculo de Reserva de Emergência: 6 meses de segurança.",
        "Projeção de Patrimônio interativa de longo prazo."
      ]
    }
  },
  {
    icon: TrendingUp,
    title: "Otimizador de Carteira",
    desc: "A matemática de prêmio Nobel aplicada à sua carteira para maximizar o retorno e minimizar o risco.",
    Mockup: CarteiraMockup,
    accent: true,
    details: {
      subtitle: "Fronteira Eficiente",
      content: "Utilizamos o modelo matemático de Harry Markowitz para analisar a correlação entre seus ativos. O sistema sugere o peso ideal para cada ação na sua carteira visando o maior retorno possível para o nível de risco que você aceita.",
      stats: [
        { label: "Algoritmo", value: "Markowitz" },
        { label: "Base", value: "Matemática" },
        { label: "Objetivo", value: "Sharpe Ratio" }
      ],
      features: [
        "Cálculo automático da Fronteira Eficiente.",
        "Sugestão de compra/venda para rebalanceamento.",
        "Análise de variância e desvio padrão dos ativos.",
        "Visualização clara de risco vs retorno."
      ]
    }
  },
  {
    icon: Bot,
    title: "Consultor Synapta Chat IA",
    desc: "Tire dúvidas sobre ações, estratégias ou como usar a plataforma com nossa IA dedicada.",
    Mockup: ChatMockup,
    accent: true,
    details: {
      subtitle: "Assistência 24/7",
      content: "Nunca mais se sinta sozinho na hora de investir. O Consultor IA integra seus dados de perfil e carteira para dar respostas contextuais, agindo como um analista financeiro de bolso disponível a qualquer momento.",
      stats: [
        { label: "Disponibilidade", value: "24/7" },
        { label: "Contexto", value: "Sua Carteira" },
        { label: "Suporte", value: "Ativos/Plataforma" }
      ],
      features: [
        "Perguntas sobre qualquer ticker da B3.",
        "Dúvidas sobre conceitos de investimentos.",
        "Ajuda personalizada baseada no seu perfil de risco.",
        "Acesso rápido às ferramentas da Synapta."
      ]
    }
  },
];

/* ─── Detail Modal Component ─── */

function DetailModal({ isOpen, onClose, feature }: { isOpen: boolean; onClose: () => void; feature: typeof features[0] | null }) {
  if (!feature) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 mt-16 md:mt-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-blue-brand-950/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-blue-brand-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] mt-4"
          >
            {/* Close Button */}
            <button
               onClick={onClose}
               className="absolute top-4 right-4 w-8 h-8 z-20 rounded-full bg-blue-brand-800/50 flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/10 cursor-pointer"
            >
               <X size={18} />
            </button>

            {/* Body */}
            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                  <feature.icon size={20} />
                </div>
                <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">
                  {feature.details.subtitle}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {feature.title}
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-8">
                {feature.details.content}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                {feature.details.stats.map((s, idx) => (
                  <div key={idx} className="bg-blue-brand-800/50 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{s.label}</p>
                    <p className="text-sm font-bold text-zinc-200">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Feature List */}
              <div className="space-y-4 mb-4">
                 <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                    O que está incluído:
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {feature.details.features.map((item, idx) => (
                     <div key={idx} className="flex gap-2 text-sm text-zinc-400">
                        <ChevronRight size={16} className="text-primary-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-blue-brand-900/50 shrink-0">
               <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-primary-500 text-blue-brand-950 font-bold hover:bg-primary-400 transition-all shadow-[0_8px_20px_-6px_rgba(201, 162, 75,0.4)] cursor-pointer"
               >
                  Fechar Detalhes
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Section ─── */

export function Solutions() {
  const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

  return (
    <>
      <section className="py-12 md:py-24 bg-background relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">

          {/* Header */}
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-3"
            >
              Funcionalidades
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              O que a Synapta{" "}
              <span className="gradient-text">Oferece?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-zinc-400 max-w-xl mx-auto"
            >
              Ferramentas reais para cada parte da sua jornada financeira.
            </motion.p>
          </div>

          {/* Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group glass-panel rounded-3xl overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(201, 162, 75,0.12)] ${
                  f.fullWidth ? "md:col-span-2" : ""
                } ${f.accent ? "border-primary-500/20" : "border-border"}`}
              >
                <div className={`flex flex-col ${f.fullWidth ? "md:flex-row h-full" : ""}`}>
                  {/* Mockup area */}
                  <div className={`relative overflow-hidden border-blue-brand-900 border-opacity-50 ${f.fullWidth ? "md:w-1/2 h-64 md:h-auto md:border-r border-b" : "h-48 border-b"}`}>
                    <f.Mockup />
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-blue-brand-950/90 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Content */}
                  <div className={`p-8 flex flex-col gap-4 flex-1 ${f.fullWidth ? "md:justify-center" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-lg ${f.accent ? "bg-primary-500/10 text-primary-400" : "bg-blue-brand-800 text-zinc-400"}`}>
                        <f.icon size={18} />
                      </div>
                      {f.fullWidth && (
                         <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Destaque</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary-300 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {f.desc}
                    </p>
                    <button
                      onClick={() => setSelectedFeature(f)}
                      className="mt-2 flex items-center gap-2 text-xs font-bold text-primary-500 hover:text-primary-400 transition-colors group/btn cursor-pointer"
                    >
                      SAIBA MAIS
                      <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="mt-16 flex justify-center">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto min-w-[320px] justify-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-gold-500 text-blue-brand-950 font-semibold rounded-full flex items-center gap-2 glow-effect transition-all cursor-pointer relative z-20"
            >
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Alcançar meus objetivos
                <ArrowRight size={20} />
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* Modal out of section context */}
      <DetailModal
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        feature={selectedFeature}
      />
    </>
  );
}
