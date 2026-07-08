"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PlanoIdealService, type GoalPayload } from "@/services/carteira/PlanoIdealService";
import type { DiagnosticoCompleto } from "@/schemas/diagnosticoSchemas";
import { useDiagnostico, type EtapaKey } from "@/hooks/useDiagnostico";
import { CARTEIRA_RF_GRATIS, calcularPerfil, calcularPlanoReserva, type PerfilRisco } from "@/lib/plano/projecoes";
import { ErrorModal } from "../common/ErrorModal";
import { GuiaChat } from "./GuiaChat";
import { BoasVindas } from "./wizard/BoasVindas";
import { CenariosCarteiras } from "./wizard/CenariosCarteiras";
import { Etapa1Form } from "./wizard/Etapa1Form";
import { Etapa2Form } from "./wizard/Etapa2Form";
import { Etapa3Form } from "./wizard/Etapa3Form";
import { Etapa4DetalhesObjetivos } from "./wizard/Etapa4DetalhesObjetivos";
import { Etapa5Form } from "./wizard/Etapa5Form";
import { EtapaComparativoInvestir } from "./wizard/EtapaComparativoInvestir";
import { EtapaInvestimentosForm } from "./wizard/EtapaInvestimentosForm";
import { EtapaLoadingScreen } from "./wizard/EtapaLoadingScreen";
import { OutputEspecifico, type PlanoEspecifico } from "./wizard/OutputEspecifico";
import { OutputGenerico } from "./wizard/OutputGenerico";

const ETAPA_META: Record<Exclude<EtapaKey, "resultado">, { label: string; title: string; desc: string }> = {
  objetivos: {
    label: "Objetivos",
    title: "Escolha os objetivos que importam.",
    desc: "Todo plano começa por um destino — é a partir dele que traçamos a rota.",
  },
  detalhes: {
    label: "Detalhes",
    title: "Dê números aos planos.",
    desc: "Valor, prazo e prioridade transformam intenção em estratégia.",
  },
  renda: {
    label: "Renda",
    title: "Agora, o motor do plano.",
    desc: "Renda, gastos e capacidade de aporte mostram o ritmo real — e definem sua reserva de emergência ideal.",
  },
  patrimonio: {
    label: "Momento",
    title: "Qual é o seu momento hoje?",
    desc: "Essa resposta define a rota do plano daqui em diante.",
  },
  comparativo: {
    label: "Virada",
    title: "O custo de deixar o dinheiro parado.",
    desc: "Com os seus números: a mesma disciplina de hoje, em dois destinos muito diferentes.",
  },
  investimentos: {
    label: "Investimentos",
    title: "Agora, sobre seus investimentos.",
    desc: "Quanto mais fiel o retrato da sua carteira, mais preciso ficam o plano e o Raio-X.",
  },
  risco: {
    label: "Risco",
    title: "Calibre sua relação com risco.",
    desc: "O Plano Ideal precisa caber também no seu comportamento em momentos difíceis.",
  },
};

const PERFIL_TO_RISK: Record<PerfilRisco, GoalPayload["risk"]> = {
  conservador: "conservative",
  moderado: "moderate",
  arrojado: "aggressive",
};

type Props = {
  onResultadoVisibleChange?: (isVisible: boolean) => void;
};

type DiagnosticoState = Partial<DiagnosticoCompleto>;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function normalizeErrorText(message: string | null | undefined) {
  return (message ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isAuthError(message: string | null | undefined, status?: number) {
  const text = normalizeErrorText(message);

  return (
    status === 401 ||
    (text.includes("sess") && (text.includes("expirada") || text.includes("invalida"))) ||
    text.includes("nao autenticado") ||
    text.includes("acesso negado")
  );
}

function buildGoalsPayload(dados: DiagnosticoState): GoalPayload[] {
  const risk = PERFIL_TO_RISK[calcularPerfil(dados)];
  const objetivos = dados.objetivos_selecionados ?? [];

  if (objetivos.length === 0) {
    return [
      {
        name: "Aposentadoria",
        target: 1000000,
        years: 20,
        risk,
        priority: 3,
        nature: "aspirational",
        liquidity: "medium",
      },
    ];
  }

  return objetivos.map((objetivo) => {
    const detalhe = dados.detalhes_objetivos?.[objetivo.id];

    return {
      name: objetivo.label,
      target: detalhe?.valor ?? 0,
      years: detalhe?.horizonte_anos ?? 5,
      risk,
      priority: detalhe?.prioridade ?? 3,
      nature: detalhe?.natureza === "need" ? "essential" : "aspirational",
      liquidity: detalhe?.liquidez ?? "medium",
    };
  });
}

/** Persiste o estado do onboarding para o restante da plataforma (Raio-X, chat). */
function persistirConclusao(dados: DiagnosticoState, perfil: PerfilRisco) {
  try {
    localStorage.setItem("synapta.diagnostico_concluido", "1");
    localStorage.setItem("synapta.investe_atualmente", dados.investe_atualmente ?? "");
    localStorage.setItem("synapta.perfil", perfil);
    if (dados.investe_atualmente === "nao") {
      localStorage.setItem(
        "synapta.carteira_rf_gratis",
        JSON.stringify(CARTEIRA_RF_GRATIS[perfil])
      );
    }
  } catch {
    // localStorage indisponível (SSR/modo privado) — segue sem persistir.
  }
}

export function DiagnosticoWizard({ onResultadoVisibleChange }: Props) {
  const router = useRouter();
  const [planoEspecifico, setPlanoEspecifico] = useState<PlanoEspecifico | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  // Para quem não investe, o resultado abre nos Cenários (carteira RF grátis) antes do plano.
  const [resultView, setResultView] = useState<"cenarios" | "plano">("plano");
  // Tela de boas-vindas do Guia antes do wizard começar.
  const [iniciado, setIniciado] = useState(false);
  const topoRef = useRef<HTMLDivElement>(null);
  const {
    fluxo,
    etapaAtual,
    indiceEtapa,
    totalPerguntas,
    isLoading,
    error,
    limparErro,
    resultado,
    avancarEtapa,
    voltarEtapa,
    submeter,
    dados,
  } = useDiagnostico();

  const perfil = calcularPerfil(dados);
  const progressoPercent = (indiceEtapa / totalPerguntas) * 100;
  const isResultado = etapaAtual === "resultado" && (!!resultado || !!planoEspecifico) && !isLoading;
  const isResultadoVisible = isResultado && (resultView === "plano" || !!planoEspecifico);
  const copy = etapaAtual !== "resultado" ? ETAPA_META[etapaAtual] : null;
  const isTelaLarga = etapaAtual === "comparativo" || isResultado;

  // Roteiro do Guia Synapta: qual "cena" está na tela agora.
  const chatEtapaKey = !isResultado
    ? etapaAtual
    : planoEspecifico
    ? "plano-completo"
    : resultView === "cenarios"
    ? "cenarios"
    : `plano-${dados.investe_atualmente ?? "sim"}`;

  const chatExtras = (() => {
    if (!isResultado || planoEspecifico) return [] as string[];
    const reserva = calcularPlanoReserva(
      dados.gastos_mensais ?? 0,
      dados.patrimonio_total ?? 0,
      dados.aporte_mensal ?? 0
    );
    if (reserva.metaReserva > 0 && !reserva.temReserva) {
      return [
        "Sobre a sua <b>reserva de emergência</b>: ela ainda não cobre 6 meses de despesas. No card da reserva você vê quanto do aporte destinar a ela — em liquidez diária — enquanto o resto segue para os objetivos. 💪",
      ];
    }
    if (reserva.metaReserva > 0 && reserva.temReserva) {
      return [
        "Boa notícia: você já tem <b>mais de 6 meses de despesas guardados</b> — sua reserva de emergência está completa e 100% do aporte pode ir para os objetivos. ✅",
      ];
    }
    return [] as string[];
  })();
  const activeError = error || unlockError;
  const activeErrorIsAuth = isAuthError(activeError);
  const etapasBarra = fluxo.filter((key) => key !== "resultado");

  const closeError = () => {
    limparErro();
    setUnlockError(null);

    if (activeErrorIsAuth) {
      router.push("/auth/login");
    }
  };

  const desbloquearPlano = async () => {
    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const plano = await PlanoIdealService.gerar(buildGoalsPayload(dados));
      setPlanoEspecifico(plano as PlanoEspecifico);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Nao foi possivel gerar o plano completo. Tente novamente.");
      const status = getErrorStatus(err);
      setUnlockError(message);

      if (isAuthError(message, status)) {
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  // Ao trocar de etapa (ou de tela de resultado), volta ao topo da página —
  // evita a próxima etapa abrir "no meio" quando a anterior era longa.
  // Roda após o paint (rAF) para vencer qualquer ajuste de layout da animação.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      topoRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [etapaAtual, indiceEtapa, resultView, isLoading]);

  // Ao concluir o diagnóstico: define a primeira tela do resultado e persiste flags.
  useEffect(() => {
    if (!resultado) return;
    setResultView(dados.investe_atualmente === "nao" ? "cenarios" : "plano");
    persistirConclusao(dados, calcularPerfil(dados));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado]);

  useEffect(() => {
    // Avisa a página quando a tela atual é "larga" (comparativo, cenários, plano)
    // para alargar o container e aplicar o cartão com borda/sombra.
    onResultadoVisibleChange?.(isTelaLarga || isResultadoVisible || (isResultado && resultView === "cenarios"));
  }, [isResultado, isResultadoVisible, isTelaLarga, onResultadoVisibleChange, resultView]);

  useEffect(() => {
    if (!activeErrorIsAuth || !activeError) return;

    const redirectTimer = window.setTimeout(() => {
      router.push("/auth/login");
    }, 1800);

    return () => window.clearTimeout(redirectTimer);
  }, [activeError, activeErrorIsAuth, router]);

  if (!iniciado) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <BoasVindas onComecar={() => setIniciado(true)} />
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full ${isTelaLarga ? "max-w-6xl" : "max-w-3xl"}`}>
      <div ref={topoRef} aria-hidden="true" className="h-0 scroll-mt-24" />
      {!isResultado && !isLoading && (
        <div className="mb-9">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-brand-950/40">
              Etapa {indiceEtapa + 1} de {totalPerguntas}
            </p>
            <p className="text-xs font-bold text-primary-700">{Math.round(progressoPercent)}% completo</p>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-brand-950/10">
            <motion.div
              animate={{ width: `${progressoPercent}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="h-full rounded-full bg-primary-500"
            />
          </div>

          <div
            className="mt-4 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${etapasBarra.length}, minmax(0, 1fr))` }}
          >
            {etapasBarra.map((key, index) => (
              <div
                key={key}
                className={`truncate text-center text-[10px] font-semibold transition-colors ${
                  index < indiceEtapa
                    ? "text-primary-700"
                    : index === indiceEtapa
                    ? "text-blue-brand-950"
                    : "text-blue-brand-950/30"
                }`}
              >
                {ETAPA_META[key as Exclude<EtapaKey, "resultado">].label}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isResultado && !isLoading && copy && (
        <motion.div
          key={`title-${etapaAtual}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
        >
          <h2 className="font-editorial text-4xl leading-none text-blue-brand-950 md:text-5xl">{copy.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-blue-brand-950/60">{copy.desc}</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <EtapaLoadingScreen />
          </motion.div>
        ) : (
          <motion.div
            key={`${etapaAtual}-${etapaAtual === "resultado" ? resultView : ""}`}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.28 }}
          >
            {etapaAtual === "renda" && <Etapa1Form onNext={avancarEtapa} onBack={voltarEtapa} />}
            {etapaAtual === "patrimonio" && (
              <Etapa2Form onNext={avancarEtapa} onBack={voltarEtapa} gastosMensais={dados.gastos_mensais || 0} />
            )}
            {etapaAtual === "objetivos" && (
              <Etapa3Form onNext={avancarEtapa} onBack={voltarEtapa} podeVoltar={indiceEtapa > 0} />
            )}
            {etapaAtual === "detalhes" && (
              <Etapa4DetalhesObjetivos
                onNext={avancarEtapa}
                onBack={voltarEtapa}
                objetivos={dados.objetivos_selecionados ?? []}
              />
            )}
            {etapaAtual === "comparativo" && (
              <EtapaComparativoInvestir dados={dados} onNext={() => avancarEtapa()} onBack={voltarEtapa} />
            )}
            {etapaAtual === "investimentos" && (
              <EtapaInvestimentosForm
                // O total investido informado aqui vira também o patrimônio do plano
                // (evita a pergunta duplicada na etapa anterior).
                onNext={(data) => avancarEtapa({ ...data, patrimonio_total: data.valor_investido })}
                onBack={voltarEtapa}
              />
            )}
            {etapaAtual === "risco" && (
              <Etapa5Form onNext={submeter} onBack={voltarEtapa} isLoading={isLoading} />
            )}

            {isResultado && planoEspecifico && (
              <OutputEspecifico plano={planoEspecifico} onBack={() => setPlanoEspecifico(null)} />
            )}
            {isResultado && resultado && !planoEspecifico && resultView === "cenarios" && (
              <CenariosCarteiras
                dados={dados}
                perfil={perfil}
                onVerRecomendacao={() => setResultView("plano")}
              />
            )}
            {isResultado && resultado && !planoEspecifico && resultView === "plano" && (
              <OutputGenerico
                resultado={resultado}
                dadosCompletos={dados}
                onUnlock={desbloquearPlano}
                isUnlocking={isUnlocking}
                investeAtualmente={dados.investe_atualmente}
                perfil={perfil}
                exibirDisclaimerReserva={dados.investe_atualmente !== "nao"}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <GuiaChat etapaKey={chatEtapaKey} extras={chatExtras} />

      <ErrorModal
        isOpen={!!activeError}
        message={activeError}
        onClose={closeError}
        closeLabel={activeErrorIsAuth ? "Ir para login" : "Fechar"}
      />
    </div>
  );
}
