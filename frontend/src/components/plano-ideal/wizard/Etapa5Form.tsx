"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Etapa5Data, Etapa5Schema } from "@/schemas/diagnosticoSchemas";

const PERGUNTAS = [
  {
    campo: "reacao_queda" as const,
    label: "Se sua carteira cair 20% em um mes, voce:",
    opcoes: [
      { id: "vender_tudo", label: "Venderia tudo para evitar novas perdas", pontos: 0 },
      { id: "espera_preocupado", label: "Esperaria, mas com bastante desconforto", pontos: 1 },
      { id: "mantenho_tranquilo", label: "Manteria a estrategia com tranquilidade", pontos: 2 },
      { id: "compra_mais", label: "Aproveitaria para comprar mais barato", pontos: 3 },
    ],
  },
  {
    campo: "experiencia_rv" as const,
    label: "Sua experiencia com renda variavel:",
    opcoes: [
      { id: "nunca", label: "Nunca investi em acoes ou FIIs", pontos: 0 },
      { id: "pouca", label: "Tenho pouca experiencia", pontos: 1 },
      { id: "media", label: "Invisto ha alguns anos", pontos: 2 },
      { id: "experiente", label: "Tenho experiencia e acompanho o mercado", pontos: 3 },
    ],
  },
  {
    campo: "percentual_risco" as const,
    label: "Quanto do patrimonio voce aceita expor a risco?",
    opcoes: [
      { id: "ate_10", label: "Ate 10%, com foco em seguranca", pontos: 0 },
      { id: "ate_30", label: "Ate 30%, equilibrando seguranca e crescimento", pontos: 1 },
      { id: "ate_60", label: "Ate 60%, buscando maior retorno", pontos: 2 },
      { id: "mais_60", label: "Mais de 60%, com foco em crescimento", pontos: 3 },
    ],
  },
];

type Props = {
  onNext: (data: Etapa5Data) => void;
  onBack: () => void;
  isLoading?: boolean;
};

export function Etapa5Form({ onNext, onBack, isLoading }: Props) {
  const [perguntaAtualIndex, setPerguntaAtualIndex] = useState(0);

  const {
    handleSubmit,
    control,
    setValue,
    clearErrors,
  } = useForm<Etapa5Data>({
    resolver: zodResolver(Etapa5Schema),
    defaultValues: { reacao_queda: "", experiencia_rv: "", percentual_risco: "" },
  });

  const values = useWatch({ control });
  const perguntaAtual = PERGUNTAS[perguntaAtualIndex];
  const isUltimaPergunta = perguntaAtualIndex === PERGUNTAS.length - 1;
  const selectedValue = values[perguntaAtual.campo];
  const canAdvance = Boolean(selectedValue) && !isLoading;

  const handleVoltar = () => {
    if (perguntaAtualIndex > 0) {
      setPerguntaAtualIndex((index) => index - 1);
      return;
    }

    onBack();
  };

  const handleContinuar = () => {
    if (!selectedValue) {
      return;
    }

    setPerguntaAtualIndex((index) => Math.min(index + 1, PERGUNTAS.length - 1));
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!isUltimaPergunta) {
      event.preventDefault();
      handleContinuar();
      return;
    }

    if (!selectedValue) {
      event.preventDefault();
      return;
    }

    void handleSubmit(onNext)(event);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-700">
          Pergunta {perguntaAtualIndex + 1} de {PERGUNTAS.length}
        </p>
        <div className="flex gap-1.5">
          {PERGUNTAS.map((pergunta, index) => (
            <span
              key={pergunta.campo}
              className={`h-1.5 w-8 rounded-full ${index <= perguntaAtualIndex ? "bg-primary-500" : "bg-blue-brand-950/10"}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[1.25rem] bg-[#f7f3ea]/70 p-5">
        <p className="mb-4 text-base font-semibold text-blue-brand-950">{perguntaAtual.label}</p>
        <div className="space-y-2">
          {perguntaAtual.opcoes.map((opcao) => {
            const isSelected = selectedValue === opcao.id;
            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => {
                  setValue(perguntaAtual.campo, opcao.id, {
                    shouldDirty: true,
                    shouldValidate: false,
                  });
                  clearErrors(perguntaAtual.campo);
                }}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition-all ${
                  isSelected
                    ? "bg-blue-brand-950 text-white"
                    : "bg-white/65 text-blue-brand-950/60 hover:bg-white hover:text-blue-brand-950"
                }`}
              >
                {opcao.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleVoltar}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-blue-brand-950/15 px-5 py-3 text-sm font-semibold text-blue-brand-950/60 transition-all hover:border-blue-brand-950/35 hover:text-blue-brand-950"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {isUltimaPergunta ? (
          <button
            type="submit"
            disabled={!canAdvance}
            className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Calculando
              </>
            ) : (
              <>
                Ver resultado
                <ArrowRight size={16} />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleContinuar}
            disabled={!canAdvance}
            className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continuar
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </form>
  );
}

