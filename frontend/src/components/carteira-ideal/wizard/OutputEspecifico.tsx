"use client";

import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  TrendingUp, 
  PieChart, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trophy,
  Zap
} from "lucide-react";
import { 
  PieChart as RePie, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip,
} from "recharts";
import type { ReactNode } from "react";

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

const COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#64748B"];

const STATUS_ICONS: Record<TrafficStatus, ReactNode> = {
  green: <CheckCircle2 size={14} className="text-emerald-500" />,
  yellow: <AlertCircle size={14} className="text-amber-500" />,
  red: <XCircle size={14} className="text-red-500" />,
};

const STATUS_BGS: Record<TrafficStatus, string> = {
  green: "bg-emerald-500/10 border-emerald-500/20",
  yellow: "bg-amber-500/10 border-amber-500/20",
  red: "bg-red-500/10 border-red-500/20",
};

export function OutputEspecifico({ plano, onBack }: Props) {
  const { portfolio, risk, simulation, analysis } = plano;

  // Preparar dados para o gráfico de pizza
  const chartData = Object.entries(portfolio).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').toUpperCase(),
    value: Number(value) * 100
  })).sort((a, b) => b.value - a.value);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-10"
    >
      {/* Header com Score */}
      <div className="flex items-center justify-between gap-4 bg-surface-light/50 p-4 rounded-2xl border border-border/30">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Score do Plano</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">{analysis.planScore.score}</span>
            <span className="text-xs font-bold text-zinc-500">/100</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${analysis.planScore.score >= 70 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
          <span className="text-xs font-black uppercase tracking-tighter">{analysis.planScore.rating}</span>
        </div>
      </div>

      {/* Alocação Específica (Donut Chart) */}
      <div className="bg-surface-light/30 rounded-3xl p-6 border border-border/20">
        <div className="flex items-center gap-2 mb-6">
          <PieChart size={18} className="text-primary-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Alocação por Ativos Reais</h3>
        </div>

        <div className="h-64 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <RePie>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip 
                contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
            </RePie>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {chartData.map((item: ChartItem, index: number) => (
            <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-border/10">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[11px] font-bold text-zinc-300">{item.name}</span>
              </div>
              <span className="text-xs font-black text-white">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Viabilidade e Monte Carlo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-5 rounded-3xl border ${STATUS_BGS[analysis.trafficLight.viability.status]} flex flex-col items-center text-center`}>
          <div className="mb-3 p-3 bg-white/5 rounded-2xl">
            <TrendingUp size={24} className={analysis.trafficLight.viability.status === 'green' ? 'text-emerald-500' : 'text-amber-500'} />
          </div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1">Probabilidade de Sucesso</h4>
          <p className="text-3xl font-black text-white">
            {simulation.prob_meta === null ? "Estratégia montada" : `${(simulation.prob_meta * 100).toFixed(0)}%`}
          </p>
          <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed">{analysis.trafficLight.viability.desc}</p>
        </div>

        <div className={`p-5 rounded-3xl border ${STATUS_BGS[analysis.trafficLight.portfolio_risk.status]} flex flex-col items-center text-center`}>
          <div className="mb-3 p-3 bg-white/5 rounded-2xl">
            <ShieldCheck size={24} className="text-blue-500" />
          </div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1">Risco (VaR 95%)</h4>
          <p className="text-3xl font-black text-white">{(risk.var_95 * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed">Máxima queda estimada em cenários de estresse.</p>
        </div>
      </div>

      {/* Semáforo de Saúde (Traffic Lights) */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Análise de Robustez</h3>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(analysis.trafficLight).map(([key, info]) => {
             if (key === 'viability' || key === 'portfolio_risk') return null;
             return (
               <div key={key} className={`flex items-center justify-between p-4 rounded-2xl border ${STATUS_BGS[info.status]}`}>
                 <div className="flex items-center gap-3">
                   {STATUS_ICONS[info.status]}
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-white">{info.title}</span>
                     <span className="text-[10px] text-zinc-500">{info.desc}</span>
                   </div>
                 </div>
               </div>
             );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-6">
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full py-4 rounded-2xl bg-white text-black font-black text-sm shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
        >
          <Zap size={16} fill="black" />
          SALVAR PLANO E FINALIZAR
        </button>
      </div>
    </motion.div>
  );
}
