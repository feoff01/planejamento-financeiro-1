"use client";

import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  CalendarClock,
  CircleDollarSign,
  Droplets,
  TrendingUp, 
  PieChart, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trophy,
  Zap,
  type LucideIcon,
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
  tipo_plano?: "reserva_emergencia" | "objetivos";
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
  reserva?: {
    reserva_atual: number;
    reserva_ideal: number;
    gap_reserva: number;
    aporte_recomendado_reserva: number;
    meses_para_completar: number | null;
    percentual_aporte_reserva: number;
    plano_ativos: Array<{
      asset_id: string;
      nome: string;
      categoria: "selic";
      percentual: number;
      valor_destino: number;
      aporte_mensal: number;
      retorno_liquido_aa: number;
      retorno_bruto_aa: number;
      volatilidade_aa: number;
      prazo_anos: number;
      liquidez: "diaria";
      explicacao: string;
    }>;
  };
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

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_ICONS: Record<TrafficStatus, ReactNode> = {
  green: <CheckCircle2 size={14} className="text-emerald-500" />,
  yellow: <AlertCircle size={14} className="text-gold-500" />,
  red: <XCircle size={14} className="text-red-500" />,
};

const STATUS_BGS: Record<TrafficStatus, string> = {
  green: "bg-emerald-500/10 border-emerald-500/20",
  yellow: "bg-gold-500/10 border-gold-500/20",
  red: "bg-red-500/10 border-red-500/20",
};

function ReservaEspecifica({ plano, onBack }: Props) {
  const reserva = plano.reserva;
  if (!reserva) return null;
  const ativo = reserva.plano_ativos[0];
  const reservaProgress = getReservaProgress(reserva.reserva_atual, reserva.reserva_ideal);
  const objetivos = plano.objetivos_registrados ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-10"
    >
      <div className="flex items-center justify-between gap-4 bg-surface-light/50 p-4 rounded-2xl border border-border/30">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-blue-brand-800 transition-all text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-gold-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plano completo</span>
          </div>
          <p className="text-lg font-black text-white text-center">Reserva de emergência</p>
        </div>
        <div className="px-4 py-2 rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
          <span className="text-xs font-black uppercase tracking-tighter">Premium</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <ReservaPlanoCard icon={ShieldCheck} label="Reserva atual" value={formatCurrency(reserva.reserva_atual)} />
        <ReservaPlanoCard icon={CheckCircle2} label="Reserva ideal" value={formatCurrency(reserva.reserva_ideal)} />
        <ReservaPlanoCard icon={CircleDollarSign} label="Falta reservar" value={formatCurrency(reserva.gap_reserva)} />
        <ReservaPlanoCard icon={TrendingUp} label="Aporte mensal" value={formatCurrency(reserva.aporte_recomendado_reserva)} />
      </div>

      <div className="rounded-3xl border border-border/30 bg-surface-light/30 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Progresso da reserva</p>
          <p className="text-xs font-black text-emerald-300">{reservaProgress}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-brand-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${reservaProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-gold-400"
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Você já tem {formatCurrency(reserva.reserva_atual)} de {formatCurrency(reserva.reserva_ideal)} recomendados. O plano abaixo mostra onde colocar os próximos aportes.
        </p>
      </div>

      {ativo && (
        <div className="rounded-3xl border border-gold-500/25 bg-gold-500/10 p-6 shadow-[0_18px_60px_rgba(201, 162, 75,0.08)]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Droplets size={18} className="text-gold-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Invista exatamente aqui</h3>
              </div>
              <p className="mt-2 text-3xl font-black leading-tight text-gold-200">{ativo.nome}</p>
            </div>
            <span className="w-fit rounded-2xl border border-gold-500/30 bg-gold-500/15 px-4 py-2 text-xs font-black text-gold-200">
              {ativo.percentual}% dos aportes da reserva
            </span>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">{ativo.explicacao}</p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ReservaAssetStat label="Valor de destino" value={formatCurrency(ativo.valor_destino)} />
            <ReservaAssetStat label="Aporte nesse ativo" value={formatCurrency(ativo.aporte_mensal)} />
            <ReservaAssetStat label="Retorno líquido a.a." value={formatPercent(ativo.retorno_liquido_aa)} />
            <ReservaAssetStat label="Liquidez" value="Diária" />
            <ReservaAssetStat label="Volatilidade a.a." value={formatPercent(ativo.volatilidade_aa)} />
            <ReservaAssetStat label="Prazo do título" value={formatPrazoAnos(ativo.prazo_anos)} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
            <CalendarClock size={24} />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Estimativa conservadora</h4>
          <p className="mt-2 text-3xl font-black text-white">{formatMesesReserva(reserva.meses_para_completar)}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Esse prazo pode diminuir com rendimentos ou aportes maiores. Sem aporte mensal, definimos o ativo, mas não estimamos uma data.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
            <ShieldCheck size={24} />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Regra de execução</h4>
          <p className="mt-2 text-sm font-bold text-white">Aporte primeiro na reserva, depois nos objetivos.</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Isso evita vender investimentos de longo prazo quando aparecer uma emergência.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/20 bg-surface-light/30 p-6">
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-primary-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Depois da reserva, seus objetivos entram em ação</h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Quando sua reserva alcançar 6 meses de gastos, a Synapta estará te esperando para recalcular a carteira dos objetivos que você já informou.
        </p>
        <ObjetivosAguardandoSection objetivos={objetivos} />
      </div>

      <div className="pt-6">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="w-full py-4 rounded-2xl bg-white text-blue-brand-950 font-black text-sm shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
        >
          <Zap size={16} fill="black" />
          SALVAR PLANO DA RESERVA
        </button>
      </div>
    </motion.div>
  );
}

function ReservaPlanoCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/30 bg-surface-light/30 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function ReservaAssetStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold-500/15 bg-blue-brand-950/35 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-black text-zinc-100">{value}</p>
    </div>
  );
}

function ObjetivosAguardandoSection({ objetivos }: { objetivos: NonNullable<PlanoEspecifico["objetivos_registrados"]> }) {
  if (objetivos.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-border/20 bg-blue-brand-950/35 p-4 text-xs text-zinc-500">
        Nenhum objetivo foi encontrado para a próxima fase.
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
      {objetivos.map((objetivo) => (
        <article key={objetivo.id} className="rounded-2xl border border-border/20 bg-blue-brand-950/35 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">{objetivo.label}</p>
            <span className="rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-300">
              Após reserva
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Prioridade {objetivo.detalhes?.prioridade ?? "-"} e alvo {formatCurrency(objetivo.detalhes?.valor ?? 0)} ficam salvos para a carteira de objetivos.
          </p>
        </article>
      ))}
    </div>
  );
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getReservaProgress(atual: number, ideal: number) {
  if (ideal <= 0) return 0;
  return Math.min(Math.round((Math.max(atual, 0) / ideal) * 100), 100);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPrazoAnos(value: number) {
  if (value <= 0) return "Sem prazo";
  return value === 1 ? "1 ano" : `${value.toFixed(1).replace(".", ",")} anos`;
}

function formatMesesReserva(value: number | null) {
  if (value === null) return "Definir aporte";
  if (value <= 0) return "Agora";
  return value === 1 ? "1 mês" : `${value} meses`;
}

export function OutputEspecifico({ plano, onBack }: Props) {
  if (plano.tipo_plano === "reserva_emergencia" && plano.reserva) {
    return <ReservaEspecifica plano={plano} onBack={onBack} />;
  }

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
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-blue-brand-800 transition-all text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-gold-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Score do Plano</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">{analysis.planScore.score}</span>
            <span className="text-xs font-bold text-zinc-500">/100</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${analysis.planScore.score >= 70 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-gold-500/30 bg-gold-500/10 text-gold-400'}`}>
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
            <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-blue-brand-900/50 border border-border/10">
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
            <TrendingUp size={24} className={analysis.trafficLight.viability.status === 'green' ? 'text-emerald-500' : 'text-gold-500'} />
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
          className="w-full py-4 rounded-2xl bg-white text-blue-brand-950 font-black text-sm shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
        >
          <Zap size={16} fill="black" />
          SALVAR PLANO E FINALIZAR
        </button>
      </div>
    </motion.div>
  );
}
