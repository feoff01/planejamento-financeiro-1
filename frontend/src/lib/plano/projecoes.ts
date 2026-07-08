/**
 * Projeções e regras do plano — biblioteca compartilhada pelas novas telas
 * do onboarding (Comparativo, Cenários e Plano Traçado).
 *
 * Taxas definidas pela estratégia do produto:
 *  - Poupança / método atual: 0,50% a.m.
 *  - Carteira de renda fixa (grátis): 1,25% a.m.
 *  - Carteira Synapta (RF + ações no peso certo): varia por perfil.
 */

import type { DiagnosticoCompleto } from "@/schemas/diagnosticoSchemas";

export type PerfilRisco = "conservador" | "moderado" | "arrojado";

export const TAXA_MENSAL = {
  poupanca: 0.005,
  rendaFixa: 0.0125,
  /** Liquidez diária (Tesouro Selic / CDB com resgate no dia) — onde vive a reserva. */
  reservaLiquidez: 0.01,
  synapta: {
    conservador: 0.0138,
    moderado: 0.0152,
    arrojado: 0.0168,
  } satisfies Record<PerfilRisco, number>,
} as const;

export const PERFIL_LABEL: Record<PerfilRisco, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

// ── Perfil de risco (mesma pontuação usada no DiagnosticoWizard) ─────────────
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

export function calcularPerfil(dados: Partial<DiagnosticoCompleto>): PerfilRisco {
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

  if (pontos <= 3) return "conservador";
  if (pontos <= 7) return "moderado";
  return "arrojado";
}

// ── Objetivo principal (maior prioridade; desempate por maior valor) ─────────
export type ObjetivoPrincipal = {
  id: string;
  label: string;
  valor: number;
  horizonte_anos: number;
};

export function objetivoPrincipal(dados: Partial<DiagnosticoCompleto>): ObjetivoPrincipal | null {
  const objetivos = dados.objetivos_selecionados ?? [];
  if (objetivos.length === 0) return null;

  let melhor: ObjetivoPrincipal | null = null;
  let melhorScore = -Infinity;

  for (const objetivo of objetivos) {
    const detalhe = dados.detalhes_objetivos?.[objetivo.id];
    const prioridade = detalhe?.prioridade ?? 3;
    const valor = detalhe?.valor ?? 0;
    const score = prioridade * 1_000_000_000 + valor;

    if (score > melhorScore) {
      melhorScore = score;
      melhor = {
        id: objetivo.id,
        label: objetivo.label,
        valor,
        horizonte_anos: detalhe?.horizonte_anos ?? 5,
      };
    }
  }

  return melhor;
}

// ── Séries de projeção ────────────────────────────────────────────────────────
export type PontoProjecao = { ano: number } & Record<string, number>;

/** Evolui patrimônio inicial + aporte mensal a uma taxa mensal, por N anos. */
export function serieAnual(
  chave: string,
  patrimonioInicial: number,
  aporteMensal: number,
  taxaMensal: number,
  anos: number
): Array<{ ano: number; [k: string]: number }> {
  const pontos: Array<{ ano: number; [k: string]: number }> = [
    { ano: 0, [chave]: round2(patrimonioInicial) },
  ];
  let valor = patrimonioInicial;

  for (let ano = 1; ano <= anos; ano++) {
    for (let mes = 0; mes < 12; mes++) {
      valor = valor * (1 + taxaMensal) + aporteMensal;
    }
    pontos.push({ ano, [chave]: round2(valor) });
  }

  return pontos;
}

/** Combina várias séries anuais em um único dataset para o recharts. */
export function combinarSeries(
  series: Array<Array<{ ano: number; [k: string]: number }>>
): PontoProjecao[] {
  const porAno = new Map<number, PontoProjecao>();

  for (const serie of series) {
    for (const ponto of serie) {
      const atual = porAno.get(ponto.ano) ?? ({ ano: ponto.ano } as PontoProjecao);
      porAno.set(ponto.ano, { ...atual, ...ponto });
    }
  }

  return [...porAno.values()].sort((a, b) => a.ano - b.ano);
}

/** Meses necessários para atingir a meta (cap de 50 anos). Null = não atinge. */
export function mesesParaMeta(
  patrimonioInicial: number,
  aporteMensal: number,
  taxaMensal: number,
  meta: number
): number | null {
  if (meta <= 0) return null;
  if (patrimonioInicial >= meta) return 0;

  let valor = patrimonioInicial;
  for (let mes = 1; mes <= 600; mes++) {
    valor = valor * (1 + taxaMensal) + aporteMensal;
    if (valor >= meta) return mes;
  }
  return null;
}

export function formatDuracao(meses: number | null): string {
  if (meses === null) return "+50 anos";
  if (meses === 0) return "hoje";
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;

  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (resto === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos}a ${resto}m`;
}

// ── Reserva de emergência (6 meses de despesas) ──────────────────────────────
/**
 * Racional da reserva:
 *  - Meta = 6 × gastos mensais.
 *  - O que já está guardado/investido conta para a reserva, esteja onde estiver.
 *  - Se a meta já está coberta → 100% do aporte segue para os objetivos.
 *  - Se falta reserva → uma fatia do aporte mensal vai para ela, em LIQUIDEZ DIÁRIA
 *    (Tesouro Selic / CDB com resgate no dia), enquanto o restante segue para os
 *    objetivos em paralelo. A fatia é calibrada para completar a reserva em uma
 *    janela saudável: nem lenta demais (> 24 meses), nem sacrificando os objetivos
 *    à toa (< 6 meses). Começa em 30% e ajusta entre 15% e 60%.
 */
export type PlanoReserva = {
  temReserva: boolean;
  metaReserva: number;
  guardadoAtual: number;
  falta: number;
  /** % do aporte mensal destinado à reserva enquanto ela não completa (0–100). */
  percentualAporte: number;
  aporteReserva: number;
  aporteObjetivos: number;
  mesesParaCompletar: number | null;
};

export function calcularPlanoReserva(
  gastosMensais: number,
  guardadoAtual: number,
  aporteMensal: number
): PlanoReserva {
  const metaReserva = Math.max(0, gastosMensais) * 6;
  const falta = Math.max(0, metaReserva - Math.max(0, guardadoAtual));
  const temReserva = falta <= 0;

  if (temReserva || aporteMensal <= 0) {
    return {
      temReserva,
      metaReserva,
      guardadoAtual: Math.max(0, guardadoAtual),
      falta,
      percentualAporte: 0,
      aporteReserva: 0,
      aporteObjetivos: Math.max(0, aporteMensal),
      mesesParaCompletar: temReserva ? 0 : null,
    };
  }

  const completaEm = (fracao: number) =>
    mesesParaMeta(0, aporteMensal * fracao, TAXA_MENSAL.reservaLiquidez, falta);

  let fracao = 0.3;
  let meses = completaEm(fracao);

  // Muito lento? Aumenta a fatia (até 60%) para completar em até ~24 meses.
  while (meses !== null && meses > 24 && fracao < 0.6 - 1e-9) {
    fracao = Math.min(0.6, fracao + 0.05);
    meses = completaEm(fracao);
  }
  // Rápido demais? Reduz a fatia (até 15%) e libera mais aporte para os objetivos.
  while (meses !== null && meses < 6 && fracao > 0.15 + 1e-9) {
    const proximaFracao = Math.max(0.15, fracao - 0.05);
    const proximosMeses = completaEm(proximaFracao);
    if (proximosMeses === null || proximosMeses > 24) break;
    fracao = proximaFracao;
    meses = proximosMeses;
  }

  const aporteReserva = Math.round(aporteMensal * fracao);

  return {
    temReserva: false,
    metaReserva,
    guardadoAtual: Math.max(0, guardadoAtual),
    falta,
    percentualAporte: Math.round(fracao * 100),
    aporteReserva,
    aporteObjetivos: Math.max(0, aporteMensal - aporteReserva),
    mesesParaCompletar: meses,
  };
}

// ── Carteira de Renda Fixa grátis (a "virada de chave") ──────────────────────
export type AtivoRendaFixa = {
  id: string;
  label: string;
  percentual: number;
  papel: string;
};

export const CARTEIRA_RF_GRATIS: Record<PerfilRisco, AtivoRendaFixa[]> = {
  conservador: [
    { id: "selic", label: "Tesouro Selic 2029", percentual: 35, papel: "Liquidez diária e segurança para a base do plano." },
    { id: "cdb-liq", label: "CDB 104% CDI (liquidez diária)", percentual: 20, papel: "Rende acima da poupança sem abrir mão do resgate rápido." },
    { id: "ipca35", label: "Tesouro IPCA+ 2035", percentual: 25, papel: "Protege o objetivo da inflação até o prazo da meta." },
    { id: "lci", label: "LCI 92% CDI (isenta de IR)", percentual: 12, papel: "Retorno líquido maior pela isenção de imposto." },
    { id: "pre", label: "Tesouro Prefixado 2031", percentual: 8, papel: "Trava uma taxa conhecida para parte da carteira." },
  ],
  moderado: [
    { id: "selic", label: "Tesouro Selic 2029", percentual: 22, papel: "Colchão de liquidez para imprevistos e oportunidades." },
    { id: "ipca35", label: "Tesouro IPCA+ 2035", percentual: 30, papel: "Crescimento real acima da inflação no horizonte da meta." },
    { id: "cdb110", label: "CDB 110% CDI", percentual: 20, papel: "Turbina o CDI com risco controlado (garantia FGC)." },
    { id: "lca", label: "LCA 94% CDI (isenta de IR)", percentual: 14, papel: "Eficiência tributária para o médio prazo." },
    { id: "pre", label: "Tesouro Prefixado 2031", percentual: 14, papel: "Aproveita o ciclo de juros com taxa travada." },
  ],
  arrojado: [
    { id: "selic", label: "Tesouro Selic 2029", percentual: 15, papel: "Reserva tática mínima com liquidez imediata." },
    { id: "ipca40", label: "Tesouro IPCA+ 2040", percentual: 33, papel: "Juro real longo — o motor de crescimento da renda fixa." },
    { id: "cdb115", label: "CDB 115% CDI", percentual: 20, papel: "Prêmio maior sobre o CDI dentro da garantia FGC." },
    { id: "deb", label: "Debênture incentivada IPCA+", percentual: 18, papel: "Isenção de IR com prêmio de crédito selecionado." },
    { id: "pre", label: "Tesouro Prefixado 2031", percentual: 14, papel: "Posição direcional em juros para acelerar a rota." },
  ],
};

/** Percentual macro de renda fixa da carteira Synapta ideal, por perfil. */
export const ALOCACAO_RF_SYNAPTA: Record<PerfilRisco, number> = {
  conservador: 70,
  moderado: 50,
  arrojado: 30,
};

function round2(valor: number) {
  return Number(valor.toFixed(2));
}
