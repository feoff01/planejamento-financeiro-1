"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Info } from "lucide-react";
import { Etapa2Schema, Etapa2Data } from "@/schemas/diagnosticoSchemas";

const TIPOS_ATIVOS = ["Poupança", "Renda Fixa", "Ações", "Fundos", "Imóveis", "Cripto", "Previdência"];

const formatToBRL = (value: any) => {
  if (value === undefined || value === null || value === "" || isNaN(value)) return "";
  return new Intl.NumberFormat("pt-BR").format(value);
};

const parseBRL = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue === "" ? undefined : Number(cleanValue);
};

type Props = { onNext: (data: Etapa2Data) => void; onBack: () => void; gastosMensais: number };

export function Etapa2Form({ onNext, onBack, gastosMensais }: Props) {
  const { handleSubmit, watch, setValue, control, formState: { errors } } = useForm<Etapa2Data>({
    resolver: zodResolver(Etapa2Schema),
    defaultValues: { tipos_ativos: [], valor_reserva: 0, meses_reserva: 0 },
  });

  const tiposAtivos = watch("tipos_ativos") || [];
  const valorReserva = watch("valor_reserva") || 0;

  // Cálculo automático dos meses de reserva baseado na renda da Etapa 1
  useEffect(() => {
    if (gastosMensais > 0) {
      const meses = valorReserva / gastosMensais;
      setValue("meses_reserva", Number(meses.toFixed(1)));
    }
  }, [valorReserva, gastosMensais, setValue]);

  const mesesCalculados = watch("meses_reserva");

  const toggleAtivo = (value: string) => {
    const updated = tiposAtivos.includes(value)
      ? tiposAtivos.filter((v) => v !== value)
      : [...tiposAtivos, value];
    setValue("tipos_ativos", updated);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Patrimônio */}
      <div>
        <label htmlFor="patrimonio_total" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Total guardado ou investido hoje (incluindo reserva)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">R$</span>
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-light border border-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
                placeholder="0"
              />
            )}
          />
        </div>
        {errors.patrimonio_total && <p className="mt-1.5 text-xs text-red-400">{errors.patrimonio_total.message}</p>}
      </div>

      {/* Reserva de emergência */}
      <div>
        <label htmlFor="valor_reserva" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Deste valor, quanto é sua reserva de emergência?
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">R$</span>
          <Controller
            name="valor_reserva"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <input
                id="valor_reserva"
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
        
        {/* Feedback do cálculo em tempo real */}
        {valorReserva > 0 && gastosMensais > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500/5 border border-primary-500/10"
          >
            <Info size={14} className="text-primary-400" />
            <p className="text-xs text-zinc-400">
              Isso equivale a aproximadamente <span className="text-primary-400 font-bold">{mesesCalculados} meses</span> das suas despesas.
            </p>
          </motion.div>
        )}
        
        {errors.valor_reserva && <p className="mt-1.5 text-xs text-red-400">{errors.valor_reserva.message}</p>}
      </div>

      {/* Tipos de ativos */}
      <div>
        <p className="text-sm font-medium text-zinc-300 mb-2">Tipos de ativos que você já possui <span className="text-zinc-600">(opcional)</span></p>
        <div className="flex flex-wrap gap-2">
          {TIPOS_ATIVOS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleAtivo(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                tiposAtivos.includes(item)
                  ? "bg-primary-500/20 border-primary-500/40 text-primary-400"
                  : "bg-surface-light border-border text-zinc-500 hover:border-zinc-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-full text-sm font-medium border border-border text-zinc-400 hover:border-zinc-500 transition-all cursor-pointer flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <button type="submit" className="flex-[2] py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-primary-500 to-primary-600 text-blue-brand-950 flex items-center justify-center gap-2 glow-effect cursor-pointer hover:from-primary-600 hover:to-gold-500 transition-all">
          Continuar <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
