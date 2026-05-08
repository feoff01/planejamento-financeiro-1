"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Droplets,
  LucideIcon,
  PieChart,
  Rocket,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { OutputEspecifico } from "./OutputEspecifico";
import type { PlanoEspecifico } from "./OutputEspecifico";

type Perfil = "conservador" | "moderado" | "arrojado";

type Resultado = {
  perfil: Perfil;
  pontos: number;
  alocacao: { renda_fixa: number; acoes: number; liquidez: number };
  alertas: string[];
  output_generico?: OutputGenericoNarrativa;
  motor: {
    portfolio: Record<string, number>;
    rules_applied: unknown;
    risk: {
      mu: number;
      sigma: number;
      sharpe: number;
      var_95: number;
    };
    simulation: {
      prob_meta: number | null;
      prob_perda_real: number;
      prob_perda_nom: number;
      aportado: number;
      median: number;
    };
    analysis: PlanoEspecifico["analysis"];
  };
};

type OutputGenericoNarrativa = {
  status: "base_fragil" | "base_incompleta" | "meta_critica" | "meta_apertada" | "plano_viavel" | "plano_forte";
  fase_estrategica: "construir_reserva" | "completar_reserva" | "investir_para_objetivos";
  tipo_plano: "reserva_emergencia" | "objetivos";
  bloquear_carteira_objetivos: boolean;
  titulo: string;
  subtitulo: string;
  prioridade_atual: string;
  passos: Array<{
    titulo: string;
    descricao: string;
    status: "agora" | "proximo" | "depois";
  }>;
  cta_label: string;
  mostrar_probabilidade_no_topo: boolean;
  metricas: {
    probabilidade: number | null;
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
};

type OutputGenericoPassoStatus = OutputGenericoNarrativa["passos"][number]["status"];

type ObjetivoSelecionado = {
  id: string;
  label: string;
  emoji?: string;
};

type DetalheObjetivo = {
  valor?: number;
  horizonte_anos?: number;
  natureza?: "need" | "want";
  liquidez?: "low" | "medium" | "high";
  prioridade?: number;
};

type DadosCompletos = {
  objetivos_selecionados?: ObjetivoSelecionado[];
  detalhes_objetivos?: Record<string, DetalheObjetivo>;
};

type ObjetivoResumo = ObjetivoSelecionado & {
  detalhes?: DetalheObjetivo;
};

type Motivo = {
  title: string;
  desc: string;
  icon: LucideIcon;
  tone: string;
};

type Props = {
  resultado: Resultado;
  dadosCompletos: DadosCompletos;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function OutputGenerico({ resultado, dadosCompletos }: Props) {
  const [showDetalhado, setShowDetalhado] = useState(false);
  const config = PERFIL_CONFIG[resultado.perfil];
  const narrativa = resultado.output_generico;
  const isReservaPlan = narrativa?.tipo_plano === "reserva_emergencia";
  const probMeta = resultado.motor.simulation.prob_meta;
  const objetivos = buildObjetivosResumo(dadosCompletos);
  const motivos = buildMotivos(resultado, objetivos);

  const planoCompleto = {
    tipo_plano: narrativa?.tipo_plano ?? "objetivos",
    reserva: narrativa?.metricas,
    cta_label: narrativa?.cta_label,
    objetivos_registrados: objetivos,
    portfolio: resultado.motor.portfolio,
    rules_applied: resultado.motor.rules_applied,
    risk: resultado.motor.risk,
    simulation: resultado.motor.simulation,
    analysis: resultado.motor.analysis,
  };

  if (showDetalhado) {
    return <OutputEspecifico plano={planoCompleto} onBack={() => setShowDetalhado(false)} />;
  }

  if (isReservaPlan && narrativa) {
    return (
      <ReservaGenerico
        narrativa={narrativa}
        objetivos={objetivos}
        onOpenDetalhado={() => setShowDetalhado(true)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-5xl space-y-5 pb-8"
    >
      <header className="space-y-2 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-500/80">
          Resultado do seu diagnóstico
        </p>
        <h2 className="text-3xl font-black leading-tight text-primary-500 sm:text-4xl">
          {narrativa?.titulo ?? "Sua estratégia personalizada está pronta"}
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-400">
          {narrativa?.subtitulo ?? "Com base nos seus objetivos, prazo e perfil, montamos uma visão simples para guiar seu próximo passo."}
        </p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-border/70 bg-surface/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className={`px-5 py-7 text-center sm:px-8 sm:py-9 ${config.profileBg}`}>
          <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border ${config.ring} ${config.bg} ${config.shadow}`}>
            <config.icon size={44} className={config.color} />
          </div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">Perfil do investidor</p>
          <h3 className={`mt-2 text-4xl font-black ${config.color}`}>{config.label}</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">{config.desc}</p>

          {(!narrativa || narrativa.mostrar_probabilidade_no_topo) ? (
            <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-zinc-950/35 px-4 py-4 sm:flex-row sm:px-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${getProbabilityIconTone(probMeta)}`}>
                <Target size={22} />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Probabilidade simulada</p>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {probMeta === null
                    ? "A estratégia foi montada mesmo sem uma meta numérica para simular."
                    : "Chance estimada de atingir sua meta dentro do prazo informado."}
                </p>
              </div>
              <p className={`text-3xl font-black sm:ml-auto ${getProbabilityTextTone(probMeta)}`}>{formatProbability(probMeta)}</p>
            </div>
          ) : (
            <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-4 sm:flex-row sm:px-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                <Target size={22} />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Prioridade atual</p>
                <p className="text-sm font-black text-zinc-100">{narrativa.prioridade_atual}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  A probabilidade técnica continua no plano detalhado, mas agora o foco é seguir a fase certa.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 border-t border-border/50 p-5 sm:p-8">
          {narrativa && !narrativa.mostrar_probabilidade_no_topo && <PlanoFasesSection narrativa={narrativa} />}
          <ObjetivosSection objetivos={objetivos} />
          <AlocacaoSection alocacao={resultado.alocacao} />
          <MotivosSection motivos={motivos} />

          <div className="flex items-start gap-3 rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-500">
              <CheckCircle2 size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary-300">
                {narrativa ? `Próxima ação: ${narrativa.prioridade_atual}` : "Estratégia compatível com seu objetivo"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Ela já está pronta para ser acompanhada no dashboard e pode ser aberta em detalhes no próximo passo.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDetalhado(true)}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary-500 to-orange-500 px-5 py-4 text-sm font-black text-black shadow-[0_18px_50px_rgba(245,158,11,0.24)] transition-all hover:from-primary-400 hover:to-orange-400"
          >
            <TrendingUp size={18} />
            <span>{narrativa?.cta_label ?? "Ver plano detalhado"}</span>
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </section>
    </motion.div>
  );
}

function ReservaGenerico({
  narrativa,
  objetivos,
  onOpenDetalhado,
}: {
  narrativa: OutputGenericoNarrativa;
  objetivos: ObjetivoResumo[];
  onOpenDetalhado: () => void;
}) {
  const metricas = narrativa.metricas;
  const reservaProgress = getReservaProgress(metricas.reserva_atual, metricas.reserva_ideal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-5xl pb-8"
    >
      {false && (
      <header className="space-y-2 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-500/80">
          Resultado do seu diagnóstico
        </p>
        <h2 className="text-3xl font-black leading-tight text-primary-500 sm:text-4xl">
          {narrativa.titulo}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-400">
          {narrativa.subtitulo}
        </p>
      </header>
      )}

      <section className="space-y-6">
        <div className="rounded-3xl border border-amber-500/15 bg-gradient-to-b from-amber-500/10 via-zinc-950/35 to-zinc-950/20 px-5 py-7 text-center sm:px-8 sm:py-9">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/10 shadow-[0_0_42px_rgba(245,158,11,0.18)]">
            <ShieldCheck size={44} className="text-amber-400" />
          </div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">Fase estratégica</p>
          <h3 className="mt-2 text-3xl font-black text-amber-300 sm:text-4xl">{narrativa.prioridade_atual}</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            A carteira de objetivos fica em espera por enquanto. Seus sonhos foram registrados, mas a base precisa estar pronta antes de qualquer alocação para crescimento.
          </p>

          <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-4 sm:flex-row sm:px-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <Target size={22} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Prioridade atual</p>
              <p className="text-sm font-black text-zinc-100">
                Faltam {formatCurrency(metricas.gap_reserva)} para completar sua reserva.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                O plano completo mostra exatamente onde investir essa reserva com liquidez e baixo risco.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <ReservaMetricCard
                icon={CircleDollarSign}
                label="Reserva atual"
                value={formatCurrency(metricas.reserva_atual)}
                tone="blue"
              />
              <ReservaMetricCard
                icon={ShieldCheck}
                label="Reserva ideal"
                value={formatCurrency(metricas.reserva_ideal)}
                tone="green"
              />
              <ReservaMetricCard
                icon={TrendingUp}
                label="Aporte para reserva"
                value={formatCurrency(metricas.aporte_recomendado_reserva)}
                tone="amber"
              />
            </div>

            <div className="rounded-2xl border border-border/45 bg-zinc-950/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Progresso da reserva</p>
                <p className="text-xs font-black text-emerald-300">{reservaProgress}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${reservaProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-400"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Você já tem {formatCurrency(metricas.reserva_atual)} de {formatCurrency(metricas.reserva_ideal)} recomendados para sua base.
              </p>
            </div>
          </section>

          <PlanoFasesSection narrativa={narrativa} showGapAlert={false} />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Estratégia por cima</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <ReservaStrategyItem title={`${metricas.percentual_aporte_reserva}% dos aportes`} desc="Enquanto a reserva não estiver pronta, nenhum aporte vai para objetivos." />
              <ReservaStrategyItem title="Liquidez diária" desc="A reserva precisa estar acessível para imprevistos, sem depender do timing do mercado." />
              <ReservaStrategyItem title="Baixo risco" desc="O foco dessa fase é preservar a base, não buscar retorno máximo." />
            </div>
          </section>

          <ObjetivosSection objetivos={objetivos} bloqueados />

          <div className="flex items-start gap-3 rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-500">
              <CheckCircle2 size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary-300">Objetivos salvos para a próxima fase</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Quando sua reserva chegar a 6 meses de gastos, recalculamos a carteira usando os objetivos que você já informou.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenDetalhado}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary-500 to-orange-500 px-5 py-4 text-sm font-black text-black shadow-[0_18px_50px_rgba(245,158,11,0.24)] transition-all hover:from-primary-400 hover:to-orange-400"
          >
            <ShieldCheck size={18} />
            <span>{narrativa.cta_label}</span>
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </section>
    </motion.div>
  );
}

type ReservaMetricTone = "blue" | "green" | "amber";

const RESERVA_METRIC_TONES: Record<ReservaMetricTone, { card: string; icon: string; value: string }> = {
  blue: {
    card: "border-blue-500/20 bg-blue-500/10",
    icon: "bg-blue-500/10 text-blue-300",
    value: "text-blue-100",
  },
  green: {
    card: "border-emerald-500/20 bg-emerald-500/10",
    icon: "bg-emerald-500/10 text-emerald-300",
    value: "text-emerald-100",
  },
  amber: {
    card: "border-amber-500/20 bg-amber-500/10",
    icon: "bg-amber-500/10 text-amber-300",
    value: "text-amber-100",
  },
};

function ReservaMetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: ReservaMetricTone;
}) {
  const colors = RESERVA_METRIC_TONES[tone];

  return (
    <div className={`rounded-2xl border p-4 ${colors.card}`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${colors.icon}`}>
          <Icon size={13} />
        </span>
        <span className="text-zinc-400">{label}</span>
      </div>
      <p className={`mt-2 text-lg font-black leading-tight ${colors.value}`}>{value}</p>
    </div>
  );
}

function ReservaStrategyItem({ title, desc }: { title: string; desc: string }) {
  return (
    <article className="rounded-2xl border border-border/45 bg-zinc-950/45 p-4">
      <p className="text-sm font-black leading-tight text-zinc-100">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{desc}</p>
    </article>
  );
}

function PlanoFasesSection({
  narrativa,
  showGapAlert = true,
}: {
  narrativa: OutputGenericoNarrativa;
  showGapAlert?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Target size={18} className="text-amber-400" />
        <h3 className="text-sm font-bold text-white">Sua rota em fases</h3>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {narrativa.passos.map((passo, index) => (
          <article key={`${passo.titulo}-${index}`} className="rounded-2xl border border-border/45 bg-zinc-950/45 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getPassoTone(passo.status)}`}>
                {formatPassoStatus(passo.status)}
              </span>
              <span className="text-xs font-black text-zinc-600">{index + 1}</span>
            </div>
            <p className="mt-4 text-sm font-black leading-tight text-zinc-100">{passo.titulo}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{passo.descricao}</p>
          </article>
        ))}
      </div>

      {showGapAlert && narrativa.metricas.gap_reserva > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-relaxed text-zinc-400">
          Para completar a reserva recomendada, faltam aproximadamente{" "}
          <strong className="text-amber-300">{formatCurrency(narrativa.metricas.gap_reserva)}</strong>.
        </div>
      )}
    </section>
  );
}

function ObjetivosSection({ objetivos, bloqueados = false }: { objetivos: ObjetivoResumo[]; bloqueados?: boolean }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Target size={18} className="text-primary-500" />
        <h3 className="text-sm font-bold text-white">
          {bloqueados ? "Objetivos registrados para a próxima fase" : "Seus objetivos considerados"}
        </h3>
      </div>

      {objetivos.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-zinc-900/50 p-4 text-sm text-zinc-400">
          Nenhum objetivo foi encontrado para este diagnóstico.
        </div>
      ) : (
        <div className="space-y-3">
          {objetivos.map((objetivo) => (
            <ObjetivoCard key={objetivo.id} objetivo={objetivo} bloqueado={bloqueados} />
          ))}
        </div>
      )}
    </section>
  );
}

function ObjetivoCard({ objetivo, bloqueado = false }: { objetivo: ObjetivoResumo; bloqueado?: boolean }) {
  const detalhes = objetivo.detalhes;

  return (
    <article className="rounded-2xl border border-border/50 bg-zinc-950/35 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-black leading-tight text-white">{objetivo.label}</p>
          {!detalhes && <p className="mt-1 text-xs text-zinc-500">Detalhes não informados.</p>}
        </div>
        <span className="w-fit rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-400">
          {bloqueado ? "Após reserva" : `Prioridade ${detalhes?.prioridade ?? "-"}`}
        </span>
      </div>

      {detalhes && (
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <InfoPill icon={CircleDollarSign} label="Valor alvo" value={formatCurrency(detalhes.valor)} />
          <InfoPill icon={CalendarClock} label="Prazo" value={formatPrazo(detalhes.horizonte_anos)} />
          <InfoPill icon={ShieldCheck} label="Tipo" value={formatNatureza(detalhes.natureza)} />
          <InfoPill icon={Droplets} label="Liquidez" value={formatLiquidez(detalhes.liquidez)} />
        </div>
      )}

      {bloqueado && (
        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-zinc-400">
          Este objetivo fica salvo. A carteira dele será calculada quando sua reserva estiver completa.
        </p>
      )}
    </article>
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-h-11 rounded-xl border border-border/40 bg-surface-light/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <p className="mt-1 whitespace-normal font-bold leading-snug text-zinc-200">{value}</p>
    </div>
  );
}

function AlocacaoSection({ alocacao }: { alocacao: Resultado["alocacao"] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <PieChart size={18} className="text-primary-500" />
        <h3 className="text-sm font-bold text-white">Resumo da estratégia</h3>
      </div>

      <div className="overflow-hidden rounded-full bg-zinc-800">
        <div className="flex h-4 w-full">
          {ALOCACAO_ITEMS.map((item) => {
            const value = alocacao[item.key];
            if (value <= 0) return null;

            return (
              <motion.div
                key={item.key}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={item.barColor}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ALOCACAO_ITEMS.map((item) => (
          <div key={item.key} className="rounded-2xl border border-border/40 bg-zinc-950/45 p-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <span className={`h-2 w-2 rounded-full ${item.dotColor}`} />
              <span className="truncate">{item.label}</span>
            </div>
            <p className={`mt-2 text-xl font-black ${item.textColor}`}>{alocacao[item.key]}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MotivosSection({ motivos }: { motivos: Motivo[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-primary-500" />
        <h3 className="text-sm font-bold text-white">Por que essa estratégia faz sentido para você</h3>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {motivos.map((motivo) => (
          <div key={motivo.title} className="flex items-start gap-3 rounded-2xl border border-border/45 bg-zinc-950/45 p-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${motivo.tone}`}>
              <motivo.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-100">{motivo.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{motivo.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildObjetivosResumo(dados: DadosCompletos): ObjetivoResumo[] {
  return (dados.objetivos_selecionados ?? []).map((objetivo) => ({
    ...objetivo,
    detalhes: dados.detalhes_objetivos?.[objetivo.id],
  }));
}

function buildMotivos(resultado: Resultado, objetivos: ObjetivoResumo[]): Motivo[] {
  const perfilConfig = PERFIL_CONFIG[resultado.perfil];
  const principalClasse = getPrincipalClasse(resultado.alocacao);
  const objetivoPrincipal = getObjetivoPrincipal(objetivos);
  const probMeta = resultado.motor.simulation.prob_meta;
  const motivos: Motivo[] = [
    {
      title: perfilConfig.reasonTitle,
      desc: perfilConfig.reasonDesc,
      icon: perfilConfig.icon,
      tone: perfilConfig.reasonTone,
    },
    {
      title: `Foco principal em ${principalClasse.label.toLowerCase()}`,
      desc: `A maior parte da estratégia ficou em ${principalClasse.label.toLowerCase()}, alinhada ao seu perfil e ao prazo informado.`,
      icon: principalClasse.icon,
      tone: principalClasse.tone,
    },
  ];

  if (objetivoPrincipal) {
    motivos.push({
      title: `Objetivo prioritário: ${objetivoPrincipal.label}`,
      desc: buildObjetivoReason(objetivoPrincipal),
      icon: Target,
      tone: "bg-primary-500/10 text-primary-400",
    });
  }

  if (resultado.alertas.length > 0) {
    motivos.push({
      title: "Ponto de atenção considerado",
      desc: resultado.alertas[0],
      icon: AlertTriangle,
      tone: "bg-amber-500/10 text-amber-400",
    });
  } else if (probMeta !== null) {
    motivos.push({
      title: "Simulação coerente com a meta",
      desc: `A estimativa indica ${formatProbability(probMeta)} de chance de chegar ao objetivo no prazo informado.`,
      icon: CheckCircle2,
      tone: "bg-emerald-500/10 text-emerald-400",
    });
  }

  return motivos.slice(0, 4);
}

function getObjetivoPrincipal(objetivos: ObjetivoResumo[]) {
  return objetivos.reduce<ObjetivoResumo | null>((principal, objetivo) => {
    if (!principal) return objetivo;
    const prioridadeAtual = objetivo.detalhes?.prioridade ?? 0;
    const prioridadePrincipal = principal.detalhes?.prioridade ?? 0;
    return prioridadeAtual > prioridadePrincipal ? objetivo : principal;
  }, null);
}

function buildObjetivoReason(objetivo: ObjetivoResumo) {
  if (!objetivo.detalhes) {
    return "Esse objetivo entrou na leitura geral do seu diagnóstico.";
  }

  return `A estratégia considerou ${formatCurrency(objetivo.detalhes.valor)} em ${formatPrazo(
    objetivo.detalhes.horizonte_anos
  ).toLowerCase()}, com prioridade ${objetivo.detalhes.prioridade ?? "-"}.`;
}

function getPrincipalClasse(alocacao: Resultado["alocacao"]) {
  return ALOCACAO_ITEMS.reduce((principal, item) => (alocacao[item.key] > alocacao[principal.key] ? item : principal));
}

function formatCurrency(value?: number) {
  return currencyFormatter.format(value ?? 0);
}

function getReservaProgress(atual: number, ideal: number) {
  if (ideal <= 0) return 0;
  return Math.min(Math.round((Math.max(atual, 0) / ideal) * 100), 100);
}

function formatPrazo(value?: number) {
  if (!value) return "Prazo não informado";
  return value === 1 ? "1 ano" : `${value} anos`;
}

function formatNatureza(value?: DetalheObjetivo["natureza"]) {
  if (value === "need") return "Necessidade";
  if (value === "want") return "Desejo";
  return "Não informado";
}

function formatLiquidez(value?: DetalheObjetivo["liquidez"]) {
  if (value === "low") return "Baixa";
  if (value === "medium") return "Média";
  if (value === "high") return "Alta";
  return "Não informada";
}

function formatProbability(value: number | null) {
  if (value === null) return "Estratégia montada";
  return `${Math.round(value * 100)}%`;
}

function getPassoTone(status: OutputGenericoPassoStatus) {
  if (status === "agora") return "bg-amber-500/15 text-amber-300";
  if (status === "proximo") return "bg-primary-500/15 text-primary-300";
  return "bg-zinc-800 text-zinc-400";
}

function formatPassoStatus(status: OutputGenericoPassoStatus) {
  if (status === "agora") return "Agora";
  if (status === "proximo") return "Próximo";
  return "Depois";
}

function getProbabilityIconTone(value: number | null) {
  if (value === null) return "bg-primary-500/10 text-primary-400";
  if (value >= 0.8) return "bg-emerald-500/10 text-emerald-400";
  if (value >= 0.6) return "bg-primary-500/10 text-primary-400";
  return "bg-amber-500/10 text-amber-400";
}

function getProbabilityTextTone(value: number | null) {
  if (value === null) return "text-primary-300";
  if (value >= 0.8) return "text-emerald-400";
  if (value >= 0.6) return "text-primary-400";
  return "text-amber-400";
}

const PERFIL_CONFIG: Record<
  Perfil,
  {
    label: string;
    color: string;
    bg: string;
    ring: string;
    profileBg: string;
    shadow: string;
    desc: string;
    reasonTitle: string;
    reasonDesc: string;
    reasonTone: string;
    icon: LucideIcon;
  }
> = {
  conservador: {
    label: "Conservador",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "border-emerald-500/35",
    profileBg: "bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent",
    shadow: "shadow-[0_0_42px_rgba(16,185,129,0.18)]",
    desc: "Seu foco é proteger o que já conquistou e avançar com mais previsibilidade.",
    reasonTitle: "Proteção em primeiro lugar",
    reasonDesc: "A carteira foi pensada para reduzir sustos e preservar seu patrimônio enquanto você evolui.",
    reasonTone: "bg-emerald-500/10 text-emerald-400",
    icon: ShieldCheck,
  },
  moderado: {
    label: "Moderado",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "border-blue-500/35",
    profileBg: "bg-gradient-to-b from-blue-500/10 via-transparent to-transparent",
    shadow: "shadow-[0_0_42px_rgba(59,130,246,0.18)]",
    desc: "Você busca equilíbrio entre segurança e crescimento, aceitando oscilações controladas.",
    reasonTitle: "Equilíbrio entre crescer e proteger",
    reasonDesc: "A estratégia combina estabilidade com uma parcela de crescimento para acompanhar seus objetivos.",
    reasonTone: "bg-blue-500/10 text-blue-400",
    icon: Scale,
  },
  arrojado: {
    label: "Arrojado",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    ring: "border-orange-500/35",
    profileBg: "bg-gradient-to-b from-orange-500/10 via-transparent to-transparent",
    shadow: "shadow-[0_0_42px_rgba(249,115,22,0.2)]",
    desc: "Você aceita mais variação no caminho para buscar crescimento acima da média no longo prazo.",
    reasonTitle: "Foco em crescimento patrimonial",
    reasonDesc: "A estratégia dá mais espaço para ativos de crescimento quando isso conversa com seu prazo e perfil.",
    reasonTone: "bg-orange-500/10 text-orange-400",
    icon: Rocket,
  },
};

const ALOCACAO_ITEMS: Array<{
  key: keyof Resultado["alocacao"];
  label: string;
  barColor: string;
  dotColor: string;
  textColor: string;
  tone: string;
  icon: LucideIcon;
}> = [
  {
    key: "acoes",
    label: "Ações",
    barColor: "bg-primary-500",
    dotColor: "bg-primary-500",
    textColor: "text-primary-400",
    tone: "bg-primary-500/10 text-primary-400",
    icon: TrendingUp,
  },
  {
    key: "renda_fixa",
    label: "Renda fixa",
    barColor: "bg-blue-500",
    dotColor: "bg-blue-500",
    textColor: "text-blue-400",
    tone: "bg-blue-500/10 text-blue-400",
    icon: ShieldCheck,
  },
  {
    key: "liquidez",
    label: "Liquidez",
    barColor: "bg-zinc-400",
    dotColor: "bg-zinc-400",
    textColor: "text-zinc-300",
    tone: "bg-zinc-500/10 text-zinc-300",
    icon: Droplets,
  },
];
