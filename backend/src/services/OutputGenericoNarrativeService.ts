import { DiagnosticoInput } from "../domain/diagnosticoSchemas";
import { Asset } from "../domain/carteiraIdealSchemas";

export type OutputGenericoStatus =
  | "base_fragil"
  | "base_incompleta"
  | "meta_critica"
  | "meta_apertada"
  | "plano_viavel"
  | "plano_forte";

export type OutputGenericoFaseEstrategica =
  | "construir_reserva"
  | "completar_reserva"
  | "investir_para_objetivos";

export type OutputGenericoTipoPlano =
  | "reserva_emergencia"
  | "objetivos";

export type OutputGenericoPasso = {
  titulo: string;
  descricao: string;
  status: "agora" | "proximo" | "depois";
};

export type OutputGenericoReservaPlanoAtivo = {
  asset_id: string;
  nome: string;
  categoria: "selic";
  percentual: number;
  valor_destino: number;
  aporte_mensal: number;
  retorno_liquido_aa: number;
  retorno_bruto_aa: number;
  volatilidade_aa: number;
  prazo_anos: number;
  liquidez: "diaria";
  explicacao: string;
};

export type OutputGenericoNarrative = {
  status: OutputGenericoStatus;
  fase_estrategica: OutputGenericoFaseEstrategica;
  tipo_plano: OutputGenericoTipoPlano;
  bloquear_carteira_objetivos: boolean;
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
    aporte_recomendado_reserva: number;
    meses_para_completar: number | null;
    percentual_aporte_reserva: number;
    plano_ativos: OutputGenericoReservaPlanoAtivo[];
  };
};

type BuildInput = {
  dados: DiagnosticoInput;
  probabilidade: number | null;
  alertas: string[];
  reservaAsset?: Asset;
};

export class OutputGenericoNarrativeService {
  build({ dados, probabilidade, alertas, reservaAsset }: BuildInput): OutputGenericoNarrative {
    const reservaIdeal = dados.gastos_mensais * 6;
    const reservaAtual = dados.valor_reserva;
    const gapReserva = Math.max(reservaIdeal - reservaAtual, 0);
    const mesesEfetivos = dados.ignorar_reserva ? 999 : dados.meses_reserva;
    const status = this.classificar(mesesEfetivos, probabilidade);
    const faseEstrategica = dados.ignorar_reserva 
      ? "investir_para_objetivos" 
      : this.faseEstrategicaPara(dados.meses_reserva);
    const tipoPlano: OutputGenericoTipoPlano =
      faseEstrategica === "investir_para_objetivos" ? "objetivos" : "reserva_emergencia";
    const bloquearCarteiraObjetivos = tipoPlano === "reserva_emergencia";
    const aporteRecomendadoReserva = bloquearCarteiraObjetivos ? dados.aporte_mensal : 0;
    const mesesParaCompletar = this.calcularMesesParaCompletar(gapReserva, aporteRecomendadoReserva);
    const planoAtivos = bloquearCarteiraObjetivos
      ? this.buildPlanoAtivosReserva(reservaAsset, gapReserva, aporteRecomendadoReserva)
      : [];
    const mostrarProbabilidadeNoTopo =
      tipoPlano === "objetivos" && (status === "plano_viavel" || status === "plano_forte");

    return {
      status,
      fase_estrategica: faseEstrategica,
      tipo_plano: tipoPlano,
      bloquear_carteira_objetivos: bloquearCarteiraObjetivos,
      ...this.copyFor(status, alertas),
      mostrar_probabilidade_no_topo: mostrarProbabilidadeNoTopo,
      metricas: {
        probabilidade,
        reserva_atual: reservaAtual,
        reserva_ideal: reservaIdeal,
        gap_reserva: gapReserva,
        aporte_recomendado_reserva: aporteRecomendadoReserva,
        meses_para_completar: mesesParaCompletar,
        percentual_aporte_reserva: bloquearCarteiraObjetivos ? 100 : 0,
        plano_ativos: planoAtivos,
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

  private faseEstrategicaPara(mesesReserva: number): OutputGenericoFaseEstrategica {
    if (mesesReserva < 3) return "construir_reserva";
    if (mesesReserva < 6) return "completar_reserva";
    return "investir_para_objetivos";
  }

  private calcularMesesParaCompletar(gapReserva: number, aporteMensal: number): number | null {
    if (gapReserva <= 0) return 0;
    if (aporteMensal <= 0) return null;
    return Math.ceil(gapReserva / aporteMensal);
  }

  private buildPlanoAtivosReserva(
    asset: Asset | undefined,
    gapReserva: number,
    aporteMensal: number
  ): OutputGenericoReservaPlanoAtivo[] {
    if (!asset || asset.cat !== "selic") return [];

    return [
      {
        asset_id: asset.id,
        nome: asset.label,
        categoria: "selic",
        percentual: 100,
        valor_destino: gapReserva,
        aporte_mensal: aporteMensal,
        retorno_liquido_aa: asset.ret_l,
        retorno_bruto_aa: asset.ret_b,
        volatilidade_aa: asset.vol,
        prazo_anos: asset.anos,
        liquidez: "diaria",
        explicacao:
          "Esse ativo faz sentido para reserva porque combina baixo risco, liquidez diária e pouca oscilação, reduzindo a chance de precisar vender investimentos de objetivos em um momento ruim.",
      },
    ];
  }

  private copyFor(
    status: OutputGenericoStatus,
    alertas: string[]
  ): Omit<
    OutputGenericoNarrative,
    | "status"
    | "fase_estrategica"
    | "tipo_plano"
    | "bloquear_carteira_objetivos"
    | "mostrar_probabilidade_no_topo"
    | "metricas"
  > {
    const alertaReserva = alertas[0];

    const copies: Record<
      OutputGenericoStatus,
      Omit<
        OutputGenericoNarrative,
        | "status"
        | "fase_estrategica"
        | "tipo_plano"
        | "bloquear_carteira_objetivos"
        | "mostrar_probabilidade_no_topo"
        | "metricas"
      >
    > = {
      base_fragil: {
        titulo: "Sua prioridade agora é construir sua reserva",
        subtitulo:
          alertaReserva ||
          "Antes de buscar retorno para objetivos, sua prioridade é criar segurança para não precisar vender investimentos no momento errado.",
        prioridade_atual: "Construir reserva de emergência",
        passos: [
          {
            titulo: "Proteger seus gastos essenciais",
            descricao: "A primeira fase é formar uma reserva mínima para cobrir imprevistos sem comprometer seus objetivos.",
            status: "agora",
          },
          {
            titulo: "Direcionar seus aportes para a base",
            descricao: "Enquanto a reserva não estiver pronta, 100% do aporte recomendado fica focado em liquidez e baixo risco.",
            status: "proximo",
          },
          {
            titulo: "Liberar a carteira de objetivos",
            descricao: "Seus objetivos ficam registrados e entram na estratégia quando a reserva alcançar 6 meses de gastos.",
            status: "depois",
          },
        ],
        cta_label: "Desbloquear plano exato da minha reserva",
      },
      base_incompleta: {
        titulo: "Sua reserva já começou, agora falta completar a base",
        subtitulo:
          "Você já saiu do zero. Antes de investir para objetivos, o próximo passo é fechar a reserva recomendada.",
        prioridade_atual: "Completar reserva de emergência",
        passos: [
          {
            titulo: "Completar a reserva recomendada",
            descricao: "A fase atual é chegar perto de 6 meses de gastos protegidos.",
            status: "agora",
          },
          {
            titulo: "Manter os aportes na reserva",
            descricao: "Até a base ficar pronta, a recomendação é não dividir aportes com objetivos de longo prazo.",
            status: "proximo",
          },
          {
            titulo: "Usar os objetivos salvos",
            descricao: "Com a reserva completa, a Synapta recalcula a carteira usando os objetivos que você informou.",
            status: "depois",
          },
        ],
        cta_label: "Ver plano para completar minha reserva",
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
