"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PlanoIdealService, type GoalPayload } from "@/services/carteira/PlanoIdealService";
import type { DiagnosticoCompleto } from "@/schemas/diagnosticoSchemas";
import { useDiagnostico } from "@/hooks/useDiagnostico";
import { ErrorModal } from "../common/ErrorModal";
import { Etapa1Form } from "./wizard/Etapa1Form";
import { Etapa2Form } from "./wizard/Etapa2Form";
import { Etapa3Form } from "./wizard/Etapa3Form";
import { Etapa4DetalhesObjetivos } from "./wizard/Etapa4DetalhesObjetivos";
import { Etapa5Form } from "./wizard/Etapa5Form";
import { EtapaLoadingScreen } from "./wizard/EtapaLoadingScreen";
import { OutputEspecifico, type PlanoEspecifico } from "./wizard/OutputEspecifico";
import { OutputGenerico } from "./wizard/OutputGenerico";

const ETAPAS = [
  { num: 1, label: "Renda" },
  { num: 2, label: "Patrimônio" },
  { num: 3, label: "Objetivos" },
  { num: 4, label: "Detalhes" },
  { num: 5, label: "Risco" },
  { num: 6, label: "Resultado" },
];

const STEP_COPY: Record<number, { title: string; desc: string }> = {
  1: {
    title: "Comece pelo fluxo mensal.",
    desc: "Renda, gastos e capacidade de aporte mostram o ritmo real do plano.",
  },
  2: {
    title: "Defina seu ponto de partida.",
    desc: "Seu patrimônio atual fica registrado para futuras análises, sem abater os objetivos deste plano.",
  },
  3: {
    title: "Escolha os objetivos que importam.",
    desc: "A Synapta usa essas metas para organizar prioridade, prazo e alocação.",
  },
  4: {
    title: "Dê números aos planos.",
    desc: "Valor, prazo e prioridade transformam intenção em estratégia.",
  },
  5: {
    title: "Calibre sua relação com risco.",
    desc: "O Plano Ideal precisa caber também no seu comportamento em momentos difíceis.",
  },
};

const PONTOS_REACAO: Record<string, number> = {
  vender_tudo: 0,
  espera_preocupado: 1,
  mantenho_tranquilo: 2,
  compra_mais: 3,
};

const PONTOS_EXPERIENCIA: Record<string, number> = {
  nunca: 0,
  pouca: 1,
  media: 2,
  experiente: 3,
};

const PONTOS_RISCO: Record<string, number> = {
  ate_10: 0,
  ate_30: 1,
  ate_60: 2,
  mais_60: 3,
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

function calcularRiskLevel(dados: DiagnosticoState): GoalPayload["risk"] {
  let pontos =
    (PONTOS_REACAO[dados.reacao_queda ?? ""] ?? 0) +
    (PONTOS_EXPERIENCIA[dados.experiencia_rv ?? ""] ?? 0) +
    (PONTOS_RISCO[dados.percentual_risco ?? ""] ?? 0);

  const horizonteMax = Object.values(dados.detalhes_objetivos ?? {}).reduce(
    (max, detalhe) => Math.max(max, detalhe.horizonte_anos ?? 0),
    0
  );

  if (horizonteMax >= 15) pontos += 2;
  else if (horizonteMax >= 8) pontos += 1;

  if (pontos <= 3) return "conservative";
  if (pontos <= 7) return "moderate";
  return "aggressive";
}

function buildGoalsPayload(dados: DiagnosticoState): GoalPayload[] {
  const risk = calcularRiskLevel(dados);
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

export function DiagnosticoWizard({ onResultadoVisibleChange }: Props) {
  const router = useRouter();
  const [planoEspecifico, setPlanoEspecifico] = useState<PlanoEspecifico | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const {
    etapaAtual,
    isLoading,
    error,
    limparErro,
    resultado,
    avancarEtapa,
    voltarEtapa,
    submeter,
    dados,
  } = useDiagnostico();

  const progressoPercent = ((etapaAtual - 1) / 5) * 100;
  const isResultadoVisible = etapaAtual === 6 && (!!resultado || !!planoEspecifico) && !isLoading;
  const copy = STEP_COPY[etapaAtual];
  const activeError = error || unlockError;
  const activeErrorIsAuth = isAuthError(activeError);

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

  useEffect(() => {
    onResultadoVisibleChange?.(isResultadoVisible);
  }, [isResultadoVisible, onResultadoVisibleChange]);

  useEffect(() => {
    if (!activeErrorIsAuth || !activeError) return;

    const redirectTimer = window.setTimeout(() => {
      router.push("/auth/login");
    }, 1800);

    return () => window.clearTimeout(redirectTimer);
  }, [activeError, activeErrorIsAuth, router]);

  return (
    <div className={`mx-auto w-full ${isResultadoVisible ? "max-w-6xl" : "max-w-3xl"}`}>
      {etapaAtual < 6 && !isLoading && (
        <div className="mb-9">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-brand-950/40">
              Etapa {etapaAtual} de 5
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

          <div className="mt-4 grid grid-cols-5 gap-1">
            {ETAPAS.filter((e) => e.num < 6).map((etapa) => (
              <div
                key={etapa.num}
                className={`truncate text-center text-[10px] font-semibold transition-colors ${
                  etapa.num < etapaAtual
                    ? "text-primary-700"
                    : etapa.num === etapaAtual
                    ? "text-blue-brand-950"
                    : "text-blue-brand-950/30"
                }`}
              >
                {etapa.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {etapaAtual < 6 && !isLoading && copy && (
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
            key={etapaAtual}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.28 }}
          >
            {etapaAtual === 1 && <Etapa1Form onNext={avancarEtapa} />}
            {etapaAtual === 2 && (
              <Etapa2Form onNext={avancarEtapa} onBack={voltarEtapa} gastosMensais={dados.gastos_mensais || 0} />
            )}
            {etapaAtual === 3 && <Etapa3Form onNext={avancarEtapa} onBack={voltarEtapa} />}
            {etapaAtual === 4 && (
              <Etapa4DetalhesObjetivos
                onNext={avancarEtapa}
                onBack={voltarEtapa}
                objetivos={dados.objetivos_selecionados ?? []}
              />
            )}
            {etapaAtual === 5 && <Etapa5Form onNext={submeter} onBack={voltarEtapa} isLoading={isLoading} />}
            {etapaAtual === 6 && planoEspecifico && (
              <OutputEspecifico plano={planoEspecifico} onBack={() => setPlanoEspecifico(null)} />
            )}
            {etapaAtual === 6 && resultado && !planoEspecifico && (
              <OutputGenerico
                resultado={resultado}
                dadosCompletos={dados}
                onUnlock={desbloquearPlano}
                isUnlocking={isUnlocking}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ErrorModal
        isOpen={!!activeError}
        message={activeError}
        onClose={closeError}
        closeLabel={activeErrorIsAuth ? "Ir para login" : "Fechar"}
      />
    </div>
  );
}

