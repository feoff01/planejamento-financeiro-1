"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Etapa4Data, Etapa4Schema, VALOR_MINIMO_OBJETIVO } from "@/schemas/diagnosticoSchemas";

type Props = {
  onNext: (data: Etapa4Data) => void;
  onBack: () => void;
  objetivos: Array<{ id: string; label: string; emoji?: string }>;
};

const inputClass =
  "w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

type DetalheObjetivoValue = Etapa4Data["detalhes_objetivos"][string];

export function Etapa4DetalhesObjetivos({ onNext, onBack, objetivos = [] }: Props) {
  const [objetivoAtualIndex, setObjetivoAtualIndex] = useState(0);

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
    trigger,
    formState: { errors },
  } = useForm<Etapa4Data>({
    resolver: zodResolver(Etapa4Schema),
    defaultValues,
  });

  const detalhesObjetivos = useWatch({ control, name: "detalhes_objetivos" }) || {};
  const objetivoAtual = objetivos[objetivoAtualIndex];
  const isUltimoObjetivo = objetivoAtualIndex === objetivos.length - 1;

  useEffect(() => {
    if (objetivos.length === 0) return;
    setObjetivoAtualIndex((index) => Math.min(index, objetivos.length - 1));
  }, [objetivos.length]);

  if (objetivos.length === 0 || !objetivoAtual) {
    return (
      <div className="py-10 text-center">
        <p className="mb-4 text-blue-brand-950/55">Nenhum objetivo foi selecionado na etapa anterior.</p>
        <button onClick={onBack} className="rounded-full bg-blue-brand-950 px-6 py-2.5 text-sm font-semibold text-white">
          Voltar
        </button>
      </div>
    );
  }

  const pathPrefix = `detalhes_objetivos.${objetivoAtual.id}` as const;
  const currentDetalhes = detalhesObjetivos[objetivoAtual.id];
  const currentNatureza = currentDetalhes?.natureza;
  const currentLiquidez = currentDetalhes?.liquidez;
  const currentPrioridade = currentDetalhes?.prioridade ?? 0;
  const currentAnos = currentDetalhes?.horizonte_anos ?? 0;

  const handleVoltar = () => {
    if (objetivoAtualIndex > 0) {
      setObjetivoAtualIndex((index) => index - 1);
      return;
    }

    onBack();
  };

  const handleProximoObjetivo = async () => {
    const isValid = await trigger(pathPrefix);
    if (!isValid) return;

    setObjetivoAtualIndex((index) => Math.min(index + 1, objetivos.length - 1));
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-700">
          Objetivo {objetivoAtualIndex + 1} de {objetivos.length}
        </p>
        <div className="flex gap-1.5">
          {objetivos.map((obj, index) => (
            <span
              key={obj.id}
              className={`h-1.5 w-8 rounded-full ${index <= objetivoAtualIndex ? "bg-primary-500" : "bg-blue-brand-950/10"}`}
            />
          ))}
        </div>
      </div>

      <motion.div
        key={objetivoAtual.id}
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24 }}
        className="space-y-5 rounded-[1.25rem] bg-[#f7f3ea]/70 p-5"
      >
        <div className="pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-brand-950/40">Plano atual</p>
          <h3 className="font-editorial text-4xl leading-none text-blue-brand-950">{objetivoAtual.label}</h3>
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
                    return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
                  };

                  return (
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={String(VALOR_MINIMO_OBJETIVO)}
                      value={formatDisplay(value)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        onChange(Number(raw));
                      }}
                      className={`${inputClass} pl-10`}
                    />
                  );
                }}
              />
            </div>
            {errors.detalhes_objetivos?.[objetivoAtual.id]?.valor && (
              <p className="mt-1 text-[10px] text-red-500">
                {errors.detalhes_objetivos[objetivoAtual.id]?.valor?.message}
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-brand-950/40">
              Natureza
            </p>
            <div className="flex rounded-2xl bg-white/60 p-1">
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-brand-950/40">Horizonte</p>
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
                  className={`rounded-full py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-all ${
                    currentLiquidez === liq
                      ? "bg-blue-brand-950 text-white"
                      : "bg-white/55 text-blue-brand-950/50 hover:bg-white hover:text-blue-brand-950"
                  }`}
                >
                  {liq === "low" ? "Baixa" : liq === "medium" ? "Media" : "Alta"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleVoltar}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-blue-brand-950/15 px-5 py-3 text-sm font-semibold text-blue-brand-950/60 transition-all hover:border-blue-brand-950/35 hover:text-blue-brand-950"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {isUltimoObjetivo ? (
          <button
            type="submit"
            className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
          >
            Definir risco
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleProximoObjetivo}
            className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
          >
            Proximo objetivo
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </form>
  );
}

