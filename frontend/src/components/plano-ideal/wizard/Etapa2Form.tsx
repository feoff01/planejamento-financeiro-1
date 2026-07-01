"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Etapa2Data, Etapa2Schema } from "@/schemas/diagnosticoSchemas";

const TIPOS_ATIVOS = ["Poupança", "Renda Fixa", "Ações", "Fundos", "Imóveis", "Cripto", "Previdência"];

const inputClass =
  "w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

const formatToBRL = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("pt-BR").format(value);
};

const parseBRL = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue === "" ? undefined : Number(cleanValue);
};

type Props = { onNext: (data: Etapa2Data) => void; onBack: () => void; gastosMensais: number };

export function Etapa2Form({ onNext, onBack }: Props) {
  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<Etapa2Data>({
    resolver: zodResolver(Etapa2Schema),
    defaultValues: { tipos_ativos: [] },
  });

  const tiposAtivos = useWatch({ control, name: "tipos_ativos" }) || [];

  const toggleAtivo = (value: string) => {
    const updated = tiposAtivos.includes(value)
      ? tiposAtivos.filter((v) => v !== value)
      : [...tiposAtivos, value];
    setValue("tipos_ativos", updated);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <label htmlFor="patrimonio_total" className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75">
          Total guardado ou investido hoje
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-brand-950/40">
            R$
          </span>
          <Controller
            name="patrimonio_total"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <input
                id="patrimonio_total"
                ref={ref}
                type="text"
                inputMode="numeric"
                value={formatToBRL(value)}
                onChange={(e) => onChange(parseBRL(e.target.value))}
                className={`${inputClass} pl-10`}
                placeholder="0"
              />
            )}
          />
        </div>
        {errors.patrimonio_total && <p className="mt-1.5 text-xs text-red-500">{errors.patrimonio_total.message}</p>}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-blue-brand-950/75">
          Tipos de ativos que você já possui <span className="font-normal text-blue-brand-950/40">(opcional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {TIPOS_ATIVOS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleAtivo(item)}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
                tiposAtivos.includes(item)
                  ? "border-blue-brand-950 bg-blue-brand-950 text-white"
                  : "border-blue-brand-950/10 bg-white/55 text-blue-brand-950/60 hover:border-blue-brand-950/30 hover:text-blue-brand-950"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

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
          className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
        >
          Continuar
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

