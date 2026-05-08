"use client";

import { useEffect, useRef } from "react";
import { useForm, Controller, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Etapa1Schema, Etapa1Data } from "@/schemas/diagnosticoSchemas";

type Props = { onNext: (data: Etapa1Data) => void };

const formatToBRL = (value: number | undefined | null | "") => {
  if (value === undefined || value === null || value === "" || isNaN(value)) return "";
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
      <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">R$</span>
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
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-light border border-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
              placeholder="0"
            />
          )}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error.message}</p>}
    </div>
  );
}

export function Etapa1Form({ onNext }: Props) {
  const hasUserAdjustedAporte = useRef(false);

  const { handleSubmit, watch, control, setValue, formState: { errors } } = useForm<Etapa1Data>({
    resolver: zodResolver(Etapa1Schema),
    defaultValues: {
      idade: undefined,
      renda_mensal: undefined,
      gastos_mensais: undefined,
      aporte_mensal: 0,
    }
  });

  const renda = watch("renda_mensal") || 0;
  const gastos = watch("gastos_mensais") || 0;
  const aporte = watch("aporte_mensal") || 0;
  const sobra = renda - gastos;
  
  // Porcentagem calculada para o slider
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

  const onSubmit = (data: Etapa1Data) => onNext(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.7fr_1.65fr_1.65fr]">
        <div>
          <label htmlFor="idade" className="block text-sm font-medium text-zinc-300 mb-1.5">Sua idade</label>
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
                className="w-full px-4 py-3 rounded-xl bg-surface-light border border-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
                placeholder="0"
              />
            )}
          />
          {errors.idade && <p className="mt-1.5 text-xs text-red-400">{errors.idade.message}</p>}
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
          label="Gastos mensais totais (incluindo dívidas)"
          name="gastos_mensais"
          control={control}
          error={errors.gastos_mensais}
        />
      </div>

      {/* Sobra mensal e Slider de Investimento */}
      {renda > 0 && gastos > 0 && sobra > 0 ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-6 p-5 rounded-2xl bg-primary-500/5 border border-primary-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Capacidade de Investimento</p>
              <h3 className="text-xl font-bold text-white">R$ {sobra.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Valor do Aporte</p>
              <h3 className="text-xl font-bold text-primary-400">R$ {aporte.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-zinc-300">
                Quanto desse valor você quer investir?
              </label>
              <span className="text-lg font-bold text-primary-500">{porcentagemInvestimento}%</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={porcentagemInvestimento}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            
            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <span>Mínimo (0%)</span>
              <span>Tudo (100%)</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed italic">
            * O restante (R$ {(sobra - aporte).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) ficará reservado para seu lazer ou reserva de contingência.
          </p>
        </motion.div>
      ) : renda > 0 && gastos > 0 && sobra <= 0 && (
        <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-medium text-red-400">
          ⚠ Seus gastos superam sua renda. Para começar a investir com a Synapta, você precisará equilibrar suas contas primeiro.
        </div>
      )}

      <button
        type="submit"
        className="w-full py-3.5 rounded-full font-semibold text-sm bg-gradient-to-r from-primary-500 to-primary-600 text-black flex items-center justify-center gap-2 glow-effect cursor-pointer hover:from-primary-600 hover:to-orange-500 transition-all"
      >
        Continuar <ArrowRight size={16} />
      </button>
    </form>
  );
}
