/**
 * Motor do Raio-X da Carteira — port das regras de diagnóstico do
 * otimizador Markowitz (markowitz_v2.py) para o frontend.
 *
 * Regras da casa (não editáveis pelo cliente):
 *  - Máximo 17% por ativo
 *  - Máximo 33% por setor
 *
 * A versão gratuita roda este diagnóstico no navegador. As 3 carteiras
 * sugeridas (Mais Eficiência / Mais Segurança / Mais Retorno) usam a
 * otimização Markowitz completa e fazem parte do plano pago.
 */

import {
  ALOCACAO_RF_SYNAPTA,
  PERFIL_LABEL,
  type AtivoRendaFixa,
  type PerfilRisco,
} from "@/lib/plano/projecoes";
import { setorDoTicker } from "./setores";

export const LIMITE_POR_ATIVO = 0.17;
export const LIMITE_POR_SETOR = 0.33;
export const TAXA_LIVRE_RISCO = 0.145; // config_admin.json

/** Carteira recomendada da casa (carteira_admin.json). */
export const CARTEIRA_ADMIN = [
  "DIRR3",
  "LAVV3",
  "ABCB4",
  "SAPR11",
  "BBDC4",
  "OFSA3",
  "BRAV3",
  "ISAE4",
] as const;

export type AtivoCarteira = {
  ticker: string;
  peso: number; // fração (0.25 = 25%)
};

export type ProblemaCarteira = {
  tipo:
    | "concentracao_ativo"
    | "concentracao_setor"
    | "poucos_ativos"
    | "soma_invalida"
    | "sem_renda_variavel";
  severidade: "alta" | "media";
  titulo: string;
  descricao: string;
  valor?: number;
  setor?: string;
};

export type ExposicaoSetor = {
  setor: string;
  peso: number;
  acimaLimite: boolean;
};

export type SugestaoDiversificacao = {
  ticker: string;
  setorNovo: string;
  motivo: string;
};

export type ResultadoRaioX = {
  /** "acoes": carteira de bolsa (regras 17%/33%). "renda_fixa": carteira RF Synapta. */
  tipoCarteira: "acoes" | "renda_fixa";
  ativos: AtivoCarteira[];
  problemas: ProblemaCarteira[];
  /** O que a carteira tem de bom (usado na análise da carteira RF grátis). */
  pontosFortes: string[];
  exposicaoSetorial: ExposicaoSetor[];
  maiorPosicao: AtivoCarteira | null;
  ativosRelevantes: number;
  setoresPresentes: number;
  sugestoesDiversificacao: SugestaoDiversificacao[];
  /** Quanto de renda variável a carteira Synapta ideal teria para o perfil. */
  recomendacaoRV?: { perfilLabel: string; percentualIdeal: number };
  /** Nota de 0 a 100 baseada nos problemas encontrados (visão macro grátis). */
  scoreSaude: number;
};

export function normalizarTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
}

const pct = (valor: number, casas = 1) => `${(valor * 100).toFixed(casas)}%`;

/** Agrupa os pesos por setor B3 e marca quem passou do limite. */
export function exposicaoSetorial(ativos: AtivoCarteira[]): ExposicaoSetor[] {
  const porSetor = new Map<string, number>();

  for (const ativo of ativos) {
    const setor = setorDoTicker(ativo.ticker);
    porSetor.set(setor, (porSetor.get(setor) ?? 0) + ativo.peso);
  }

  return [...porSetor.entries()]
    .map(([setor, peso]) => ({
      setor,
      peso,
      acimaLimite: peso > LIMITE_POR_SETOR + 1e-6,
    }))
    .sort((a, b) => b.peso - a.peso);
}

/** Port de diagnosticar_carteira(): problemas em linguagem leiga. */
export function diagnosticarCarteira(ativos: AtivoCarteira[]): ProblemaCarteira[] {
  const problemas: ProblemaCarteira[] = [];

  // 1) Concentração por ativo
  for (const ativo of ativos) {
    if (ativo.peso > LIMITE_POR_ATIVO + 1e-6) {
      problemas.push({
        tipo: "concentracao_ativo",
        severidade: "alta",
        titulo: `${ativo.ticker} pesa demais`,
        descricao: `${ativo.ticker} representa ${pct(ativo.peso)} da carteira. Pela regra da casa, nenhum ativo deve passar de ${pct(
          LIMITE_POR_ATIVO,
          0
        )}. Concentrar muito em uma ação só amplia o risco de perdas pesadas se ela cair.`,
        valor: ativo.peso,
      });
    }
  }

  // 2) Concentração por setor
  for (const expo of exposicaoSetorial(ativos)) {
    if (expo.acimaLimite && expo.setor !== "Sem setor") {
      problemas.push({
        tipo: "concentracao_setor",
        severidade: "alta",
        titulo: `Setor ${expo.setor} concentrado`,
        descricao: `O setor ${expo.setor} soma ${pct(expo.peso)} da carteira. O limite recomendado é ${pct(
          LIMITE_POR_SETOR,
          0
        )}. Quando um setor inteiro vai mal (juros, regulação, commodities), todas essas ações tendem a cair juntas.`,
        valor: expo.peso,
        setor: expo.setor,
      });
    }
  }

  // 3) Diversificação geral
  const relevantes = ativos.filter((ativo) => ativo.peso > 0.01).length;
  if (relevantes < 5) {
    problemas.push({
      tipo: "poucos_ativos",
      severidade: "media",
      titulo: "Poucos ativos na carteira",
      descricao: `Sua carteira tem apenas ${relevantes} ${relevantes === 1 ? "ativo relevante" : "ativos relevantes"}. Para diluir bem o risco, costuma-se sugerir pelo menos 5-8 ativos de setores diferentes.`,
    });
  }

  // 4) Soma diferente de 100%
  const soma = ativos.reduce((total, ativo) => total + ativo.peso, 0);
  if (Math.abs(soma - 1) > 1e-3) {
    problemas.push({
      tipo: "soma_invalida",
      severidade: "alta",
      titulo: "Pesos não somam 100%",
      descricao: `A soma dos pesos é ${pct(soma, 2)}. Ajuste para totalizar 100%.`,
    });
  }

  return problemas;
}

/**
 * Port de sugerir_substituicoes_setoriais(): ações da carteira da casa em
 * setores que o cliente NÃO tem (os nomes ficam borrados na versão grátis).
 */
export function sugerirDiversificacao(ativos: AtivoCarteira[]): SugestaoDiversificacao[] {
  const setoresCliente = new Set(ativos.map((ativo) => setorDoTicker(ativo.ticker)));
  const codigosCliente = new Set(
    ativos.map((ativo) => normalizarTicker(ativo.ticker).replace(/[^A-Z]/g, ""))
  );

  const sugestoes: SugestaoDiversificacao[] = [];

  for (const ticker of CARTEIRA_ADMIN) {
    const setor = setorDoTicker(ticker);
    const codigo = ticker.replace(/[^A-Z]/g, "");

    if (setor !== "Sem setor" && !setoresCliente.has(setor) && !codigosCliente.has(codigo)) {
      sugestoes.push({
        ticker,
        setorNovo: setor,
        motivo: `O setor ${setor} está ausente da sua carteira. Adicionar este ativo ajuda a diversificar.`,
      });
    }
  }

  return sugestoes;
}

/** Executa o Raio-X completo (parte gratuita). Pesos são normalizados. */
export function executarRaioX(entrada: AtivoCarteira[]): ResultadoRaioX {
  const ativos = entrada
    .map((ativo) => ({ ticker: normalizarTicker(ativo.ticker), peso: ativo.peso }))
    .filter((ativo) => ativo.ticker.length > 0 && ativo.peso > 0);

  const problemas = diagnosticarCarteira(ativos);
  const expo = exposicaoSetorial(ativos);
  const maiorPosicao =
    ativos.length > 0 ? [...ativos].sort((a, b) => b.peso - a.peso)[0] : null;

  const penalidade = problemas.reduce(
    (total, problema) => total + (problema.severidade === "alta" ? 22 : 12),
    0
  );

  return {
    tipoCarteira: "acoes",
    ativos,
    problemas,
    pontosFortes: [],
    exposicaoSetorial: expo,
    maiorPosicao,
    ativosRelevantes: ativos.filter((ativo) => ativo.peso > 0.01).length,
    setoresPresentes: expo.filter((item) => item.setor !== "Sem setor").length,
    sugestoesDiversificacao: sugerirDiversificacao(ativos),
    scoreSaude: Math.max(10, 100 - penalidade),
  };
}

/**
 * Raio-X da carteira de RENDA FIXA grátis (dada a quem ainda não investe).
 * A carteira é boa para começar — a análise valida isso e mostra o que falta:
 * a parte de renda variável, no peso certo do perfil.
 */
export function executarRaioXRendaFixa(
  carteira: AtivoRendaFixa[],
  perfil: PerfilRisco
): ResultadoRaioX {
  const ativos: AtivoCarteira[] = carteira.map((ativo) => ({
    ticker: ativo.label,
    peso: ativo.percentual / 100,
  }));

  // Pizza por ativo (não há setores B3 em renda fixa).
  const exposicao: ExposicaoSetor[] = ativos
    .map((ativo) => ({ setor: ativo.ticker, peso: ativo.peso, acimaLimite: false }))
    .sort((a, b) => b.peso - a.peso);

  const rvIdeal = 100 - ALOCACAO_RF_SYNAPTA[perfil];

  const problemas: ProblemaCarteira[] = [
    {
      tipo: "sem_renda_variavel",
      severidade: "media",
      titulo: "Falta a parte de ações (renda variável)",
      descricao: `Sua carteira está 100% em renda fixa — ótimo para começar com segurança, mas é a renda variável que acelera a chegada ao objetivo. Para o seu perfil ${PERFIL_LABEL[
        perfil
      ].toLowerCase()}, a carteira Synapta ideal destina cerca de ${rvIdeal}% a ações, no peso certo de cada uma.`,
      valor: rvIdeal / 100,
    },
  ];

  const pontosFortes = [
    "Dentro das regras da casa: nenhuma posição concentrada demais para uma carteira de renda fixa.",
    "Bem distribuída entre indexadores: liquidez (Selic/CDI), proteção contra inflação (IPCA+) e taxa travada (prefixado).",
    `Coerente com o seu perfil ${PERFIL_LABEL[perfil].toLowerCase()}: segurança e liquidez na medida para a base do plano.`,
  ];

  return {
    tipoCarteira: "renda_fixa",
    ativos,
    problemas,
    pontosFortes,
    exposicaoSetorial: exposicao,
    maiorPosicao: ativos.length > 0 ? [...ativos].sort((a, b) => b.peso - a.peso)[0] : null,
    ativosRelevantes: ativos.length,
    setoresPresentes: 0,
    // Sem ações na carteira, todos os setores da carteira da casa estão ausentes —
    // são exatamente as sugestões (borradas no grátis) do que falta.
    sugestoesDiversificacao: sugerirDiversificacao([]),
    recomendacaoRV: { perfilLabel: PERFIL_LABEL[perfil], percentualIdeal: rvIdeal },
    scoreSaude: 78,
  };
}

/**
 * Interpreta arquivo CSV/TXT no formato "TICKER;PESO" (uma linha por ativo).
 * Aceita ; , ou tab como separador e vírgula decimal.
 */
export function parseArquivoCarteira(conteudo: string): AtivoCarteira[] {
  const ativos: AtivoCarteira[] = [];

  for (const linhaBruta of conteudo.split(/\r?\n/)) {
    const linha = linhaBruta.trim();
    if (!linha) continue;

    const partes = linha.split(/[;,\t]+/).map((parte) => parte.trim());
    if (partes.length < 2) continue;

    const ticker = normalizarTicker(partes[0]);
    const peso = Number(partes[1].replace("%", "").replace(",", "."));

    if (!/^[A-Z]{4}\d{1,2}$/.test(ticker)) continue;
    if (!Number.isFinite(peso) || peso <= 0) continue;

    ativos.push({ ticker, peso: peso > 1 ? peso / 100 : peso });
  }

  return ativos;
}
