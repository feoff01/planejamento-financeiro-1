"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Lock,
  MessageCircle,
  PieChart,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { ReservaDisclaimerModal } from "./ModalIntermediarioReserva";

type AssetGroupKey = "renda_fixa" | "renda_variavel" | "liquidez";
type ChanceLabel = "Alta" | "Moderada" | "Baixa" | "Indefinida";

type Resultado = {
  alocacao: { renda_fixa: number };
  output_generico?: OutputGenericoNarrativa;
};

type OutputGenericoNarrativa = {
  status: "meta_critica" | "meta_apertada" | "plano_viavel" | "plano_forte";
  titulo: string;
  subtitulo: string;
  cta_label: string;
  teaser?: OutputGenericoTeaser;
};

type OutputGenericoTeaser = {
  tempo_estimado_anos: number;
  chance_sucesso: {
    value: number | null;
    label: ChanceLabel;
    message: string;
  };
  asset_groups: AssetGroup[];
};

type AssetGroup = {
  key: AssetGroupKey;
  label: string;
  assets: TeaserAsset[];
};

type TeaserAsset = {
  id: string;
  label: string;
};

type GrowthPoint = {
  ano: number;
  aportado: number;
  projetado: number;
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

type Props = {
  resultado: Resultado;
  dadosCompletos: DadosCompletos;
};

const ASSET_GROUPS: Array<{ key: AssetGroupKey; label: string }> = [
  { key: "renda_fixa", label: "Renda fixa" },
  { key: "renda_variavel", label: "Renda variável" },
  { key: "liquidez", label: "Liquidez" },
];

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

const LOCKED_ASSET_PLACEHOLDERS: Record<AssetGroupKey, string[]> = {
  renda_fixa: ["Tesouro IPCA+ 2035", "CDB liquidez planejada", "Tesouro Prefixado 2031"],
  renda_variavel: ["Carteira Dividendos", "Portfolio Z", "Ações de crescimento"],
  liquidez: ["Reserva tática", "Tesouro Selic", "Caixa estratégico"],
};

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

export function OutputGenerico({ resultado, dadosCompletos }: Props) {
  const [showUnlockNotice, setShowUnlockNotice] = useState(false);
  const [showReservaDisclaimer, setShowReservaDisclaimer] = useState(true);

  const objetivos = useMemo(() => buildObjetivosResumo(dadosCompletos), [dadosCompletos]);
  const teaser = useMemo(
    () => normalizeTeaser(resultado.output_generico?.teaser, objetivos),
    [objetivos, resultado.output_generico?.teaser]
  );
  const assetGroups = useMemo(() => normalizeAssetGroups(teaser.asset_groups), [teaser.asset_groups]);

  return (
    <>
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

        <ObjectivesPreview objetivos={objetivos} />

        <InvestmentPreview alocacao={resultado.alocacao} />

        <AssetGroupsPreview groups={assetGroups} />

        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <MetricReveal
              icon={CalendarClock}
              label="Tempo estimado"
              value={formatPrazo(teaser.tempo_estimado_anos)}
              desc="Prazo usado pelo motor para simular a rota do objetivo principal."
            />
            <MetricReveal
              icon={Target}
              label="Chance de sucesso"
              value={formatChanceValue(teaser.chance_sucesso)}
              desc={teaser.chance_sucesso.message}
              tone={teaser.chance_sucesso.label}
            />
          </div>

          <GrowthProjectionPreview years={teaser.tempo_estimado_anos} />
        </section>

        <UnlockButton onOpen={() => setShowUnlockNotice(true)} />
        {showUnlockNotice && <ProtectedPlanNotice onClose={() => setShowUnlockNotice(false)} />}

        <IncludedFeatures />
      </motion.div>

      {showReservaDisclaimer && <ReservaDisclaimerModal onContinue={() => setShowReservaDisclaimer(false)} />}
    </>
  );
}

function ObjectivesPreview({ objetivos }: { objetivos: ObjetivoResumo[] }) {
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
            {objetivos.map((objetivo) => (
              <ObjectiveLine key={objetivo.id} objetivo={objetivo} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ObjectiveLine({ objetivo }: { objetivo: ObjetivoResumo }) {
  const detalhes = objetivo.detalhes;

  return (
    <article className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <p className="font-editorial text-3xl leading-none text-white">{objetivo.label}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/50">
          {formatCurrency(detalhes?.valor)} · {formatPrazo(detalhes?.horizonte_anos)}
        </p>
      </div>
      <span className="w-fit rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-300">
        Prioridade {detalhes?.prioridade ?? "-"}
      </span>
    </article>
  );
}

function InvestmentPreview({ alocacao }: { alocacao: Resultado["alocacao"] }) {
  return (
    <section className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-brand-950/40">Você deve investir</p>
      </div>

      <div className="overflow-hidden rounded-[1.25rem] bg-white/70">
        <div className="grid md:grid-cols-3">
          <AllocationBlock label="Renda fixa" value={alocacao.renda_fixa} />
          <AllocationBlock label="Renda variável" value={38} locked />
          <AllocationBlock label="Liquidez" value={12} locked />
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

function AssetGroupsPreview({ groups }: { groups: AssetGroup[] }) {
  return (
    <section className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-brand-950/40">Nos ativos</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {groups.map((group) => (
          <AssetGroupColumn key={group.key} group={group} />
        ))}
      </div>
    </section>
  );
}

function AssetGroupColumn({ group }: { group: AssetGroup }) {
  const previewAssets = buildAssetPlaceholders(group);

  return (
    <div className="rounded-[1.25rem] bg-[#f7f3ea] p-5">
      <h3 className="font-editorial text-3xl leading-none text-blue-brand-950">{group.label}</h3>
      <div className="mt-5 space-y-2">
        {previewAssets.map((asset, index) => {
          const canReveal = group.key === "liquidez" && index === 0 && group.assets.length > 0;
          return <AssetLine key={asset.id} asset={asset} locked={!canReveal} />;
        })}
      </div>
    </div>
  );
}

function buildAssetPlaceholders(group: AssetGroup): TeaserAsset[] {
  const lockedAssets = LOCKED_ASSET_PLACEHOLDERS[group.key].map((label, index) => ({
    id: `${group.key}-locked-${index}`,
    label,
  }));

  if (group.key === "liquidez" && group.assets.length > 0) {
    return [group.assets[0], ...lockedAssets.slice(0, 2)];
  }

  return lockedAssets;
}

function AssetLine({ asset, locked }: { asset: TeaserAsset; locked: boolean }) {
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
      ) : (
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-700">Prévia</span>
      )}
    </div>
  );
}

function MetricReveal({
  icon: Icon,
  label,
  value,
  desc,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  desc: string;
  tone?: ChanceLabel;
}) {
  return (
    <div className="rounded-[1.25rem] bg-white/70 p-5 sm:p-6">
      <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-full bg-blue-brand-950 text-primary-300">
        <Icon size={22} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-brand-950/40">{label}</p>
      <p className={`mt-2 font-editorial text-5xl leading-none ${chanceToneClass(tone)}`}>{value}</p>
      <p className="mt-4 text-xs leading-relaxed text-blue-brand-950/60">{desc}</p>
    </div>
  );
}

function GrowthProjectionPreview({ years }: { years: number }) {
  const chartData = useMemo(() => buildBlurredGrowthProjection(years), [years]);

  return (
    <section className="overflow-hidden rounded-[1.25rem] bg-blue-brand-950 text-white">
      <div className="flex flex-col gap-2 p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-300" />
          <h3 className="text-sm font-bold">Gráfico de crescimento</h3>
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-white/50">
          A projeção completa mostra como aporte, patrimônio e retorno esperado se combinam ao longo do tempo.
        </p>
      </div>

      <div className="relative h-72 p-2 sm:h-80 sm:p-4">
        <div className="h-full select-none blur-[3px]" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 18, right: 16, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="growthProjection" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#growthProjection)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-blue-brand-950/10 px-5 text-center">
          <div>
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-400 text-blue-brand-950">
              <Lock size={18} />
            </div>
            <p className="text-sm font-semibold text-white">Projeção detalhada disponível no plano completo</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function UnlockButton({ onOpen, variant = "blue" }: { onOpen: () => void; variant?: "blue" | "gold" }) {
  const className =
    variant === "gold"
      ? "bg-primary-400 text-blue-brand-950 hover:bg-primary-500"
      : "bg-blue-brand-950 text-white hover:bg-blue-brand-900";

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-center text-sm font-semibold transition-colors ${className}`}
    >
      <Lock size={17} />
      <span>Desbloquear plano completo</span>
      <ArrowRight size={17} />
    </motion.button>
  );
}

function ProtectedPlanNotice({ onClose }: { onClose: () => void }) {
  return (
    <section className="rounded-[1.25rem] bg-[#f7f3ea] p-5 text-blue-brand-950 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-700">Plano protegido</p>
          <h3 className="mt-2 font-editorial text-3xl leading-none">Os detalhes completos ficam fora do navegador.</h3>
          <p className="mt-3 text-sm leading-relaxed text-blue-brand-950/60">
            Para liberar ativos, percentuais e projeções reais, o acesso precisa ser validado pelo backend.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full bg-blue-brand-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
        >
          Entendi
        </button>
      </div>
    </section>
  );
}

function IncludedFeatures() {
  return (
    <section className="rounded-[1.25rem] bg-blue-brand-950 p-5 text-white sm:p-7">
      <p className="text-center text-sm font-semibold text-white">
        Ao desbloquear seu plano completo, você também recebe acesso a
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

function normalizeTeaser(
  teaser: OutputGenericoTeaser | undefined,
  objetivos: ObjetivoResumo[]
): OutputGenericoTeaser {
  if (teaser) {
    return {
      ...teaser,
      asset_groups: normalizeAssetGroups(teaser.asset_groups),
    };
  }

  const objetivoPrincipal = getObjetivoPrincipal(objetivos);
  const tempo = objetivoPrincipal?.detalhes?.horizonte_anos ?? 5;

  return {
    tempo_estimado_anos: tempo,
    chance_sucesso: buildChanceSucesso(null),
    asset_groups: normalizeAssetGroups([]),
  };
}

function normalizeAssetGroups(groups: AssetGroup[]): AssetGroup[] {
  return ASSET_GROUPS.map((meta) => {
    const group = groups.find((item) => item.key === meta.key);
    return {
      key: meta.key,
      label: group?.label ?? meta.label,
      assets: group?.assets ?? [],
    };
  });
}

function buildObjetivosResumo(dados: DadosCompletos): ObjetivoResumo[] {
  return (dados.objetivos_selecionados ?? []).map((objetivo) => ({
    ...objetivo,
    detalhes: dados.detalhes_objetivos?.[objetivo.id],
  }));
}

function getObjetivoPrincipal(objetivos: ObjetivoResumo[]) {
  return objetivos.reduce<ObjetivoResumo | null>((principal, objetivo) => {
    if (!principal) return objetivo;
    const prioridadeAtual = objetivo.detalhes?.prioridade ?? 0;
    const prioridadePrincipal = principal.detalhes?.prioridade ?? 0;
    return prioridadeAtual > prioridadePrincipal ? objetivo : principal;
  }, null);
}

function buildChanceSucesso(value: number | null): OutputGenericoTeaser["chance_sucesso"] {
  if (value === null) {
    return {
      value: null,
      label: "Indefinida",
      message: "Sem uma meta numérica definida, montamos uma rota de crescimento para acompanhar no plano completo.",
    };
  }

  if (value >= 0.8) {
    return {
      value,
      label: "Alta",
      message: "Seu plano está bem alinhado ao objetivo informado. O plano completo mostra ativos e projeções.",
    };
  }

  if (value >= 0.6) {
    return {
      value,
      label: "Moderada",
      message: "Seu objetivo é viável, mas alguns ajustes podem aumentar a margem de segurança da rota.",
    };
  }

  return {
    value,
    label: "Baixa",
    message: "No cenário atual, seu objetivo pede ajustes. O plano completo mostra como melhorar a viabilidade.",
  };
}

function buildBlurredGrowthProjection(years: number): GrowthPoint[] {
  const totalYears = Math.max(1, Math.min(Math.round(years || 1), 50));
  const monthlyReturn = Math.pow(1.11, 1 / 12) - 1;
  const monthly = 2800;
  const savings = 60000;
  let projected = savings;

  const projection: GrowthPoint[] = [
    {
      ano: 0,
      aportado: Number(savings.toFixed(2)),
      projetado: Number(projected.toFixed(2)),
    },
  ];

  for (let year = 1; year <= totalYears; year++) {
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

function formatChanceValue(chance: OutputGenericoTeaser["chance_sucesso"]) {
  if (chance.value === null) return chance.label;
  return `${chance.label} - ${Math.round(chance.value * 100)}%`;
}

function chanceToneClass(tone?: ChanceLabel) {
  if (tone === "Alta") return "text-emerald-700";
  if (tone === "Baixa") return "text-primary-700";
  return "text-blue-brand-950";
}
