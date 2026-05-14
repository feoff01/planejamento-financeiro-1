"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Etapa4Data, Etapa4Schema } from "@/schemas/diagnosticoSchemas";

type Props = {
  onNext: (data: Etapa4Data) => void;
  onBack: () => void;
  objetivos: Array<{ id: string; label: string; emoji?: string }>;
};

const inputClass =
  "w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

type DetalheObjetivoValue = Etapa4Data["detalhes_objetivos"][string];

export function Etapa4DetalhesObjetivos({ onNext, onBack, objetivos = [] }: Props) {
  const defaultValues: Etapa4Data = {
    detalhes_objetivos: objetivos.reduce<Record<string, DetalheObjetivoValue>>((acc, obj) => {
      acc[obj.id] = {
        valor: 0,
        horizonte_anos: 5,
        natureza: "want",
        liquidez: "medium",
        prioridade: 3,
      };
      return acc;
    }, {}),
  };

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Etapa4Data>({
    resolver: zodResolver(Etapa4Schema),
    defaultValues,
  });

  const detalhesObjetivos = useWatch({ control, name: "detalhes_objetivos" }) || {};

  if (objetivos.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="mb-4 text-blue-brand-950/55">Nenhum objetivo foi selecionado na etapa anterior.</p>
        <button onClick={onBack} className="rounded-full bg-blue-brand-950 px-6 py-2.5 text-sm font-semibold text-white">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8">
      <div className="space-y-5">
        {objetivos.map((obj, index) => {
          const pathPrefix = `detalhes_objetivos.${obj.id}` as const;
          const currentDetalhes = detalhesObjetivos[obj.id];
          const currentNatureza = currentDetalhes?.natureza;
          const currentLiquidez = currentDetalhes?.liquidez;
          const currentPrioridade = currentDetalhes?.prioridade ?? 0;
          const currentAnos = currentDetalhes?.horizonte_anos ?? 0;

          return (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="space-y-5 rounded-[1.25rem] border border-blue-brand-950/10 bg-[#f7f3ea]/70 p-5"
            >
              <div className="border-b border-blue-brand-950/10 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-700">
                  Objetivo {index + 1}
                </p>
                <h3 className="font-editorial text-4xl leading-none text-blue-brand-950">{obj.label}</h3>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-brand-950/40">
                    Valor alvo
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-brand-950/40">
                      R$
                    </span>
                    <Controller
                      name={`${pathPrefix}.valor`}
                      control={control}
                      render={({ field: { onChange, value } }) => {
                        const formatDisplay = (val: number | undefined) => {
                          const v = val || 0;
                          return v.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                        };

                        return (
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0,00"
                            value={formatDisplay(value)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              onChange(Number(raw) / 100);
                            }}
                            className={`${inputClass} pl-10`}
                          />
                        );
                      }}
                    />
                  </div>
                  {errors.detalhes_objetivos?.[obj.id]?.valor && (
                    <p className="mt-1 text-[10px] text-red-500">
                      {errors.detalhes_objetivos[obj.id]?.valor?.message}
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-brand-950/40">
                    Natureza
                  </p>
                  <div className="flex rounded-2xl border border-blue-brand-950/10 bg-white/60 p-1">
                    <button
                      type="button"
                      onClick={() => setValue(`${pathPrefix}.natureza`, "need")}
                      className={`flex-1 rounded-full py-2 text-xs font-semibold transition-all ${
                        currentNatureza === "need" ? "bg-blue-brand-950 text-white" : "text-blue-brand-950/50"
                      }`}
                    >
                      Necessidade
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue(`${pathPrefix}.natureza`, "want")}
                      className={`flex-1 rounded-full py-2 text-xs font-semibold transition-all ${
                        currentNatureza === "want" ? "bg-blue-brand-950 text-white" : "text-blue-brand-950/50"
                      }`}
                    >
                      Desejo
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-brand-950/40">
                    Horizonte
                  </p>
                  <span className="text-sm font-bold text-primary-700">{currentAnos} anos</span>
                </div>
                <Controller
                  name={`${pathPrefix}.horizonte_anos`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-blue-brand-950/10 accent-primary-500"
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-brand-950/40">
                    Prioridade
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setValue(`${pathPrefix}.prioridade`, star)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`Prioridade ${star}`}
                      >
                        <Star
                          size={21}
                          className={star <= currentPrioridade ? "fill-primary-500 text-primary-500" : "text-blue-brand-950/20"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-brand-950/40">
                    Liquidez
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {["low", "medium", "high"].map((liq) => (
                      <button
                        key={liq}
                        type="button"
                        onClick={() => setValue(`${pathPrefix}.liquidez`, liq as DetalheObjetivoValue["liquidez"])}
                        className={`rounded-full border py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-all ${
                          currentLiquidez === liq
                            ? "border-blue-brand-950 bg-blue-brand-950 text-white"
                            : "border-blue-brand-950/10 bg-white/55 text-blue-brand-950/50 hover:border-blue-brand-950/30"
                        }`}
                      >
                        {liq === "low" ? "Baixa" : liq === "medium" ? "Média" : "Alta"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-3 border-t border-blue-brand-950/10 pt-5">
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
          className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
        >
          Definir risco
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
