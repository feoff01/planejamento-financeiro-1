"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Cell,
  Pie,
  PieChart as RePie,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from "recharts";

type Props = {
  plano: PlanoEspecifico;
  onBack: () => void;
};

type TrafficStatus = "green" | "yellow" | "red";

type TrafficLightInfo = {
  status: TrafficStatus;
  title: string;
  desc: string;
  value: number;
};

export type PlanoEspecifico = {
  cta_label?: string;
  objetivos_registrados?: Array<{
    id: string;
    label: string;
    emoji?: string;
    detalhes?: {
      valor?: number;
      horizonte_anos?: number;
      prioridade?: number;
    };
  }>;
  portfolio: Record<string, number>;
  risk: {
    var_95: number;
  };
  simulation: {
    prob_meta: number | null;
  };
  analysis: {
    planScore: {
      score: number;
      rating: string;
    };
    trafficLight: Record<string, TrafficLightInfo> & {
      viability: TrafficLightInfo;
      portfolio_risk: TrafficLightInfo;
    };
  };
};

type ChartItem = {
  name: string;
  value: number;
};

const COLORS = ["#0B2545", "#C9A24B", "#1C4075", "#8A6B2E", "#5D7089", "#BFAE82"];

const STATUS_ICONS: Record<TrafficStatus, ReactNode> = {
  green: <CheckCircle2 size={15} className="text-emerald-600" />,
  yellow: <AlertCircle size={15} className="text-primary-700" />,
  red: <XCircle size={15} className="text-red-600" />,
};

const STATUS_BGS: Record<TrafficStatus, string> = {
  green: "border-emerald-500/20 bg-emerald-500/10",
  yellow: "border-primary-500/25 bg-primary-500/10",
  red: "border-red-500/20 bg-red-500/10",
};

export function OutputEspecifico({ plano, onBack }: Props) {
  const { portfolio, risk, simulation, analysis } = plano;

  const chartData: ChartItem[] = Object.entries(portfolio)
    .map(([name, value]) => ({
      name: name.replace(/_/g, " ").toUpperCase(),
      value: Number(value) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-10 text-blue-brand-950"
    >
      <section className="rounded-[1.5rem] bg-blue-brand-950 p-5 text-white sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/65 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Voltar ao diagnóstico"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="text-right">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">Score do plano</p>
            <div className="flex items-baseline justify-end gap-2">
              <span className="font-editorial text-7xl leading-none">{analysis.planScore.score}</span>
              <span className="text-sm font-bold text-white/40">/100</span>
            </div>
            <span className="mt-3 inline-flex rounded-full bg-primary-400 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-brand-950">
              {analysis.planScore.rating}
            </span>
          </div>
        </div>

        <div className="mt-10 max-w-2xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-primary-300">
            <Trophy size={25} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-300">Carteira ideal completa</p>
          <h2 className="mt-4 font-editorial text-5xl leading-[0.95] md:text-7xl">
            O plano detalhado para a próxima decisão.
          </h2>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.78fr]">
        <div className="rounded-[1.5rem] border border-blue-brand-950/10 bg-white/55 p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <PieChart size={18} className="text-primary-700" />
            <h3 className="text-sm font-bold text-blue-brand-950">Alocação por ativos</h3>
          </div>

          <div className="mb-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie data={chartData} innerRadius={68} outerRadius={92} paddingAngle={4} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: "#0B2545",
                    border: "none",
                    borderRadius: "14px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
              </RePie>
            </ResponsiveContainer>
          </div>

          <div className="divide-y divide-blue-brand-950/10 border-y border-blue-brand-950/10">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate text-xs font-bold tracking-[0.08em] text-blue-brand-950/70">{item.name}</span>
                </div>
                <span className="font-editorial text-3xl leading-none text-blue-brand-950">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <MetricCard
            icon={TrendingUp}
            title="Probabilidade de sucesso"
            value={simulation.prob_meta === null ? "Estratégia montada" : `${(simulation.prob_meta * 100).toFixed(0)}%`}
            desc={analysis.trafficLight.viability.desc}
            status={analysis.trafficLight.viability.status}
          />
          <MetricCard
            icon={ShieldCheck}
            title="Risco estimado"
            value={`${(risk.var_95 * 100).toFixed(1)}%`}
            desc="Máxima queda estimada em cenários de estresse."
            status={analysis.trafficLight.portfolio_risk.status}
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-blue-brand-950/10 bg-white/55 p-5 sm:p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-blue-brand-950/40">
          Análise de robustez
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.entries(analysis.trafficLight).map(([key, info]) => {
            if (key === "viability" || key === "portfolio_risk") return null;
            return (
              <div key={key} className={`rounded-2xl border p-4 ${STATUS_BGS[info.status]}`}>
                <div className="mb-3 flex items-center gap-2">
                  {STATUS_ICONS[info.status]}
                  <span className="text-sm font-bold text-blue-brand-950">{info.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-blue-brand-950/60">{info.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <button
        onClick={() => {
          window.location.href = "/dashboard";
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
      >
        <Zap size={16} />
        Salvar plano e finalizar
      </button>
    </motion.div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  desc,
  status,
}: {
  icon: typeof TrendingUp;
  title: string;
  value: string;
  desc: string;
  status: TrafficStatus;
}) {
  return (
    <div className={`rounded-[1.5rem] border p-5 ${STATUS_BGS[status]}`}>
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-blue-brand-950 text-primary-300">
        <Icon size={23} />
      </div>
      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-brand-950/40">{title}</h4>
      <p className="mt-2 font-editorial text-5xl leading-none text-blue-brand-950">{value}</p>
      <p className="mt-4 text-xs font-medium leading-relaxed text-blue-brand-950/60">{desc}</p>
    </div>
  );
}
