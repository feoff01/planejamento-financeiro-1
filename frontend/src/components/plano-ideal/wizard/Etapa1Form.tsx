"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Control, Controller, useForm, useWatch } from "react-hook-form";

import { Etapa1Data, Etapa1Schema } from "@/schemas/diagnosticoSchemas";

type Props = { onNext: (data: Etapa1Data) => void };

const inputClass =
  "w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

const formatToBRL = (value: number | undefined | null | "") => {
  if (value === undefined || value === null || value === "" || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("pt-BR").format(value);
};

const parseBRL = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue === "" ? undefined : Number(cleanValue);
};

type CurrencyFieldName = "renda_mensal" | "gastos_mensais" | "aporte_mensal";

function CurrencyInput({
  id,
  label,
  control,
  name,
  error,
}: {
  id: string;
  label: string;
  control: Control<Etapa1Data>;
  name: CurrencyFieldName;
  error?: { message?: string };
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-brand-950/40">
          R$
        </span>
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, value, ref } }) => (
            <input
              id={id}
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
      {error && <p className="mt-1.5 text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

export function Etapa1Form({ onNext }: Props) {
  const hasUserAdjustedAporte = useRef(false);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Etapa1Data>({
    resolver: zodResolver(Etapa1Schema),
    defaultValues: {
      idade: undefined,
      renda_mensal: undefined,
      gastos_mensais: undefined,
      aporte_mensal: 0,
    },
  });

  const renda = useWatch({ control, name: "renda_mensal" }) || 0;
  const gastos = useWatch({ control, name: "gastos_mensais" }) || 0;
  const aporte = useWatch({ control, name: "aporte_mensal" }) || 0;
  const sobra = renda - gastos;
  const porcentagemInvestimento = sobra > 0 ? Math.min(Math.round((aporte / sobra) * 100), 100) : 0;

  useEffect(() => {
    if (sobra <= 0 || hasUserAdjustedAporte.current || aporte === sobra) return;

    setValue("aporte_mensal", sobra, { shouldValidate: true });
  }, [aporte, setValue, sobra]);

  const handleSliderChange = (pct: number) => {
    hasUserAdjustedAporte.current = true;
    const valor = Math.round(sobra * (pct / 100));
    setValue("aporte_mensal", valor);
  };

  const handleAporteInputChange = (value: string) => {
    hasUserAdjustedAporte.current = true;
    const parsedValue = parseBRL(value) ?? 0;
    const valor = Math.min(parsedValue, sobra);
    setValue("aporte_mensal", valor, { shouldValidate: true });
  };

  const onSubmit = (data: Etapa1Data) => onNext(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.7fr_1.65fr_1.65fr]">
        <div>
          <label htmlFor="idade" className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75">
            Sua idade
          </label>
          <Controller
            name="idade"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <input
                id="idade"
                ref={ref}
                type="number"
                inputMode="numeric"
                value={value || ""}
                onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                className={inputClass}
                placeholder="0"
              />
            )}
          />
          {errors.idade && <p className="mt-1.5 text-xs text-red-500">{errors.idade.message}</p>}
        </div>

        <CurrencyInput
          id="renda_mensal"
          label="Renda mensal líquida"
          name="renda_mensal"
          control={control}
          error={errors.renda_mensal}
        />
        <CurrencyInput
          id="gastos_mensais"
          label="Gastos mensais totais"
          name="gastos_mensais"
          control={control}
          error={errors.gastos_mensais}
        />
      </div>

      {renda > 0 && gastos > 0 && sobra > 0 ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_180px] sm:items-end">
            <div>
              <label htmlFor="aporte_mensal_custom" className="text-sm font-semibold text-blue-brand-950/72">
                Quanto da sua sobra mensal voce quer investir?
              </label>
              <p className="mt-1 text-xs font-semibold text-blue-brand-950/45">{porcentagemInvestimento}% da sobra mensal</p>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-brand-950/40">
                R$
              </span>
              <input
                id="aporte_mensal_custom"
                type="text"
                inputMode="numeric"
                value={formatToBRL(aporte)}
                onChange={(e) => handleAporteInputChange(e.target.value)}
                className={`${inputClass} pl-10 text-right font-semibold text-primary-700`}
                placeholder="0"
              />
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={porcentagemInvestimento}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-brand-950/10 accent-primary-500"
          />

          <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-blue-brand-950/35">
            <span>0%</span>
            <span>100%</span>
          </div>
        </motion.div>
      ) : (
        renda > 0 &&
        gastos > 0 &&
        sobra <= 0 && (
          <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            Seus gastos superam sua renda. Para investir com consistência, primeiro precisamos equilibrar esse fluxo.
          </div>
        )
      )}

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
      >
        Continuar
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

