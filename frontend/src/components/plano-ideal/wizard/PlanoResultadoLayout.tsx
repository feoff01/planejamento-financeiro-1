"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  ChevronDown,
  Lock,
  MessageCircle,
  PieChart,
  Search,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export type PlanoAssetGroupKey = "renda_fixa" | "renda_variavel" | "liquidez";
export type PlanoChanceLabel = "Alta" | "Moderada" | "Baixa" | "Indefinida";
export type PlanoMode = "locked" | "revealed";

export type PlanoMetric = {
  label: string;
  value: string;
  desc: string;
  icon: LucideIcon;
  tone?: PlanoChanceLabel;
  locked?: boolean;
};

export type PlanoObjetivo = {
  id?: string;
  label: string;
  valor?: number;
  horizonte_anos?: number;
  prioridade?: number;
};

export type PlanoAporteObjetivo = {
  id?: string;
  goal_index: number;
  goal_name: string;
  aporte_mensal?: number;
};

export type PlanoAportePlan = {
  total_mensal: number;
  goal_count: number;
  objetivos: PlanoAporteObjetivo[];
};

export type PlanoAllocation = {
  renda_fixa: number;
  renda_variavel: number;
  liquidez: number;
};

export type PlanoAsset = {
  id: string;
  label: string;
  percentual?: number;
  locked?: boolean;
  preview?: boolean;
};

export type PlanoAssetGroup = {
  key: PlanoAssetGroupKey;
  label: string;
  assets: PlanoAsset[];
};

export type PlanoAssetExplanation = {
  id?: string;
  assetLabel: string;
  explanation?: string;
  locked?: boolean;
};

export type PlanoAssetExplanations = {
  enabled: boolean;
  summary: string;
  items: PlanoAssetExplanation[];
};

export type PlanoGrowthPoint = {
  ano: number;
  aportado: number;
  projetado: number;
};

type Props = {
  mode: PlanoMode;
  metrics: PlanoMetric[];
  objetivos: PlanoObjetivo[];
  aportePlan: PlanoAportePlan;
  allocation: PlanoAllocation;
  assetGroups: PlanoAssetGroup[];
  assetExplanations: PlanoAssetExplanations;
  growthProjection: PlanoGrowthPoint[];
  footer?: ReactNode;
};

const FEATURE_ITEMS: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: BarChart3,
    title: "Dashboard",
    desc: "Acompanhe a evolução do plano em uma visão única.",
  },
  {
    icon: Search,
    title: "Screening",
    desc: "Filtre ativos alinhados ao seu perfil e objetivo.",
  },
  {
    icon: PieChart,
    title: "Carteira recomendada",
    desc: "Veja a composição detalhada e os pesos sugeridos.",
  },
  {
    icon: MessageCircle,
    title: "Consultor de IA",
    desc: "Tire dúvidas sobre próximos passos e ajustes.",
  },
];

const BLURRED_PROJECTION_YEARS = 12;
const LOCKED_APORTE_PLACEHOLDER = "0.000";
const LOCKED_ASSET_EXPLANATION_PLACEHOLDER =
  "Papel detalhado do ativo na carteira, alinhado ao prazo e ao objetivo.";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function PlanoResultadoLayout({
  mode,
  metrics,
  objetivos,
  aportePlan,
  allocation,
  assetGroups,
  assetExplanations,
  growthProjection,
  footer,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-5xl space-y-8 pb-8 text-blue-brand-950"
    >
      <header className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
          Resultado do diagnóstico
        </p>
        <h2 className="font-editorial text-5xl leading-[0.94] text-blue-brand-950 md:text-7xl">
          O plano para atingir seus objetivos foi traçado.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-blue-brand-950/60 md:text-base">
          Com base nos dados iniciais fornecidos, geramos uma rota personalizada para acelerar a conquista dos seus objetivos.
        </p>
      </header>

      <section>
        <div className="grid gap-3 md:grid-cols-2">
          {metrics.map((metric) => (
            <MetricReveal key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <ObjectivesPreview objetivos={objetivos} />

      <AportesPreview mode={mode} plan={aportePlan} />

      <InvestmentPreview mode={mode} allocation={allocation} />

      <AssetGroupsPreview mode={mode} groups={assetGroups} />

      <AssetExplanationsPreview mode={mode} teaser={assetExplanations} />

      <GrowthProjectionPreview mode={mode} data={growthProjection} />

      {footer}
    </motion.div>
  );
}

export function PlanoUnlockFooter({
  onUnlock,
  isUnlocking = false,
}: {
  onUnlock: () => void;
  isUnlocking?: boolean;
}) {
  return (
    <>
      <IncludedFeatures />
      <UnlockButton onOpen={onUnlock} isLoading={isUnlocking} />
    </>
  );
}

export const PLANO_RESULT_ICONS = {
  CalendarClock,
  Target,
};

function ObjectivesPreview({ objetivos }: { objetivos: PlanoObjetivo[] }) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] bg-blue-brand-950 text-white">
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-2">
          <Target size={18} className="text-primary-300" />
          <h3 className="text-sm font-bold">Com base nos seus objetivos</h3>
        </div>

        {objetivos.length === 0 ? (
          <p className="text-sm leading-relaxed text-white/60">Nenhum objetivo foi encontrado para este diagnóstico.</p>
        ) : (
          <div className="divide-y divide-white/10 border-y border-white/10">
            {objetivos.map((objetivo, index) => (
              <ObjectiveLine key={objetivo.id ?? index} objetivo={objetivo} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ObjectiveLine({ objetivo }: { objetivo: PlanoObjetivo }) {
  return (
    <article className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <p className="font-editorial text-3xl leading-none text-white">{objetivo.label}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/50">
          {formatCurrency(objetivo.valor)} · {formatPrazo(objetivo.horizonte_anos)}
        </p>
      </div>
      <span className="w-fit rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-300">
        Prioridade {objetivo.prioridade ?? "-"}
      </span>
    </article>
  );
}

function AportesPreview({ mode, plan }: { mode: PlanoMode; plan: PlanoAportePlan }) {
  const hasMultipleGoals = plan.objetivos.length > 1;

  return (
    <section className="overflow-hidden rounded-[1.25rem] bg-white/70 text-blue-brand-950">
      <div className="grid gap-0 md:grid-cols-[0.8fr_1.2fr]">
        <div className="border-b border-blue-brand-950/10 p-5 md:border-b-0 md:border-r sm:p-6">
          <Wallet size={28} className="mb-7 text-blue-brand-950" strokeWidth={1.8} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-brand-950/40">aportes:</p>
          <p className="mt-2 font-editorial text-5xl leading-none text-blue-brand-950">
            {formatCurrency(plan.total_mensal)}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-blue-brand-950/60">
            Valor mensal usado pelo motor para organizar a rota dos objetivos.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {hasMultipleGoals ? (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-brand-950/40">
                    Divisão por objetivo
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-blue-brand-950/60">
                    {mode === "locked"
                      ? "A distribuição detalhada fica protegida no plano completo."
                      : "A distribuição mensal organiza o aporte conforme prioridade, prazo e meta."}
                  </p>
                </div>
                {mode === "locked" && <Lock size={16} className="shrink-0 text-blue-brand-950/30" />}
              </div>

              <div className="space-y-3">
                {plan.objetivos.map((objetivo) => (
                  <AporteGoalLine
                    key={objetivo.id ?? objetivo.goal_index}
                    objetivo={objetivo}
                    locked={mode === "locked"}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-32 flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-brand-950/40">
                Objetivo único
              </p>
              <p className="mt-3 text-sm leading-relaxed text-blue-brand-950/60">
                Como há apenas um objetivo, o aporte mensal completo segue para a carteira dessa meta.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AporteGoalLine({ objetivo, locked }: { objetivo: PlanoAporteObjetivo; locked: boolean }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-blue-brand-950/10 py-3 last:border-b-0">
      <p className="min-w-0 truncate text-sm font-semibold text-blue-brand-950">{objetivo.goal_name}</p>
      {locked ? (
        <span
          className="shrink-0 select-none text-sm font-semibold text-blue-brand-950/70"
          aria-hidden="true"
        >
          R$ <span className="inline-block blur-sm">{LOCKED_APORTE_PLACEHOLDER}</span>/mês
        </span>
      ) : (
        <span className="shrink-0 text-sm font-semibold text-blue-brand-950">
          {formatCurrency(objetivo.aporte_mensal)}/mês
        </span>
      )}
      {locked && <span className="sr-only">Aporte por objetivo disponível no plano completo</span>}
    </div>
  );
}

function InvestmentPreview({ mode, allocation }: { mode: PlanoMode; allocation: PlanoAllocation }) {
  return (
    <section className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-brand-950/40">Você deve investir</p>
      </div>

      <div className="overflow-hidden rounded-[1.25rem] bg-white/70">
        <div className="grid md:grid-cols-3">
          <AllocationBlock label="Renda fixa" value={allocation.renda_fixa} locked={mode === "locked"} />
          <AllocationBlock label="Renda variável" value={allocation.renda_variavel} locked={mode === "locked"} />
          <AllocationBlock label="Liquidez" value={allocation.liquidez} />
        </div>
      </div>
    </section>
  );
}

function AllocationBlock({ label, value, locked = false }: { label: string; value: number; locked?: boolean }) {
  return (
    <div className="border-b border-blue-brand-950/10 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-brand-950/40">{label}</p>
        {locked && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-brand-950/10 text-blue-brand-950/40">
            <Lock size={14} />
          </span>
        )}
      </div>

      <p className="font-editorial text-5xl leading-none text-blue-brand-950">
        {locked ? (
          <>
            <span className="select-none blur-sm" aria-hidden="true">
              {Math.round(value)}
            </span>
            <span aria-hidden="true">%</span>
            <span className="sr-only">Percentual disponível no plano completo</span>
          </>
        ) : (
          `${Math.round(value)}%`
        )}
      </p>
    </div>
  );
}

function AssetGroupsPreview({ mode, groups }: { mode: PlanoMode; groups: PlanoAssetGroup[] }) {
  return (
    <section className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-brand-950/40">Nos ativos</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {groups.map((group) => (
          <AssetGroupColumn key={group.key} mode={mode} group={group} />
        ))}
      </div>
    </section>
  );
}

function AssetGroupColumn({ mode, group }: { mode: PlanoMode; group: PlanoAssetGroup }) {
  return (
    <div className="rounded-[1.25rem] bg-[#f7f3ea] p-5">
      <h3 className="font-editorial text-3xl leading-none text-blue-brand-950">{group.label}</h3>
      <div className="mt-5 space-y-2">
        {group.assets.length === 0 ? (
          <p className="text-sm leading-relaxed text-blue-brand-950/50">Sem ativos nesta classe.</p>
        ) : (
          group.assets.map((asset) => <AssetLine key={asset.id} mode={mode} asset={asset} />)
        )}
      </div>
    </div>
  );
}

function AssetLine({ mode, asset }: { mode: PlanoMode; asset: PlanoAsset }) {
  const locked = mode === "locked" && asset.locked;

  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-blue-brand-950/10 py-2.5 last:border-b-0">
      <div className="min-w-0">
        {locked ? (
          <p className="select-none truncate text-sm font-semibold text-blue-brand-950/70 blur-sm" aria-hidden="true">
            {asset.label}
          </p>
        ) : (
          <p className="truncate text-sm font-semibold text-blue-brand-950">{asset.label}</p>
        )}
        {locked && <span className="sr-only">Ativo disponível no plano completo</span>}
      </div>
      {locked ? (
        <Lock size={14} className="shrink-0 text-blue-brand-950/30" />
      ) : mode === "locked" && asset.preview ? (
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-700">Prévia</span>
      ) : asset.percentual !== undefined ? (
        <span className="shrink-0 text-sm font-semibold text-blue-brand-950">{formatPercent(asset.percentual)}</span>
      ) : null}
    </div>
  );
}

function AssetExplanationsPreview({ mode, teaser }: { mode: PlanoMode; teaser: PlanoAssetExplanations }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!teaser.enabled) return null;

  return (
    <section className="overflow-hidden rounded-[1.25rem] bg-[#f7f3ea] text-blue-brand-950">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-brand-950/40">
            Explicação dos ativos
          </p>
          <h3 className="mt-2 font-editorial text-3xl leading-none text-blue-brand-950">
            Por que escolhemos esses ativos?
          </h3>
        </div>
        <ChevronDown
          size={22}
          className={`shrink-0 text-blue-brand-950 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-blue-brand-950/10 p-5 pt-0 sm:p-6 sm:pt-0">
          <p className="text-sm leading-relaxed text-blue-brand-950/65">{teaser.summary}</p>

          <div className="mt-5 space-y-3">
            {teaser.items.map((item, index) => (
              <AssetExplanationLine key={item.id ?? index} mode={mode} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function AssetExplanationLine({ mode, item }: { mode: PlanoMode; item: PlanoAssetExplanation }) {
  const locked = mode === "locked" && item.locked;

  return (
    <div className="flex gap-3 border-b border-blue-brand-950/10 pb-3 last:border-b-0 last:pb-0">
      {locked && <Lock size={15} className="mt-0.5 shrink-0 text-blue-brand-950/30" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-blue-brand-950">{item.assetLabel}</p>
        {locked ? (
          <>
            <p className="mt-1 select-none text-xs leading-relaxed text-blue-brand-950/55 blur-sm" aria-hidden="true">
              {LOCKED_ASSET_EXPLANATION_PLACEHOLDER}
            </p>
            <span className="sr-only">Explicação detalhada disponível no plano completo</span>
          </>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-blue-brand-950/60">{item.explanation}</p>
        )}
      </div>
    </div>
  );
}

function MetricReveal({ metric }: { metric: PlanoMetric }) {
  const Icon = metric.icon;

  return (
    <div className="rounded-[1.25rem] bg-white/70 p-5 sm:p-6">
      <Icon size={28} className="mb-7 text-blue-brand-950" strokeWidth={1.8} />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-brand-950/40">{metric.label}</p>
      <p className={`mt-2 font-editorial text-5xl leading-none ${chanceToneClass(metric.tone)}`}>
        {metric.locked ? (
          <>
            <span className="select-none blur-sm" aria-hidden="true">
              {metric.value}
            </span>
            <span className="sr-only">{metric.label} disponível no plano completo</span>
          </>
        ) : (
          metric.value
        )}
      </p>
      <p className="mt-4 text-xs leading-relaxed text-blue-brand-950/60">{metric.desc}</p>
    </div>
  );
}

function GrowthProjectionPreview({ mode, data }: { mode: PlanoMode; data: PlanoGrowthPoint[] }) {
  const chartData = useMemo(
    () => (data.length > 0 ? data : buildBlurredGrowthProjection()),
    [data]
  );
  const locked = mode === "locked";

  return (
    <section className="overflow-hidden rounded-[1.25rem] bg-blue-brand-950 text-white">
      <div className="flex flex-col gap-2 p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-300" />
          <h3 className="text-sm font-bold">Gráfico de crescimento</h3>
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-white/50">
          {locked
            ? "A projeção completa mostra como aporte mensal e retorno esperado se combinam ao longo do tempo."
            : "A projeção mostra como aporte mensal e retorno esperado se combinam ao longo do tempo."}
        </p>
      </div>

      <div className="relative h-72 p-2 sm:h-80 sm:p-4">
        <div className={`h-full select-none ${locked ? "blur-[3px]" : ""}`} aria-hidden={locked}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 18, right: 16, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id={`growthProjection-${mode}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5C77E" stopOpacity={0.72} />
                  <stop offset="95%" stopColor="#E5C77E" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="ano"
                tickFormatter={(ano) => `${ano}a`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 11 }}
              />
              <YAxis
                width={72}
                tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="projetado"
                stroke="#E5C77E"
                strokeWidth={3}
                fill={`url(#growthProjection-${mode})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-brand-950/10 px-5 text-center">
            <div>
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-400 text-blue-brand-950">
                <Lock size={18} />
              </div>
              <p className="text-sm font-semibold text-white">Projeção detalhada disponível no plano completo</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function UnlockButton({ onOpen, isLoading = false }: { onOpen: () => void; isLoading?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      disabled={isLoading}
      className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-primary-400 px-6 py-4 text-center text-sm font-semibold text-blue-brand-950 transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Lock size={17} />
      <span>{isLoading ? "Gerando plano completo..." : "Desbloquear plano completo"}</span>
      <ArrowRight size={17} />
    </motion.button>
  );
}

function IncludedFeatures() {
  return (
    <section className="rounded-[1.25rem] bg-blue-brand-950 p-5 text-white sm:p-7">
      <p className="text-center text-sm font-semibold text-white">
        Além de desbloquear seu plano completo, você ganha acesso a
      </p>

      <div className="mt-6 grid gap-0 overflow-hidden border-y border-white/10 md:grid-cols-2 lg:grid-cols-4">
        {FEATURE_ITEMS.map((item) => (
          <FeatureItem key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

function FeatureItem({ item }: { item: (typeof FEATURE_ITEMS)[number] }) {
  const Icon = item.icon;

  return (
    <div className="border-b border-white/10 py-5 last:border-b-0 md:border-r md:px-5 md:even:border-r-0 lg:border-b-0 lg:even:border-r lg:last:border-r-0">
      <Icon size={21} className="text-primary-300" />
      <h3 className="mt-4 text-sm font-bold text-white">{item.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-white/50">{item.desc}</p>
    </div>
  );
}

function buildBlurredGrowthProjection(): PlanoGrowthPoint[] {
  const monthlyReturn = Math.pow(1.11, 1 / 12) - 1;
  const monthly = 2800;
  const savings = 60000;
  let projected = savings;

  const projection: PlanoGrowthPoint[] = [
    {
      ano: 0,
      aportado: Number(savings.toFixed(2)),
      projetado: Number(projected.toFixed(2)),
    },
  ];

  for (let year = 1; year <= BLURRED_PROJECTION_YEARS; year++) {
    for (let month = 0; month < 12; month++) {
      projected = projected * (1 + monthlyReturn) + monthly;
    }

    projection.push({
      ano: year,
      aportado: Number((savings + monthly * year * 12).toFixed(2)),
      projetado: Number(projected.toFixed(2)),
    });
  }

  return projection;
}

function formatCurrency(value?: number) {
  return currencyFormatter.format(value ?? 0);
}

function formatPrazo(value?: number) {
  if (!value) return "Prazo não informado";
  return value === 1 ? "1 ano" : `${value} anos`;
}

function formatPercent(value: number) {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function chanceToneClass(tone?: PlanoChanceLabel) {
  if (tone === "Alta") return "text-emerald-700";
  if (tone === "Baixa") return "text-primary-700";
  return "text-blue-brand-950";
}
