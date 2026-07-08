"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock3, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DiagnosticoCompleto } from "@/schemas/diagnosticoSchemas";
import {
  TAXA_MENSAL,
  combinarSeries,
  formatDuracao,
  mesesParaMeta,
  objetivoPrincipal,
  serieAnual,
} from "@/lib/plano/projecoes";

type Props = {
  dados: Partial<DiagnosticoCompleto>;
  onNext: () => void;
  onBack: () => void;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const PORQUES = [
  {
    icon: TrendingUp,
    titulo: "Juros compostos trabalham por você",
    desc: "Cada mês investido rende sobre o que já rendeu. Na poupança, o dinheiro quase só espera.",
  },
  {
    icon: Wallet,
    titulo: "O mesmo esforço, outro destino",
    desc: "As duas curvas usam exatamente o seu aporte mensal. A única mudança é onde o dinheiro dorme.",
  },
  {
    icon: Clock3,
    titulo: "Tempo é o que está em jogo",
    desc: "Investir com método não é correr mais risco à toa — é chegar ao mesmo objetivo anos antes.",
  },
];

export function EtapaComparativoInvestir({ dados, onNext, onBack }: Props) {
  const aporte = dados.aporte_mensal ?? 0;
  const patrimonio = dados.patrimonio_total ?? 0;
  const objetivo = useMemo(() => objetivoPrincipal(dados), [dados]);

  const horizonteAnos = Math.min(Math.max(objetivo?.horizonte_anos ?? 10, 5), 30);

  const chartData = useMemo(
    () =>
      combinarSeries([
        serieAnual("poupanca", patrimonio, aporte, TAXA_MENSAL.poupanca, horizonteAnos),
        serieAnual("rendaFixa", patrimonio, aporte, TAXA_MENSAL.rendaFixa, horizonteAnos),
      ]),
    [aporte, horizonteAnos, patrimonio]
  );

  const valorFinalPoupanca = chartData[chartData.length - 1]?.poupanca ?? 0;
  const valorFinalRendaFixa = chartData[chartData.length - 1]?.rendaFixa ?? 0;
  const diferenca = valorFinalRendaFixa - valorFinalPoupanca;

  const mesesPoupanca = objetivo
    ? mesesParaMeta(patrimonio, aporte, TAXA_MENSAL.poupanca, objetivo.valor)
    : null;
  const mesesRendaFixa = objetivo
    ? mesesParaMeta(patrimonio, aporte, TAXA_MENSAL.rendaFixa, objetivo.valor)
    : null;
  const mesesAntecipados =
    mesesPoupanca !== null && mesesRendaFixa !== null ? mesesPoupanca - mesesRendaFixa : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Guardando como hoje"
          value={compactFormatter.format(valorFinalPoupanca)}
          desc={`Poupança a 0,5% ao mês, em ${horizonteAnos} anos.`}
        />
        <MetricCard
          label="Investindo em renda fixa"
          value={compactFormatter.format(valorFinalRendaFixa)}
          desc={`Renda fixa a 1,25% ao mês, no mesmo prazo.`}
          destaque
        />
        <MetricCard
          label="Diferença no bolso"
          value={`+${compactFormatter.format(diferenca)}`}
          desc="Mesmo aporte mensal. Só muda o destino do dinheiro."
          destaque
        />
      </div>

      <section className="overflow-hidden rounded-[1.25rem] bg-blue-brand-950 text-white">
        <div className="flex flex-col gap-2 p-5 pb-0 sm:p-6 sm:pb-0">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-300" />
            <h3 className="text-sm font-bold">Poupança × renda fixa, com os seus números</h3>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-white/50">
            Simulação com {currencyFormatter.format(aporte)}/mês partindo de{" "}
            {currencyFormatter.format(patrimonio)}.{" "}
            {objetivo
              ? `A linha pontilhada marca ${objetivo.label.toLowerCase()} (${currencyFormatter.format(objetivo.valor)}).`
              : ""}
          </p>
        </div>

        <div className="h-72 p-2 sm:h-80 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 18, right: 16, left: 0, bottom: 8 }}>
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
                tickFormatter={(value) => compactFormatter.format(Number(value))}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  currencyFormatter.format(Number(value ?? 0)),
                  String(name) === "poupanca" ? "Poupança" : "Renda fixa",
                ]}
                labelFormatter={(ano) => `Ano ${ano}`}
                contentStyle={{
                  backgroundColor: "#0B2545",
                  border: "1px solid rgba(229,199,126,0.3)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 12,
                }}
              />
              {objetivo && objetivo.valor > 0 && (
                <ReferenceLine
                  y={objetivo.valor}
                  stroke="#E5C77E"
                  strokeDasharray="4 6"
                  strokeOpacity={0.7}
                />
              )}
              <Line
                type="monotone"
                dataKey="poupanca"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
                name="poupanca"
              />
              <Line
                type="monotone"
                dataKey="rendaFixa"
                stroke="#E5C77E"
                strokeWidth={3}
                dot={false}
                name="rendaFixa"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 pb-5 text-xs text-white/60 sm:px-6">
          <span className="flex items-center gap-2">
            <i className="inline-block h-0.5 w-5 rounded bg-white/45" /> Como você guarda hoje
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block h-1 w-5 rounded bg-primary-400" /> Investindo em renda fixa
          </span>
        </div>
      </section>

      {objetivo && mesesAntecipados !== null && mesesAntecipados > 0 && (
        <div className="rounded-[1.25rem] border border-primary-500/30 bg-primary-400/10 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-blue-brand-950">
            No ritmo atual, <strong>{objetivo.label.toLowerCase()}</strong> chega em{" "}
            <strong>{formatDuracao(mesesPoupanca)}</strong>. Investindo em renda fixa, chega em{" "}
            <strong>{formatDuracao(mesesRendaFixa)}</strong> — você antecipa{" "}
            <strong className="text-primary-700">{formatDuracao(mesesAntecipados)}</strong> do seu plano
            com a mesma disciplina de hoje.
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {PORQUES.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.titulo} className="rounded-[1.25rem] bg-white/70 p-5">
              <Icon size={22} className="text-blue-brand-950" strokeWidth={1.8} />
              <p className="mt-3 text-sm font-bold text-blue-brand-950">{item.titulo}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-blue-brand-950/60">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-blue-brand-950/15 px-5 py-3 text-sm font-semibold text-blue-brand-950/60 transition-all hover:border-blue-brand-950/35 hover:text-blue-brand-950"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-gold-400 px-5 py-3 text-sm font-black text-blue-brand-950 transition-all hover:from-primary-400 hover:to-gold-300"
        >
          <Sparkles size={16} />
          Criar agora minha carteira
        </motion.button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  desc,
  destaque = false,
}: {
  label: string;
  value: string;
  desc: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.25rem] p-5 ${
        destaque ? "border border-primary-500/30 bg-white/70" : "bg-white/70"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-brand-950/40">{label}</p>
      <p
        className={`mt-2 font-editorial text-4xl leading-none ${
          destaque ? "text-primary-700" : "text-blue-brand-950"
        }`}
      >
        {value}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-blue-brand-950/60">{desc}</p>
    </div>
  );
}
