"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Factory,
  Lock,
  PieChart as PieChartIcon,
  Radar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  LIMITE_POR_ATIVO,
  LIMITE_POR_SETOR,
  type ProblemaCarteira,
  type ResultadoRaioX,
} from "@/lib/raio-x/engine";

type Props = {
  resultado: ResultadoRaioX;
  onNovaAnalise: () => void;
};

const CORES_PIZZA = [
  "#E5C77E",
  "#13315C",
  "#C9A24B",
  "#1C4075",
  "#7EA6E5",
  "#A8863A",
  "#54431D",
  "#0B2545",
  "#F3DE9A",
  "#94A9C9",
];

const SUGESTOES_PREMIUM = [
  {
    titulo: "Mais eficiência",
    desc: "A combinação com o melhor retorno por unidade de risco (índice de Sharpe).",
  },
  {
    titulo: "Mais segurança",
    desc: "A carteira de menor volatilidade que ainda respeita as regras da casa.",
  },
  {
    titulo: "Mais retorno",
    desc: "O maior retorno esperado dentro dos limites de 17% por ativo e 33% por setor.",
  },
];

export function RaioXResultado({ resultado, onNovaAnalise }: Props) {
  const dadosPizza = useMemo(
    () =>
      resultado.exposicaoSetorial.map((item) => ({
        name: item.setor,
        value: Number((item.peso * 100).toFixed(1)),
        acimaLimite: item.acimaLimite,
      })),
    [resultado.exposicaoSetorial]
  );

  const problemasAltos = resultado.problemas.filter((p) => p.severidade === "alta").length;
  const trocasSugeridas = resultado.sugestoesDiversificacao;
  const isRendaFixa = resultado.tipoCarteira === "renda_fixa";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-5xl space-y-8 pb-4 text-blue-brand-950"
    >
      <header className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
          Raio-X · resultado da análise gratuita
        </p>
        <h2 className="font-editorial text-5xl leading-[0.94] text-blue-brand-950 md:text-6xl">
          {isRendaFixa ? "Sua carteira é boa. E pode ser ideal." : "O que a sua carteira revelou."}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-blue-brand-950/60">
          {isRendaFixa
            ? "A base de renda fixa que você ganhou passou no Raio-X — abaixo, os pontos fortes e o que ainda falta para ela virar a carteira Synapta ideal."
            : `Esta é a visão macro, com as regras da casa: máximo de ${Math.round(
                LIMITE_POR_ATIVO * 100
              )}% por ativo e ${Math.round(
                LIMITE_POR_SETOR * 100
              )}% por setor. A correção passo a passo faz parte do Raio-X completo.`}
        </p>
      </header>

      {/* Métricas macro */}
      <section className="grid gap-3 md:grid-cols-4">
        <Metrica
          label="Saúde da carteira"
          valor={`${resultado.scoreSaude}/100`}
          desc={
            isRendaFixa
              ? "Boa base — falta a renda variável para o ideal."
              : problemasAltos > 0
              ? `${problemasAltos} ${problemasAltos === 1 ? "alerta grave" : "alertas graves"} encontrados.`
              : "Nenhum alerta grave encontrado."
          }
          tom={resultado.scoreSaude >= 75 ? "bom" : resultado.scoreSaude >= 50 ? "medio" : "ruim"}
        />
        <Metrica
          label="Ativos relevantes"
          valor={String(resultado.ativosRelevantes)}
          desc="Posições acima de 1% da carteira."
        />
        <Metrica
          label="Maior posição"
          valor={
            resultado.maiorPosicao ? `${Math.round(resultado.maiorPosicao.peso * 100)}%` : "—"
          }
          desc={resultado.maiorPosicao ? `Concentrada em ${resultado.maiorPosicao.ticker}.` : ""}
          tom={
            !isRendaFixa && resultado.maiorPosicao && resultado.maiorPosicao.peso > LIMITE_POR_ATIVO
              ? "ruim"
              : "bom"
          }
        />
        {isRendaFixa && resultado.recomendacaoRV ? (
          <Metrica
            label="Ações na carteira"
            valor="0%"
            desc={`Ideal para o perfil ${resultado.recomendacaoRV.perfilLabel.toLowerCase()}: ~${resultado.recomendacaoRV.percentualIdeal}%.`}
            tom="medio"
          />
        ) : (
          <Metrica
            label="Setores presentes"
            valor={String(resultado.setoresPresentes)}
            desc="Dos 11 setores da B3."
          />
        )}
      </section>

      {/* Exposição setorial + alertas */}
      <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[1.25rem] bg-blue-brand-950 p-5 text-white sm:p-6">
          <div className="flex items-center gap-2">
            <PieChartIcon size={18} className="text-primary-300" />
            <h3 className="text-sm font-bold">
              {isRendaFixa ? "Composição da sua carteira" : "Exposição por setor"}
            </h3>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosPizza}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="52%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {dadosPizza.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={item.acimaLimite ? "#E06A6A" : CORES_PIZZA[index % CORES_PIZZA.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${Number(value ?? 0)}%`, String(name)]}
                  contentStyle={{
                    backgroundColor: "#0B2545",
                    border: "1px solid rgba(229,199,126,0.3)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {resultado.exposicaoSetorial.slice(0, 5).map((item) => (
              <div key={item.setor} className="flex items-center justify-between gap-3 text-xs">
                <span className={item.acimaLimite ? "font-bold text-[#F0A0A0]" : "text-white/65"}>
                  {item.setor}
                  {item.acimaLimite ? " · acima do limite" : ""}
                </span>
                <span className="font-semibold text-white">{Math.round(item.peso * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {resultado.pontosFortes.map((ponto, index) => (
            <div key={index} className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/70 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="min-w-0 text-xs leading-relaxed text-blue-brand-950/75 sm:text-sm">
                  {ponto}
                </p>
              </div>
            </div>
          ))}

          {resultado.problemas.length === 0 && resultado.pontosFortes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-[1.25rem] bg-white/70 p-8 text-center">
              <CheckCircle2 size={30} className="text-emerald-600" />
              <p className="mt-3 text-sm font-bold text-blue-brand-950">
                Nenhum alerta pelas regras da casa.
              </p>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-blue-brand-950/60">
                Sua carteira respeita os limites de concentração. O Raio-X completo mostra se ela também
                é eficiente — risco, retorno e Sharpe frente às carteiras otimizadas.
              </p>
            </div>
          ) : (
            resultado.problemas.map((problema, index) => (
              <AlertaCard key={`${problema.tipo}-${index}`} problema={problema} />
            ))
          )}
        </div>
      </section>

      {/* Premium borrado: 3 carteiras sugeridas */}
      <section className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-brand-950/40">
            Carteiras sugeridas para você
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {SUGESTOES_PREMIUM.map((sugestao) => (
            <div key={sugestao.titulo} className="relative overflow-hidden rounded-[1.25rem] bg-[#f7f3ea] p-5">
              <h3 className="font-editorial text-3xl leading-none text-blue-brand-950">
                {sugestao.titulo}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-blue-brand-950/60">{sugestao.desc}</p>

              <div className="mt-4 space-y-2" aria-hidden="true">
                {[38, 62, 45].map((largura, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-blue-brand-950/10 py-2 last:border-b-0"
                  >
                    <span
                      className="select-none rounded bg-blue-brand-950/15 text-transparent blur-[3px]"
                      style={{ width: `${largura}%` }}
                    >
                      ●●●●●
                    </span>
                    <Lock size={13} className="shrink-0 text-blue-brand-950/30" />
                  </div>
                ))}
              </div>
              <span className="sr-only">Composição disponível no Raio-X completo</span>
            </div>
          ))}
        </div>
      </section>

      {/* Premium borrado: trocas sugeridas */}
      <section className="overflow-hidden rounded-[1.25rem] bg-blue-brand-950 p-5 text-white sm:p-7">
        <div className="flex items-center gap-2">
          <RefreshCw size={18} className="text-primary-300" />
          <h3 className="text-sm font-bold">Trocas sugeridas pela carteira da casa</h3>
        </div>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/50">
          {isRendaFixa
            ? `Para compor sua parte de renda variável, encontramos ${trocasSugeridas.length} ${
                trocasSugeridas.length === 1 ? "ativo" : "ativos"
              } da carteira Synapta em setores que você ainda não tem — os nomes e os pesos certos fazem parte do Raio-X completo.`
            : trocasSugeridas.length > 0
            ? `Encontramos ${trocasSugeridas.length} ${
                trocasSugeridas.length === 1 ? "ativo da carteira Synapta" : "ativos da carteira Synapta"
              } em setores que faltam na sua carteira — os nomes fazem parte do Raio-X completo.`
            : "Sua carteira já cobre os setores da carteira recomendada Synapta. O Raio-X completo mostra os pesos ideais de cada posição."}
        </p>

        {trocasSugeridas.length > 0 && (
          <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {trocasSugeridas.slice(0, 4).map((sugestao, index) => (
              <div key={index} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Factory size={16} className="shrink-0 text-primary-300" />
                  <p className="truncate text-sm text-white/80">
                    Setor ausente: <span className="font-bold text-white">{sugestao.setorNovo}</span>
                  </p>
                </div>
                <span
                  className="select-none rounded bg-white/15 px-3 text-sm font-bold text-transparent blur-[4px]"
                  aria-hidden="true"
                >
                  {sugestao.ticker}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA final */}
      <section className="space-y-3">
        <Link href="/planos" className="block">
          <motion.span
            whileTap={{ scale: 0.98 }}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-primary-400 px-6 py-4 text-center text-sm font-semibold text-blue-brand-950 transition-colors hover:bg-primary-500"
          >
            <Lock size={17} />
            Desbloquear Raio-X completo
            <ArrowRight size={17} />
          </motion.span>
        </Link>

        <button
          type="button"
          onClick={onNovaAnalise}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-blue-brand-950/15 px-5 py-3 text-sm font-semibold text-blue-brand-950/60 transition-all hover:border-blue-brand-950/35 hover:text-blue-brand-950"
        >
          <Radar size={15} />
          Analisar outra carteira
        </button>
      </section>
    </motion.div>
  );
}

function Metrica({
  label,
  valor,
  desc,
  tom,
}: {
  label: string;
  valor: string;
  desc: string;
  tom?: "bom" | "medio" | "ruim";
}) {
  const corValor =
    tom === "bom" ? "text-emerald-700" : tom === "ruim" ? "text-red-600" : "text-blue-brand-950";

  return (
    <div className="rounded-[1.25rem] bg-white/70 p-5">
      <Crosshair size={22} className="mb-4 text-blue-brand-950" strokeWidth={1.8} />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-brand-950/40">{label}</p>
      <p className={`mt-2 font-editorial text-4xl leading-none ${corValor}`}>{valor}</p>
      <p className="mt-3 text-xs leading-relaxed text-blue-brand-950/60">{desc}</p>
    </div>
  );
}

function AlertaCard({ problema }: { problema: ProblemaCarteira }) {
  const grave = problema.severidade === "alta";

  return (
    <div
      className={`rounded-[1.25rem] border p-5 ${
        grave ? "border-red-200 bg-red-50/70" : "border-amber-200 bg-amber-50/70"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={18}
          className={`mt-0.5 shrink-0 ${grave ? "text-red-500" : "text-amber-500"}`}
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-blue-brand-950">{problema.titulo}</p>
          <p className="mt-1 text-xs leading-relaxed text-blue-brand-950/65">{problema.descricao}</p>
        </div>
      </div>
    </div>
  );
}
