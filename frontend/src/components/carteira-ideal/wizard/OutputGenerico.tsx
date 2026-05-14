"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Lock,
  LucideIcon,
  Rocket,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { ReservaDisclaimerModal } from "./ModalIntermediarioReserva";
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
  status: "meta_critica" | "meta_apertada" | "plano_viavel" | "plano_forte";
  titulo: string;
  subtitulo: string;
  cta_label: string;
};

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
  aporte_mensal?: number;
  patrimonio_total?: number;
  objetivos_selecionados?: ObjetivoSelecionado[];
  detalhes_objetivos?: Record<string, DetalheObjetivo>;
};

type ObjetivoResumo = ObjetivoSelecionado & {
  detalhes?: DetalheObjetivo;
};

type GargaloPrincipal = {
  titulo: string;
  descricao: string;
  destaqueLabel: string;
  destaqueValor: string;
  tone: "amber" | "primary" | "emerald";
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
  const [showReservaDisclaimer, setShowReservaDisclaimer] = useState(true);

  const config = PERFIL_CONFIG[resultado.perfil];
  const narrativa = resultado.output_generico;
  const probMeta = resultado.motor.simulation.prob_meta;
  const objetivos = buildObjetivosResumo(dadosCompletos);
  const gargaloPrincipal = buildGargaloPrincipal(resultado, objetivos, dadosCompletos);

  const planoCompleto: PlanoEspecifico = {
    cta_label: narrativa?.cta_label,
    objetivos_registrados: objetivos,
    portfolio: resultado.motor.portfolio,
    risk: resultado.motor.risk,
    simulation: resultado.motor.simulation,
    analysis: resultado.motor.analysis,
  };

  if (showDetalhado) {
    return <OutputEspecifico plano={planoCompleto} onBack={() => setShowDetalhado(false)} />;
  }

  if (showReservaDisclaimer) {
    return <ReservaDisclaimerModal onContinue={() => setShowReservaDisclaimer(false)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-6xl space-y-6 pb-8"
    >
      <header className="grid gap-7 lg:grid-cols-[1fr_0.7fr] lg:items-end">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-primary-700">
            Resultado do diagnóstico
          </p>
          <h2 className="font-editorial text-5xl leading-[0.92] text-blue-brand-950 md:text-7xl">
            {narrativa?.titulo ?? "Sua estratégia personalizada está pronta."}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-blue-brand-950/60 md:text-base">
          {narrativa?.subtitulo ??
            "Com base nos seus objetivos, prazo e perfil, montamos uma visão simples para guiar seu próximo passo."}
        </p>
      </header>

      <section className="overflow-hidden rounded-[1.5rem] bg-blue-brand-950 text-white shadow-[0_24px_80px_rgba(11,37,69,0.18)]">
        <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
          <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className={`mb-8 flex h-20 w-20 items-center justify-center rounded-full ${config.iconBg}`}>
              <config.icon size={36} className={config.iconColor} />
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/40">Perfil do investidor</p>
            <h3 className="mt-3 font-editorial text-6xl leading-none">{config.label}</h3>
            <p className="mt-5 text-sm leading-relaxed text-white/60">{config.desc}</p>
          </div>

          <div className="grid gap-0 sm:grid-cols-2">
            <MetricPanel
              label="Chance de sucesso"
              value={formatProbability(probMeta)}
              description={
                probMeta === null
                  ? "A estratégia foi montada mesmo sem uma meta numérica para simular."
                  : "Probabilidade em cenários simulados para atingir a meta no prazo informado."
              }
              valueClass={getProbabilityTextTone(probMeta)}
            />
            <MetricPanel
              label="Aporte mensal"
              value={formatCurrency(dadosCompletos.aporte_mensal)}
              description="Valor usado como base para projetar a evolução da rota."
              valueClass="text-primary-300"
            />
            <MetricPanel
              label="Patrimônio atual"
              value={formatCurrency(dadosCompletos.patrimonio_total)}
              description="Ponto de partida informado no diagnóstico."
              valueClass="text-white"
            />
            <MetricPanel
              label="Objetivos"
              value={`${objetivos.length}`}
              description="Metas consideradas na primeira leitura do plano."
              valueClass="text-white"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.78fr]">
        <div className="space-y-5">
          <ObjetivosSection objetivos={objetivos} />
          {gargaloPrincipal && <GargaloPrincipalSection gargalo={gargaloPrincipal} />}
        </div>

        <div className="space-y-5">
          <AlocacaoSection alocacao={resultado.alocacao} />
          <PlanoCompletoTeaser
            ctaLabel={narrativa?.cta_label ?? "Ver carteira ideal completa"}
            onOpen={() => setShowDetalhado(true)}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MetricPanel({
  label,
  value,
  description,
  valueClass,
}: {
  label: string;
  value: string;
  description: string;
  valueClass: string;
}) {
  return (
    <div className="border-b border-white/10 p-6 last:border-b-0 sm:border-r sm:even:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className={`mt-3 font-editorial text-5xl leading-none ${valueClass}`}>{value}</p>
      <p className="mt-4 text-xs leading-relaxed text-white/50">{description}</p>
    </div>
  );
}

function ObjetivosSection({ objetivos }: { objetivos: ObjetivoResumo[] }) {
  return (
    <section className="rounded-[1.5rem] border border-blue-brand-950/10 bg-white/55 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <Target size={18} className="text-primary-700" />
        <h3 className="text-sm font-bold text-blue-brand-950">Objetivos considerados</h3>
      </div>

      {objetivos.length === 0 ? (
        <div className="rounded-2xl border border-blue-brand-950/10 bg-[#f7f3ea]/70 p-4 text-sm text-blue-brand-950/55">
          Nenhum objetivo foi encontrado para este diagnóstico.
        </div>
      ) : (
        <div className="divide-y divide-blue-brand-950/10 border-y border-blue-brand-950/10">
          {objetivos.map((objetivo) => (
            <ObjetivoRow key={objetivo.id} objetivo={objetivo} />
          ))}
        </div>
      )}
    </section>
  );
}

function ObjetivoRow({ objetivo }: { objetivo: ObjetivoResumo }) {
  const detalhes = objetivo.detalhes;

  return (
    <article className="py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-editorial text-3xl leading-none text-blue-brand-950">{objetivo.label}</p>
          {!detalhes && <p className="mt-1 text-xs text-blue-brand-950/40">Detalhes não informados.</p>}
        </div>
        <span className="w-fit rounded-full border border-blue-brand-950/10 bg-[#f7f3ea]/100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-brand-950/55">
          Prioridade {detalhes?.prioridade ?? "-"}
        </span>
      </div>

      {detalhes && (
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
          <InfoPill icon={CircleDollarSign} label="Valor alvo" value={formatCurrency(detalhes.valor)} />
          <InfoPill icon={CalendarClock} label="Prazo" value={formatPrazo(detalhes.horizonte_anos)} />
          <InfoPill icon={ShieldCheck} label="Tipo" value={formatNatureza(detalhes.natureza)} />
          <InfoPill icon={Target} label="Liquidez" value={formatLiquidez(detalhes.liquidez)} />
        </div>
      )}
    </article>
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-h-11 rounded-2xl border border-blue-brand-950/10 bg-[#f7f3ea]/70 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-brand-950/40">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <p className="mt-1 font-bold leading-snug text-blue-brand-950/78">{value}</p>
    </div>
  );
}

const GARGALO_TONES: Record<GargaloPrincipal["tone"], { card: string; dot: string; value: string }> = {
  amber: {
    card: "border-primary-500/30 bg-primary-500/10",
    dot: "bg-primary-500",
    value: "text-primary-700",
  },
  primary: {
    card: "border-blue-brand-950/20 bg-blue-brand-950/10",
    dot: "bg-blue-brand-950",
    value: "text-blue-brand-950",
  },
  emerald: {
    card: "border-emerald-500/25 bg-emerald-500/10",
    dot: "bg-emerald-500",
    value: "text-emerald-700",
  },
};

function GargaloPrincipalSection({ gargalo }: { gargalo: GargaloPrincipal }) {
  const tone = GARGALO_TONES[gargalo.tone];

  return (
    <section className={`rounded-[1.5rem] border p-5 sm:p-6 ${tone.card}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-brand-950/40">Gargalo principal</p>
          </div>
          <h3 className="font-editorial text-4xl leading-none text-blue-brand-950">{gargalo.titulo}</h3>
          <p className="mt-3 text-sm leading-relaxed text-blue-brand-950/60">{gargalo.descricao}</p>
        </div>
        <div className="border-t border-blue-brand-950/10 pt-4 sm:min-w-40 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-brand-950/40">{gargalo.destaqueLabel}</p>
          <p className={`mt-1 text-lg font-black leading-tight ${tone.value}`}>{gargalo.destaqueValor}</p>
        </div>
      </div>
    </section>
  );
}

function PlanoCompletoTeaser({ ctaLabel, onOpen }: { ctaLabel: string; onOpen: () => void }) {
  return (
    <section className="rounded-[1.5rem] bg-blue-brand-950 p-5 text-white sm:p-6">
      <h3 className="font-editorial text-4xl leading-none">Carteira ideal completa</h3>
      <p className="mt-4 text-sm leading-relaxed text-white/55">
        Desbloqueie percentuais, ativos recomendados, justificativas, risco e pontos de ajuste.
      </p>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-primary-400 px-5 py-4 text-sm font-semibold text-blue-brand-950 transition-colors hover:bg-primary-500"
      >
        <TrendingUp size={18} />
        <span>{ctaLabel}</span>
        <ArrowRight size={18} />
      </motion.button>
    </section>
  );
}

function AlocacaoSection({ alocacao }: { alocacao: Resultado["alocacao"] }) {
  return (
    <section className="rounded-[1.5rem] border border-blue-brand-950/10 bg-white/55 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary-500" />
        <h3 className="text-sm font-bold text-blue-brand-950">Resumo da estratégia</h3>
      </div>

      <div className="overflow-hidden rounded-full bg-blue-brand-950/10">
        <div className="flex h-3 w-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${alocacao.renda_fixa}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-blue-brand-950"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${alocacao.acoes}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
            className="bg-primary-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${alocacao.liquidez}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.16 }}
            className="bg-blue-brand-950/35"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <AllocationTeaserCard label="Renda fixa" value={`${alocacao.renda_fixa}%`} />
        <AllocationTeaserCard label="Renda variável" value={`${alocacao.acoes}%`} locked />
        <AllocationTeaserCard label="Liquidez" value={`${alocacao.liquidez}%`} locked />
      </div>
    </section>
  );
}

function AllocationTeaserCard({ label, value, locked = false }: { label: string; value?: string; locked?: boolean }) {
  const displayValue = value ?? "--%";

  return (
    <div className="rounded-2xl border border-blue-brand-950/10 bg-[#f7f3ea]/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-brand-950/40">{label}</p>
        {locked && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-brand-950/10 text-blue-brand-950/45">
            <Lock size={13} />
          </span>
        )}
      </div>
      {locked ? (
        <p className="mt-2 font-editorial text-4xl leading-none text-blue-brand-950/78" aria-label="Percentual disponível no plano completo">
          <span className="select-none blur-sm" aria-hidden="true">
            {displayValue.replace("%", "")}
          </span>
          <span aria-hidden="true">%</span>
        </p>
      ) : (
        <p className="mt-2 font-editorial text-4xl leading-none text-blue-brand-950">{displayValue}</p>
      )}
    </div>
  );
}

function buildObjetivosResumo(dados: DadosCompletos): ObjetivoResumo[] {
  return (dados.objetivos_selecionados ?? []).map((objetivo) => ({
    ...objetivo,
    detalhes: dados.detalhes_objetivos?.[objetivo.id],
  }));
}

function buildGargaloPrincipal(
  resultado: Resultado,
  objetivos: ObjetivoResumo[],
  dados: DadosCompletos
): GargaloPrincipal | null {
  const probMeta = resultado.motor.simulation.prob_meta;
  const objetivoPrincipal = getObjetivoPrincipal(objetivos);
  const detalhes = objetivoPrincipal?.detalhes;

  if (!detalhes || probMeta === null) return null;

  const meta = detalhes.valor ?? 0;
  const prazo = detalhes.horizonte_anos ?? 0;
  const aporte = dados.aporte_mensal ?? 0;
  const mediana = resultado.motor.simulation.median ?? 0;
  const gapEstimado = Math.max(meta - mediana, 0);
  const aporteExtraMensal = prazo > 0 ? gapEstimado / Math.max(prazo * 12, 1) : gapEstimado;

  if (probMeta >= 0.8) return null;

  if (prazo > 0 && prazo <= 5) {
    return {
      titulo: "O prazo é o principal gargalo",
      descricao: `A meta de ${formatCurrency(meta)} em ${formatPrazo(prazo).toLowerCase()} fica apertada para a rota calculada. O plano completo mostra o impacto de alongar prazo, elevar aporte ou ajustar o alvo.`,
      destaqueLabel: "Prazo informado",
      destaqueValor: formatPrazo(prazo),
      tone: "amber",
    };
  }

  if (aporte <= 0 || aporteExtraMensal > Math.max(aporte * 0.25, 1)) {
    return {
      titulo: "O aporte atual está abaixo do necessário",
      descricao: `A simulação mediana fica em ${formatCurrency(mediana)}, deixando um gap estimado de ${formatCurrency(gapEstimado)} para a meta.`,
      destaqueLabel: "Aporte atual",
      destaqueValor: formatCurrency(aporte),
      tone: "amber",
    };
  }

  if (probMeta >= 0.6 && resultado.alertas.length === 0) return null;

  return {
    titulo: "A meta está alta para a rota calculada",
    descricao: `A carteira respeita seu perfil de risco, mas a distância até ${formatCurrency(meta)} ainda exige ajustes no alvo, prazo ou aporte.`,
    destaqueLabel: "Probabilidade",
    destaqueValor: formatProbability(probMeta),
    tone: "amber",
  };
}

function getObjetivoPrincipal(objetivos: ObjetivoResumo[]) {
  return objetivos.reduce<ObjetivoResumo | null>((principal, objetivo) => {
    if (!principal) return objetivo;
    const prioridadeAtual = objetivo.detalhes?.prioridade ?? 0;
    const prioridadePrincipal = principal.detalhes?.prioridade ?? 0;
    return prioridadeAtual > prioridadePrincipal ? objetivo : principal;
  }, null);
}

function formatCurrency(value?: number) {
  return currencyFormatter.format(value ?? 0);
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

function getProbabilityTextTone(value: number | null) {
  if (value === null) return "text-primary-300";
  if (value >= 0.8) return "text-emerald-300";
  if (value >= 0.6) return "text-primary-300";
  return "text-primary-300";
}

const PERFIL_CONFIG: Record<
  Perfil,
  {
    label: string;
    iconBg: string;
    iconColor: string;
    desc: string;
    icon: LucideIcon;
  }
> = {
  conservador: {
    label: "Conservador",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-300",
    desc: "Seu foco é proteger o que já conquistou e avançar com mais previsibilidade.",
    icon: ShieldCheck,
  },
  moderado: {
    label: "Moderado",
    iconBg: "bg-primary-500/15",
    iconColor: "text-primary-300",
    desc: "Você busca equilíbrio entre segurança e crescimento, aceitando oscilações controladas.",
    icon: Scale,
  },
  arrojado: {
    label: "Arrojado",
    iconBg: "bg-primary-500/15",
    iconColor: "text-primary-300",
    desc: "Você aceita mais variação no caminho para buscar crescimento acima da média no longo prazo.",
    icon: Rocket,
  },
};
