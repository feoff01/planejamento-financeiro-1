"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  FileUp,
  Keyboard,
  Link2,
  Lock,
  MessageSquareText,
  Plus,
  Radar,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  type AtivoCarteira,
  type ResultadoRaioX,
  executarRaioX,
  executarRaioXRendaFixa,
  parseArquivoCarteira,
} from "@/lib/raio-x/engine";
import {
  CARTEIRA_RF_GRATIS,
  type AtivoRendaFixa,
  type PerfilRisco,
} from "@/lib/plano/projecoes";
import { RaioXResultado } from "./RaioXResultado";

type Fase = "entrada" | "resultado";
type Metodo = "manual" | "arquivo";

type LinhaAtivo = { id: number; ticker: string; peso: string };

const CARTEIRA_EXEMPLO: LinhaAtivo[] = [
  { id: 1, ticker: "PETR4", peso: "35" },
  { id: 2, ticker: "VALE3", peso: "25" },
  { id: 3, ticker: "ITUB4", peso: "20" },
  { id: 4, ticker: "BBDC4", peso: "20" },
];

const inputClass =
  "w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

const MOTIVOS_GATE = [
  {
    icon: Target,
    titulo: "Análise personalizada",
    desc: "O Raio-X usa seu perfil, objetivos e prazos para calibrar cada alerta.",
  },
  {
    icon: MessageSquareText,
    titulo: "Chat ciente do seu contexto",
    desc: "O consultor Synapta responde sabendo da sua realidade financeira.",
  },
  {
    icon: Sparkles,
    titulo: "Recomendações sob medida",
    desc: "As sugestões de carteira partem do que você contou no planejamento.",
  },
];

const emptySubscribe = () => () => {};

function lerLocalStorage(chave: string): string {
  try {
    return localStorage.getItem(chave) ?? "";
  } catch {
    return "";
  }
}

export function RaioXExperience() {
  // Leitura SSR-safe do estado do onboarding (gravado ao concluir o diagnóstico).
  const planejamentoConcluido = useSyncExternalStore(
    emptySubscribe,
    () => lerLocalStorage("synapta.diagnostico_concluido") === "1",
    () => false
  );
  const investeAtualmente = useSyncExternalStore(
    emptySubscribe,
    () => lerLocalStorage("synapta.investe_atualmente"),
    () => ""
  );
  const perfilSalvo = useSyncExternalStore(
    emptySubscribe,
    () => lerLocalStorage("synapta.perfil"),
    () => ""
  );
  const carteiraRfSalva = useSyncExternalStore(
    emptySubscribe,
    () => lerLocalStorage("synapta.carteira_rf_gratis"),
    () => ""
  );
  const [fase, setFase] = useState<Fase>("entrada");
  const [metodo, setMetodo] = useState<Metodo>("manual");
  const [linhas, setLinhas] = useState<LinhaAtivo[]>([
    { id: 1, ticker: "", peso: "" },
    { id: 2, ticker: "", peso: "" },
    { id: 3, ticker: "", peso: "" },
  ]);
  const [erroEntrada, setErroEntrada] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoRaioX | null>(null);

  const ativosValidos = useMemo<AtivoCarteira[]>(
    () =>
      linhas
        .map((linha) => ({
          ticker: linha.ticker.trim().toUpperCase(),
          peso: Number(linha.peso.replace("%", "").replace(",", ".")) / 100,
        }))
        .filter((ativo) => ativo.ticker.length >= 5 && Number.isFinite(ativo.peso) && ativo.peso > 0),
    [linhas]
  );

  const somaPesos = useMemo(
    () => ativosValidos.reduce((total, ativo) => total + ativo.peso, 0),
    [ativosValidos]
  );

  // Carteira de renda fixa do iniciante (a que ele ganhou no plano).
  const perfil: PerfilRisco = (["conservador", "moderado", "arrojado"] as const).includes(
    perfilSalvo as PerfilRisco
  )
    ? (perfilSalvo as PerfilRisco)
    : "moderado";

  const minhaCarteiraRF = useMemo<AtivoRendaFixa[] | null>(() => {
    if (investeAtualmente !== "nao") return null;
    try {
      const salva = carteiraRfSalva ? (JSON.parse(carteiraRfSalva) as AtivoRendaFixa[]) : null;
      if (salva && Array.isArray(salva) && salva.length > 0) return salva;
    } catch {
      // JSON inválido — usa a carteira padrão do perfil.
    }
    return CARTEIRA_RF_GRATIS[perfil];
  }, [carteiraRfSalva, investeAtualmente, perfil]);

  const analisarMinhaCarteira = () => {
    if (!minhaCarteiraRF) return;
    setErroEntrada(null);
    setResultado(executarRaioXRendaFixa(minhaCarteiraRF, perfil));
    setFase("resultado");
  };

  // ── Gate: exige planejamento concluído ─────────────────────────────────────
  if (!planejamentoConcluido) {
    return (
      <div className="mx-auto max-w-3xl py-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-brand-950 text-primary-400">
          <Radar size={28} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
          Raio-X da carteira
        </p>
        <h2 className="mt-2 font-editorial text-4xl leading-none text-blue-brand-950 md:text-5xl">
          Falta um passo antes do Raio-X.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-blue-brand-950/60">
          Para que a análise seja precisa e realmente sua, conclua primeiro o planejamento financeiro.
          Leva poucos minutos — e destrava muito mais do que o Raio-X.
        </p>

        <div className="mt-8 grid gap-3 text-left md:grid-cols-3">
          {MOTIVOS_GATE.map((motivo) => {
            const Icon = motivo.icon;
            return (
              <div key={motivo.titulo} className="rounded-[1.25rem] bg-white/70 p-5">
                <Icon size={22} className="text-blue-brand-950" strokeWidth={1.8} />
                <p className="mt-3 text-sm font-bold text-blue-brand-950">{motivo.titulo}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-blue-brand-950/60">{motivo.desc}</p>
              </div>
            );
          })}
        </div>

        <Link href="/plano-ideal" className="mt-8 inline-block w-full max-w-md">
          <motion.span
            whileTap={{ scale: 0.98 }}
            className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-gold-400 px-6 py-4 text-sm font-black text-blue-brand-950 transition-all hover:from-primary-400 hover:to-gold-300"
          >
            Concluir meu planejamento
            <ArrowRight size={17} />
          </motion.span>
        </Link>
      </div>
    );
  }

  // ── Resultado ───────────────────────────────────────────────────────────────
  if (fase === "resultado" && resultado) {
    return (
      <RaioXResultado
        resultado={resultado}
        onNovaAnalise={() => {
          setResultado(null);
          setFase("entrada");
        }}
      />
    );
  }

  // ── Entrada da carteira ─────────────────────────────────────────────────────
  const analisar = (ativos: AtivoCarteira[]) => {
    if (ativos.length === 0) {
      setErroEntrada("Adicione ao menos um ativo com ticker (ex.: PETR4) e peso em %.");
      return;
    }
    setErroEntrada(null);
    setResultado(executarRaioX(ativos));
    setFase("resultado");
  };

  const handleArquivo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ativos = parseArquivoCarteira(String(reader.result ?? ""));
      if (ativos.length === 0) {
        setErroEntrada(
          'Não encontrei ativos no arquivo. Use uma linha por ativo no formato "PETR4;25".'
        );
        return;
      }
      analisar(ativos);
    };
    reader.readAsText(file);
  };

  const atualizarLinha = (id: number, campo: "ticker" | "peso", valor: string) => {
    setLinhas((prev) => prev.map((linha) => (linha.id === id ? { ...linha, [campo]: valor } : linha)));
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
          Raio-X da carteira · análise gratuita
        </p>
        <h2 className="mt-3 font-editorial text-4xl leading-none text-blue-brand-950 md:text-5xl">
          Como você quer trazer sua carteira?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-brand-950/60">
          Quanto mais fiel a carteira, mais preciso o diagnóstico. As regras da casa: no máximo 17% por
          ativo e 33% por setor.
        </p>
      </div>

      {minhaCarteiraRF && (
        <div className="mb-8 overflow-hidden rounded-[1.25rem] border border-primary-500/40 bg-blue-brand-950 p-5 text-white shadow-[0_0_28px_rgba(201,162,75,0.22)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-primary-300" />
              <h3 className="text-sm font-bold">Sua carteira Synapta (renda fixa)</h3>
            </div>
            <span className="rounded-full bg-primary-400/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-300">
              Já configurada para você
            </span>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {minhaCarteiraRF.map((ativo) => (
              <div key={ativo.id} className="flex items-center justify-between gap-4 py-2.5">
                <p className="min-w-0 truncate text-sm text-white/80">{ativo.label}</p>
                <p className="shrink-0 font-editorial text-xl leading-none text-primary-300">
                  {ativo.percentual}%
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-white/50">
            Esta é a carteira que você ganhou no seu plano. Passe-a pelo Raio-X para ver os pontos
            fortes — e o que ainda falta para ela virar a carteira ideal.
          </p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={analisarMinhaCarteira}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-gold-400 px-6 py-3.5 text-sm font-black text-blue-brand-950 transition-all hover:from-primary-400 hover:to-gold-300"
          >
            <Radar size={16} />
            Analisar minha carteira no Raio-X
            <ArrowRight size={16} />
          </motion.button>
        </div>
      )}

      {minhaCarteiraRF && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-blue-brand-950/40">
          Ou analise outra carteira
        </p>
      )}

      {/* Métodos de entrada */}
      <div className="grid gap-3 md:grid-cols-3">
        <MetodoCard
          ativo={metodo === "manual"}
          onClick={() => setMetodo("manual")}
          icon={Keyboard}
          titulo="Inserir manualmente"
          desc="Digite os tickers e o peso de cada um. Rápido para carteiras simples."
        />
        <MetodoCard
          ativo={metodo === "arquivo"}
          onClick={() => setMetodo("arquivo")}
          icon={FileUp}
          titulo="Importar arquivo"
          desc="Envie um CSV/TXT exportado da corretora (uma linha por ativo)."
        />
        <Link href="/planos" className="text-left">
          <div className="relative h-full rounded-[1.25rem] border border-blue-brand-950/10 bg-white/55 p-5 transition-all hover:border-primary-500/50">
            <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary-400/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary-700">
              <Lock size={11} />
              Premium
            </span>
            <Link2 size={22} className="text-blue-brand-950/60" strokeWidth={1.8} />
            <p className="mt-3 text-sm font-bold text-blue-brand-950">Conectar corretora</p>
            <p className="mt-1.5 text-xs leading-relaxed text-blue-brand-950/55">
              Sincronização automática, sempre atualizada com sua instituição.
            </p>
          </div>
        </Link>
      </div>

      {/* Formulário do método escolhido */}
      <AnimatePresence mode="wait">
        {metodo === "manual" ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 rounded-[1.25rem] bg-white/70 p-5 sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-blue-brand-950">Seus ativos</p>
              <button
                type="button"
                onClick={() => setLinhas(CARTEIRA_EXEMPLO.map((linha) => ({ ...linha })))}
                className="text-xs font-semibold text-primary-700 underline-offset-4 hover:underline"
              >
                Usar carteira de exemplo
              </button>
            </div>

            <div className="space-y-2.5">
              {linhas.map((linha) => (
                <div key={linha.id} className="grid grid-cols-[1.4fr_1fr_auto] gap-2.5">
                  <input
                    value={linha.ticker}
                    onChange={(e) => atualizarLinha(linha.id, "ticker", e.target.value.toUpperCase())}
                    placeholder="Ticker (ex.: PETR4)"
                    className={inputClass}
                  />
                  <div className="relative">
                    <input
                      value={linha.peso}
                      onChange={(e) => atualizarLinha(linha.id, "peso", e.target.value)}
                      placeholder="Peso"
                      inputMode="decimal"
                      className={`${inputClass} pr-9`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-brand-950/40">
                      %
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinhas((prev) => prev.filter((item) => item.id !== linha.id))}
                    aria-label={`Remover ${linha.ticker || "ativo"}`}
                    className="flex w-11 items-center justify-center rounded-2xl border border-blue-brand-950/10 text-blue-brand-950/40 transition-colors hover:border-red-300 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setLinhas((prev) => [...prev, { id: Date.now(), ticker: "", peso: "" }])
              }
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-brand-950/60 transition-colors hover:text-blue-brand-950"
            >
              <Plus size={14} />
              Adicionar ativo
            </button>

            <div className="mt-4 flex items-center justify-between border-t border-blue-brand-950/10 pt-4 text-xs text-blue-brand-950/55">
              <span>
                {ativosValidos.length} {ativosValidos.length === 1 ? "ativo válido" : "ativos válidos"}
              </span>
              <span className={Math.abs(somaPesos - 1) > 0.001 && somaPesos > 0 ? "font-bold text-amber-600" : ""}>
                Soma: {(somaPesos * 100).toFixed(1)}%
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.label
            key="arquivo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed border-blue-brand-950/15 bg-white/55 p-10 text-center transition-colors hover:border-primary-500/50"
          >
            <FileUp size={30} className="text-blue-brand-950/50" strokeWidth={1.6} />
            <p className="mt-3 text-sm font-bold text-blue-brand-950">Clique para enviar o arquivo</p>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-blue-brand-950/55">
              CSV ou TXT com uma linha por ativo, no formato <strong>PETR4;25</strong> (ticker;peso%).
              A leitura de extratos em PDF chega em breve.
            </p>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleArquivo(file);
                e.target.value = "";
              }}
            />
          </motion.label>
        )}
      </AnimatePresence>

      {erroEntrada && <p className="mt-3 text-xs text-red-500">{erroEntrada}</p>}

      {metodo === "manual" && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => analisar(ativosValidos)}
          className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-blue-brand-950 px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
        >
          <Radar size={17} />
          Analisar minha carteira
          <ArrowRight size={17} />
        </motion.button>
      )}
    </div>
  );
}

function MetodoCard({
  ativo,
  onClick,
  icon: Icon,
  titulo,
  desc,
}: {
  ativo: boolean;
  onClick: () => void;
  icon: typeof Keyboard;
  titulo: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-[1.25rem] border p-5 text-left transition-all ${
        ativo
          ? "border-primary-500 bg-primary-400/15 ring-4 ring-primary-500/10"
          : "border-blue-brand-950/10 bg-white/55 hover:border-blue-brand-950/30"
      }`}
    >
      <Icon size={22} className={ativo ? "text-primary-600" : "text-blue-brand-950/60"} strokeWidth={1.8} />
      <p className="mt-3 text-sm font-bold text-blue-brand-950">{titulo}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-blue-brand-950/55">{desc}</p>
    </button>
  );
}
