export type OutputGenericoStatus =
  | "meta_critica"
  | "meta_apertada"
  | "plano_viavel"
  | "plano_forte";

export type OutputGenericoNarrative = {
  status: OutputGenericoStatus;
  titulo: string;
  subtitulo: string;
  cta_label: string;
};

type BuildInput = {
  probabilidade: number | null;
};

export class OutputGenericoNarrativeService {
  build({ probabilidade }: BuildInput): OutputGenericoNarrative {
    const status = this.classificar(probabilidade);

    return {
      status,
      ...this.copyFor(status),
    };
  }

  private classificar(probabilidade: number | null): OutputGenericoStatus {
    if (probabilidade === null) return "plano_viavel";
    if (probabilidade < 0.4) return "meta_critica";
    if (probabilidade < 0.6) return "meta_apertada";
    if (probabilidade < 0.8) return "plano_viavel";
    return "plano_forte";
  }

  private copyFor(
    status: OutputGenericoStatus
  ): Omit<OutputGenericoNarrative, "status"> {
    const copies: Record<
      OutputGenericoStatus,
      Omit<OutputGenericoNarrative, "status">
    > = {
      meta_critica: {
        titulo: "Seu objetivo pede uma rota mais inteligente",
        subtitulo:
          "O alvo informado ainda exige ajustes importantes, mas isso não significa falta de plano. Significa que precisamos escolher o melhor caminho.",
        cta_label: "Desbloquear plano completo",
      },
      meta_apertada: {
        titulo: "Seu plano está perto, mas precisa de alguns ajustes",
        subtitulo:
          "A estratégia tem caminho, porém a margem ainda está apertada. O próximo passo é transformar a meta em uma rota mais robusta.",
        cta_label: "Desbloquear plano completo",
      },
      plano_viavel: {
        titulo: "Sua estratégia está bem encaminhada",
        subtitulo:
          "Com os dados informados, o plano já mostra uma rota viável para buscar seu objetivo com equilíbrio.",
        cta_label: "Desbloquear plano completo",
      },
      plano_forte: {
        titulo: "Seu plano tem uma boa margem de segurança",
        subtitulo:
          "A combinação entre aporte, prazo, objetivo e perfil cria uma rota forte para perseguir o objetivo informado.",
        cta_label: "Desbloquear plano completo",
      },
    };

    return copies[status];
  }
}
