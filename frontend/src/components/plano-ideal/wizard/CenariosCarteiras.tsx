"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Gift, Star, TrendingUp } from "lucide-react";
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
  CARTEIRA_RF_GRATIS,
  PERFIL_LABEL,
  type PerfilRisco,
  TAXA_MENSAL,
  calcularPlanoReserva,
  combinarSeries,
  formatDuracao,
  mesesParaMeta,
  objetivoPrincipal,
  serieAnual,
} from "@/lib/plano/projecoes";
import { ReservaEmergenciaCard } from "./ReservaEmergenciaCard";

type Props = {
  dados: Partial<DiagnosticoCompleto>;
  perfil: PerfilRisco;
  onVerRecomendacao: () => void;
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

const SERIE_LABEL: Record<string, string> = {
  atual: "Seu método atual",
  rendaFixa: "Carteira Renda Fixa (sua)",
  synapta: "Carteira Synapta ideal",
};

export function CenariosCarteiras({ dados, perfil, onVerRecomendacao }: Props) {
  const aporte = dados.aporte_mensal ?? 0;
  const patrimonio = dados.patrimonio_total ?? 0;
  const objetivo = useMemo(() => objetivoPrincipal(dados), [dados]);
  const carteiraRF = CARTEIRA_RF_GRATIS[perfil];
  const planoReserva = useMemo(
    () =>
      calcularPlanoReserva(
        dados.gastos_mensais ?? 0,
        dados.patrimonio_total ?? 0,
        dados.aporte_mensal ?? 0
      ),
    [dados.aporte_mensal, dados.gastos_mensais, dados.patrimonio_total]
  );
  const taxaSynapta = TAXA_MENSAL.synapta[perfil];

  const horizonteAnos = Math.min(Math.max(objetivo?.horizonte_anos ?? 10, 5), 30);

  const chartData = useMemo(
    () =>
      combinarSeries([
        serieAnual("atual", patrimonio, aporte, TAXA_MENSAL.poupanca, horizonteAnos),
        serieAnual("rendaFixa", patrimonio, aporte, TAXA_MENSAL.rendaFixa, horizonteAnos),
        serieAnual("synapta", patrimonio, aporte, taxaSynapta, horizonteAnos),
      ]),
    [aporte, horizonteAnos, patrimonio, taxaSynapta]
  );

  const meta = objetivo?.valor ?? 0;
  const cenarios = useMemo(
    () => [
      {
        key: "atual",
        titulo: "Seu método atual",
        estrelas: 1,
        meses: meta > 0 ? mesesParaMeta(patrimonio, aporte, TAXA_MENSAL.poupanca, meta) : null,
        desc: "Guardando como hoje, sem o dinheiro trabalhar por você.",
        destaque: false,
      },
      {
        key: "rendaFixa",
        titulo: "Carteira Renda Fixa",
        estrelas: 3,
        meses: meta > 0 ? mesesParaMeta(patrimonio, aporte, TAXA_MENSAL.rendaFixa, meta) : null,
        desc: "A carteira que você acabou de ganhar — simples, segura e já liberada.",
        destaque: false,
      },
      {
        key: "synapta",
        titulo: "Carteira Synapta ideal",
        estrelas: 5,
        meses: meta > 0 ? mesesParaMeta(patrimonio, aporte, taxaSynapta, meta) : null,
        desc: "Renda fixa + ações no peso certo para o seu perfil e objetivo.",
        destaque: true,
      },
    ],
    [aporte, meta, patrimonio, taxaSynapta]
  );

  const mesesAtual = cenarios[0].meses;
  const mesesSynapta = cenarios[2].meses;
  const ganhoSynapta =
    mesesAtual !== null && mesesSynapta !== null ? mesesAtual - mesesSynapta : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-5xl space-y-8 pb-8 text-blue-brand-950"
    >
      <header className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
          Presente de boas-vindas
        </p>
        <h2 className="font-editorial text-5xl leading-[0.94] text-blue-brand-950 md:text-7xl">
          Sua primeira carteira já está liberada.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-blue-brand-950/60 md:text-base">
          Montamos uma carteira de renda fixa sob medida para o seu perfil{" "}
          <strong>{PERFIL_LABEL[perfil]}</strong>
          {objetivo ? (
            <>
              {" "}e para o seu objetivo de <strong>{objetivo.label.toLowerCase()}</strong>
            </>
          ) : null}
          . Ela é sua, de graça — e é só o começo da rota.
        </p>
      </header>

      <ReservaEmergenciaCard plano={planoReserva} notaProjecoes />

      {/* Carteira RF grátis — 100% aberta */}
      <section className="overflow-hidden rounded-[1.25rem] bg-blue-brand-950 text-white">
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-primary-300" />
              <h3 className="text-sm font-bold">Carteira Renda Fixa Synapta</h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-primary-400/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-300">
              <BadgeCheck size={13} />
              Grátis · 100% liberada
            </span>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {carteiraRF.map((ativo) => (
              <article
                key={ativo.id}
                className="grid gap-2 py-4 md:grid-cols-[auto_1fr] md:items-start md:gap-5"
              >
                <p className="font-editorial text-3xl leading-none text-primary-300 md:w-24">
                  {ativo.percentual}%
                </p>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{ativo.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{ativo.papel}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-white/45">
            Percentuais calibrados para o perfil {PERFIL_LABEL[perfil].toLowerCase()}. Esta carteira fica
            salva no seu plano e você pode analisá-la depois no Raio-X.
          </p>
        </div>
      </section>

      {/* Gráfico dos 3 cenários */}
      <section className="overflow-hidden rounded-[1.25rem] bg-blue-brand-950 text-white">
        <div className="flex flex-col gap-2 p-5 pb-0 sm:p-6 sm:pb-0">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-300" />
            <h3 className="text-sm font-bold">Três rotas para o mesmo objetivo</h3>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-white/50">
            Mesmo aporte de {currencyFormatter.format(aporte)}/mês nas três curvas.
            {meta > 0
              ? ` A linha pontilhada marca ${currencyFormatter.format(meta)} — ${objetivo?.label.toLowerCase()}.`
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
                  SERIE_LABEL[String(name)] ?? String(name),
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
              {meta > 0 && (
                <ReferenceLine y={meta} stroke="#E5C77E" strokeDasharray="4 6" strokeOpacity={0.7} />
              )}
              <Line
                type="monotone"
                dataKey="atual"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="rendaFixa"
                stroke="#7EA6E5"
                strokeWidth={2.5}
                dot={false}
              />
              <Line type="monotone" dataKey="synapta" stroke="#E5C77E" strokeWidth={3.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 pb-5 text-xs text-white/60 sm:px-6">
          <span className="flex items-center gap-2">
            <i className="inline-block h-0.5 w-5 rounded bg-white/40" /> Seu método atual
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block h-1 w-5 rounded bg-[#7EA6E5]" /> Carteira Renda Fixa (sua)
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block h-1 w-5 rounded bg-primary-400" /> Carteira Synapta ideal
          </span>
        </div>
      </section>

      {/* Cards de cenário com estrelas */}
      <section className="grid gap-3 md:grid-cols-3">
        {cenarios.map((cenario) => (
          <div
            key={cenario.key}
            className={`rounded-[1.25rem] p-5 ${
              cenario.destaque
                ? "border border-primary-500/40 bg-white/80 shadow-[0_0_24px_rgba(201,162,75,0.18)]"
                : "bg-white/70"
            }`}
          >
            <div className="flex items-center gap-1" aria-label={`${cenario.estrelas} de 5 estrelas`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={15}
                  className={
                    index < cenario.estrelas ? "text-primary-500" : "text-blue-brand-950/15"
                  }
                  fill={index < cenario.estrelas ? "currentColor" : "none"}
                />
              ))}
            </div>
            <p className="mt-3 text-sm font-bold text-blue-brand-950">{cenario.titulo}</p>
            <p
              className={`mt-2 font-editorial text-4xl leading-none ${
                cenario.destaque ? "text-primary-700" : "text-blue-brand-950"
              }`}
            >
              {meta > 0 ? formatDuracao(cenario.meses) : "—"}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-brand-950/35">
              até o objetivo
            </p>
            <p className="mt-3 text-xs leading-relaxed text-blue-brand-950/60">{cenario.desc}</p>
            {cenario.destaque && objetivo && (
              <p className="mt-3 rounded-xl bg-primary-400/15 px-3 py-2 text-[11px] font-semibold leading-relaxed text-primary-700">
                Recomendada para: {objetivo.label}
              </p>
            )}
          </div>
        ))}
      </section>

      {ganhoSynapta !== null && ganhoSynapta > 0 && (
        <p className="text-center text-sm leading-relaxed text-blue-brand-950/60">
          A carteira Synapta ideal antecipa seu objetivo em{" "}
          <strong className="text-primary-700">{formatDuracao(ganhoSynapta)}</strong> em relação ao
          método atual — combinando a renda fixa que você já ganhou com ações no peso certo.
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onVerRecomendacao}
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-primary-400 px-6 py-4 text-center text-sm font-semibold text-blue-brand-950 transition-colors hover:bg-primary-500"
      >
        <span>Ver minha recomendação personalizada</span>
        <ArrowRight size={17} />
      </motion.button>
    </motion.div>
  );
}
