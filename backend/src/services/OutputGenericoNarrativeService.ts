import { DiagnosticoInput } from "../domain/diagnosticoSchemas";

export type OutputGenericoStatus =
  | "base_fragil"
  | "base_incompleta"
  | "meta_critica"
  | "meta_apertada"
  | "plano_viavel"
  | "plano_forte";

export type OutputGenericoPasso = {
  titulo: string;
  descricao: string;
  status: "agora" | "proximo" | "depois";
};

export type OutputGenericoNarrative = {
  status: OutputGenericoStatus;
  titulo: string;
  subtitulo: string;
  prioridade_atual: string;
  passos: OutputGenericoPasso[];
  cta_label: string;
  mostrar_probabilidade_no_topo: boolean;
  metricas: {
    probabilidade: number | null;
    reserva_atual: number;
    reserva_ideal: number;
    gap_reserva: number;
  };
};

type BuildInput = {
  dados: DiagnosticoInput;
  probabilidade: number | null;
  alertas: string[];
};

export class OutputGenericoNarrativeService {
  build({ dados, probabilidade, alertas }: BuildInput): OutputGenericoNarrative {
    const reservaIdeal = dados.gastos_mensais * 6;
    const reservaAtual = dados.valor_reserva;
    const gapReserva = Math.max(reservaIdeal - reservaAtual, 0);
    const status = this.classificar(dados.meses_reserva, probabilidade);
    const mostrarProbabilidadeNoTopo = status === "plano_viavel" || status === "plano_forte";

    return {
      status,
      ...this.copyFor(status, alertas),
      mostrar_probabilidade_no_topo: mostrarProbabilidadeNoTopo,
      metricas: {
        probabilidade,
        reserva_atual: reservaAtual,
        reserva_ideal: reservaIdeal,
        gap_reserva: gapReserva,
      },
    };
  }

  private classificar(mesesReserva: number, probabilidade: number | null): OutputGenericoStatus {
    if (mesesReserva < 3) return "base_fragil";
    if (mesesReserva < 6) return "base_incompleta";
    if (probabilidade === null) return "plano_viavel";
    if (probabilidade < 0.4) return "meta_critica";
    if (probabilidade < 0.6) return "meta_apertada";
    if (probabilidade < 0.8) return "plano_viavel";
    return "plano_forte";
  }

  private copyFor(
    status: OutputGenericoStatus,
    alertas: string[]
  ): Omit<OutputGenericoNarrative, "status" | "mostrar_probabilidade_no_topo" | "metricas"> {
    const alertaReserva = alertas[0];

    const copies: Record<
      OutputGenericoStatus,
      Omit<OutputGenericoNarrative, "status" | "mostrar_probabilidade_no_topo" | "metricas">
    > = {
      base_fragil: {
        titulo: "Seu plano ideal começa pela construção da base",
        subtitulo:
          alertaReserva ||
          "Antes de buscar mais retorno, sua prioridade é criar segurança para não precisar mexer nos investimentos no momento errado.",
        prioridade_atual: "Reserva de emergência",
        passos: [
          {
            titulo: "Blindar sua rotina financeira",
            descricao: "A primeira fase é formar uma reserva mínima para proteger seus gastos essenciais.",
            status: "agora",
          },
          {
            titulo: "Organizar aportes mensais",
            descricao: "Depois da base, o plano define quanto direcionar por mês para evoluir com consistência.",
            status: "proximo",
          },
          {
            titulo: "Avançar para a carteira ideal",
            descricao: "Com a reserva encaminhada, a estratégia pode buscar crescimento com mais tranquilidade.",
            status: "depois",
          },
        ],
        cta_label: "Ver minha rota de investimento",
      },
      base_incompleta: {
        titulo: "Sua estratégia já tem direção, mas ainda precisa reforçar a base",
        subtitulo:
          "Você já saiu do zero. Agora o plano precisa completar a reserva para liberar mais espaço para crescimento.",
        prioridade_atual: "Completar reserva e preparar crescimento",
        passos: [
          {
            titulo: "Completar a reserva recomendada",
            descricao: "A fase atual é chegar perto de 6 meses de gastos protegidos.",
            status: "agora",
          },
          {
            titulo: "Separar objetivo e segurança",
            descricao: "O plano organiza o que fica em liquidez e o que pode trabalhar por mais tempo.",
            status: "proximo",
          },
          {
            titulo: "Aplicar a carteira por fase",
            descricao: "Com a base pronta, a alocação fica mais alinhada ao objetivo informado.",
            status: "depois",
          },
        ],
        cta_label: "Ver plano detalhado",
      },
      meta_critica: {
        titulo: "Seu objetivo pede uma rota mais inteligente",
        subtitulo:
          "O alvo informado ainda exige ajustes importantes, mas isso não significa falta de plano. Significa que precisamos escolher o melhor caminho.",
        prioridade_atual: "Ajustar rota do objetivo",
        passos: [
          {
            titulo: "Recalibrar o objetivo",
            descricao: "A Synapta identifica se o melhor ajuste está no prazo, no aporte ou no tamanho da meta.",
            status: "agora",
          },
          {
            titulo: "Preservar o que você já construiu",
            descricao: "A carteira evita forçar risco excessivo só para tentar compensar a distância até a meta.",
            status: "proximo",
          },
          {
            titulo: "Executar com acompanhamento",
            descricao: "O plano detalhado mostra a ordem de aportes e a estratégia para evoluir mês a mês.",
            status: "depois",
          },
        ],
        cta_label: "Montar minha rota ajustada",
      },
      meta_apertada: {
        titulo: "Seu plano está perto, mas precisa de alguns ajustes",
        subtitulo:
          "A estratégia tem caminho, porém a margem ainda está apertada. O próximo passo é transformar a meta em uma rota mais robusta.",
        prioridade_atual: "Fortalecer a probabilidade do plano",
        passos: [
          {
            titulo: "Identificar o gargalo principal",
            descricao: "O plano mostra se o ponto mais sensível é aporte, prazo, risco ou tamanho do objetivo.",
            status: "agora",
          },
          {
            titulo: "Ajustar sem exagerar no risco",
            descricao: "A carteira busca melhorar a chance sem transformar seu objetivo em uma aposta.",
            status: "proximo",
          },
          {
            titulo: "Acompanhar a evolução",
            descricao: "Com o plano detalhado, você acompanha se a rota está ficando mais forte ao longo do tempo.",
            status: "depois",
          },
        ],
        cta_label: "Ver como fortalecer meu plano",
      },
      plano_viavel: {
        titulo: "Sua estratégia está bem encaminhada",
        subtitulo:
          "Com os dados informados, o plano já mostra uma rota viável para buscar seu objetivo com equilíbrio.",
        prioridade_atual: "Executar a carteira recomendada",
        passos: [
          {
            titulo: "Seguir a alocação inicial",
            descricao: "A carteira foi montada para combinar prazo, perfil e objetivo.",
            status: "agora",
          },
          {
            titulo: "Manter consistência nos aportes",
            descricao: "A evolução depende de repetir o plano com disciplina ao longo dos meses.",
            status: "proximo",
          },
          {
            titulo: "Revisar quando a vida mudar",
            descricao: "Mudanças de renda, gastos ou objetivo devem atualizar a rota.",
            status: "depois",
          },
        ],
        cta_label: "Ver plano detalhado",
      },
      plano_forte: {
        titulo: "Seu plano tem uma boa margem de segurança",
        subtitulo:
          "A combinação entre reserva, aporte, prazo e perfil cria uma base forte para perseguir o objetivo informado.",
        prioridade_atual: "Executar e otimizar",
        passos: [
          {
            titulo: "Colocar a carteira em prática",
            descricao: "O plano específico mostra onde cada parte da estratégia entra.",
            status: "agora",
          },
          {
            titulo: "Otimizar os aportes",
            descricao: "Com boa margem, o foco passa a ser eficiência e consistência.",
            status: "proximo",
          },
          {
            titulo: "Acompanhar oportunidades",
            descricao: "A Synapta ajuda a revisar a rota quando surgirem novos objetivos ou mudanças de mercado.",
            status: "depois",
          },
        ],
        cta_label: "Ver carteira ideal completa",
      },
    };

    return copies[status];
  }
}
