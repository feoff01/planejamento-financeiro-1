"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Etapa5Data, Etapa5Schema } from "@/schemas/diagnosticoSchemas";

const PERGUNTAS = [
  {
    campo: "reacao_queda" as const,
    label: "Se sua carteira cair 20% em um mês, você:",
    opcoes: [
      { id: "vender_tudo", label: "Venderia tudo para evitar novas perdas", pontos: 0 },
      { id: "espera_preocupado", label: "Esperaria, mas com bastante desconforto", pontos: 1 },
      { id: "mantenho_tranquilo", label: "Manteria a estratégia com tranquilidade", pontos: 2 },
      { id: "compra_mais", label: "Aproveitaria para comprar mais barato", pontos: 3 },
    ],
  },
  {
    campo: "experiencia_rv" as const,
    label: "Sua experiência com renda variável:",
    opcoes: [
      { id: "nunca", label: "Nunca investi em ações ou FIIs", pontos: 0 },
      { id: "pouca", label: "Tenho pouca experiência", pontos: 1 },
      { id: "media", label: "Invisto há alguns anos", pontos: 2 },
      { id: "experiente", label: "Tenho experiência e acompanho o mercado", pontos: 3 },
    ],
  },
  {
    campo: "percentual_risco" as const,
    label: "Quanto do patrimônio você aceita expor a risco?",
    opcoes: [
      { id: "ate_10", label: "Até 10%, com foco em segurança", pontos: 0 },
      { id: "ate_30", label: "Até 30%, equilibrando segurança e crescimento", pontos: 1 },
      { id: "ate_60", label: "Até 60%, buscando maior retorno", pontos: 2 },
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
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Etapa5Data>({
    resolver: zodResolver(Etapa5Schema),
    defaultValues: { reacao_queda: "", experiencia_rv: "", percentual_risco: "" },
  });

  const values = useWatch({ control });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-7">
      {PERGUNTAS.map((pergunta, perguntaIndex) => (
        <div key={pergunta.campo} className="rounded-[1.25rem] border border-blue-brand-950/10 bg-[#f7f3ea]/70 p-5">
          <p className="mb-4 text-sm font-semibold text-blue-brand-950">
            <span className="mr-2 text-primary-700">{String(perguntaIndex + 1).padStart(2, "0")}</span>
            {pergunta.label}
          </p>
          <div className="space-y-2">
            {pergunta.opcoes.map((opcao) => {
              const isSelected = values[pergunta.campo] === opcao.id;
              return (
                <button
                  key={opcao.id}
                  type="button"
                  onClick={() => setValue(pergunta.campo, opcao.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                    isSelected
                      ? "border-blue-brand-950 bg-blue-brand-950 text-white"
                      : "border-blue-brand-950/10 bg-white/65 text-blue-brand-950/60 hover:border-blue-brand-950/30 hover:text-blue-brand-950"
                  }`}
                >
                  {opcao.label}
                </button>
              );
            })}
          </div>
          {errors[pergunta.campo] && <p className="mt-1.5 text-xs text-red-500">{errors[pergunta.campo]?.message}</p>}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-blue-brand-950/15 px-5 py-3 text-sm font-semibold text-blue-brand-950/60 transition-all hover:border-blue-brand-950/35 hover:text-blue-brand-950"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <button
          type="submit"
          disabled={isLoading}
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
      </div>
    </form>
  );
}
