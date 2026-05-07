"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Etapa5Schema, Etapa5Data } from "@/schemas/diagnosticoSchemas";

const PERGUNTAS = [
  {
    campo: "reacao_queda" as const,
    label: "Se sua carteira cair 20% em um mês, você:",
    opcoes: [
      { id: "vender_tudo", label: "Vendo tudo para parar o sangramento", pontos: 0 },
      { id: "espera_preocupado", label: "Espero preocupado, mas não faço nada", pontos: 1 },
      { id: "mantenho_tranquilo", label: "Mantenho tranquilo, quedas fazem parte", pontos: 2 },
      { id: "compra_mais", label: "Aproveito para comprar mais barato", pontos: 3 },
    ],
  },
  {
    campo: "experiencia_rv" as const,
    label: "Sua experiência com renda variável (ações, FIIs):",
    opcoes: [
      { id: "nunca", label: "Nunca investi em renda variável", pontos: 0 },
      { id: "pouca", label: "Tenho pouca experiência, investi pouquíssimo", pontos: 1 },
      { id: "media", label: "Tenho experiência razoável há alguns anos", pontos: 2 },
      { id: "experiente", label: "Sou experiente e acompanho o mercado", pontos: 3 },
    ],
  },
  {
    campo: "percentual_risco" as const,
    label: "Qual % do seu patrimônio você aceita colocar em risco?",
    opcoes: [
      { id: "ate_10", label: "Até 10% — prefiro segurança total", pontos: 0 },
      { id: "ate_30", label: "Até 30% — equilíbrio entre segurança e crescimento", pontos: 1 },
      { id: "ate_60", label: "Até 60% — aceito risco por maior retorno", pontos: 2 },
      { id: "mais_60", label: "Mais de 60% — foco total em crescimento", pontos: 3 },
    ],
  },
];

type Props = {
  onNext: (data: Etapa5Data) => void;
  onBack: () => void;
  isLoading?: boolean;
};

export function Etapa5Form({ onNext, onBack, isLoading }: Props) {
  const { handleSubmit, watch, setValue, formState: { errors } } = useForm<Etapa5Data>({
    resolver: zodResolver(Etapa5Schema),
    defaultValues: { reacao_queda: "", experiencia_rv: "", percentual_risco: "" },
  });

  const values = watch();

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-7">
      {PERGUNTAS.map((pergunta) => (
        <div key={pergunta.campo}>
          <p className="text-sm font-medium text-zinc-300 mb-3">{pergunta.label}</p>
          <div className="space-y-2">
            {pergunta.opcoes.map((opcao) => {
              const isSelected = values[pergunta.campo] === opcao.id;
              return (
                <button
                  key={opcao.id}
                  type="button"
                  onClick={() => setValue(pergunta.campo, opcao.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary-500/15 border-primary-500/40 text-primary-300 font-medium"
                      : "bg-surface-light border-border text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {opcao.label}
                </button>
              );
            })}
          </div>
          {errors[pergunta.campo] && (
            <p className="mt-1.5 text-xs text-red-400">{errors[pergunta.campo]?.message}</p>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-full text-sm font-medium border border-border text-zinc-400 hover:border-zinc-500 transition-all cursor-pointer flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <button type="submit" className="flex-[2] py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-primary-500 to-primary-600 text-black flex items-center justify-center gap-2 glow-effect cursor-pointer hover:from-primary-600 hover:to-orange-500 transition-all">
          Continuar <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
