"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Target, Star } from "lucide-react";
import { Etapa4Schema, Etapa4Data } from "@/schemas/diagnosticoSchemas";

type Props = { 
  onNext: (data: Etapa4Data) => void; 
  onBack: () => void;
  objetivos: Array<{ id: string, label: string, emoji?: string }>;
};

export function Etapa4DetalhesObjetivos({ onNext, onBack, objetivos = [] }: Props) {
  // Inicializa o formulário com valores padrão para cada objetivo
  const defaultValues = {
    detalhes_objetivos: objetivos.reduce((acc, obj) => {
      acc[obj.id] = {
        valor: 0,
        horizonte_anos: 5,
        natureza: "want", // Padrão Desejo
        liquidez: "medium",
        prioridade: 3, // Padrão intermediário
      };
      return acc;
    }, {} as Record<string, any>)
  };

  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm<Etapa4Data>({
    resolver: zodResolver(Etapa4Schema),
    defaultValues,
  });

  if (objetivos.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-zinc-400 mb-4">Nenhum objetivo foi selecionado na etapa anterior.</p>
        <button onClick={onBack} className="bg-surface-light px-6 py-2 rounded-xl text-white">Voltar</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8">
      <div className="space-y-6 pr-2">
        {objetivos.map((obj, index) => {
          const pathPrefix = `detalhes_objetivos.${obj.id}` as const;
          const currentNatureza = watch(`${pathPrefix}.natureza`);
          const currentLiquidez = watch(`${pathPrefix}.liquidez`);
          const currentPrioridade = watch(`${pathPrefix}.prioridade`);
          const currentAnos = watch(`${pathPrefix}.horizonte_anos`);

          return (
            <motion.div 
              key={obj.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface-light/40 border border-border/50 rounded-2xl p-5 space-y-5"
            >
              {/* Header do Card */}
              <div className="flex items-center gap-3 border-b border-border/30 pb-3">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">{obj.label}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Valor */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Qual o valor alvo?</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">R$</span>
                    <Controller
                      name={`${pathPrefix}.valor` as any}
                      control={control}
                      render={({ field: { onChange, value } }) => {
                        const formatDisplay = (val: any) => {
                          const v = val || 0;
                          return (v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
                            className="w-full bg-blue-brand-900 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-primary-500 outline-none transition-all"
                          />
                        );
                      }}
                    />
                  </div>
                  {errors.detalhes_objetivos?.[obj.id]?.valor && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.detalhes_objetivos[obj.id]?.valor?.message}</p>
                  )}
                </div>

                {/* Natureza */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Natureza do Sonho</p>
                  <div className="flex bg-blue-brand-900 p-1 rounded-xl border border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setValue(`${pathPrefix}.natureza` as any, "need")}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${currentNatureza === "need" ? "bg-primary-500 text-blue-brand-950 shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                      Necessidade 🛡️
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue(`${pathPrefix}.natureza` as any, "want")}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${currentNatureza === "want" ? "bg-primary-500 text-blue-brand-950 shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                      Desejo 🚀
                    </button>
                  </div>
                </div>
              </div>

              {/* Tempo (Horizonte) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Em quanto tempo?</p>
                  <span className="text-xs font-black text-primary-400">{currentAnos} anos</span>
                </div>
                <Controller
                  name={`${pathPrefix}.horizonte_anos` as any}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full h-1.5 bg-blue-brand-800 rounded-full appearance-none cursor-pointer accent-gold-500"
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Prioridade */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    Nível de Prioridade <span className="text-[9px] text-zinc-600 normal-case">(1 = Baixa, 5 = Máxima)</span>
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setValue(`${pathPrefix}.prioridade` as any, star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star 
                          size={20} 
                          className={star <= currentPrioridade ? "fill-gold-500 text-gold-500" : "text-zinc-700"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Liquidez */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Necessidade de Acesso ao Dinheiro</p>
                  <div className="grid grid-cols-3 gap-1">
                    {["low", "medium", "high"].map((liq) => (
                      <button
                        key={liq}
                        type="button"
                        onClick={() => setValue(`${pathPrefix}.liquidez` as any, liq)}
                        className={`py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all ${
                          currentLiquidez === liq
                            ? "bg-gold-500/10 border-gold-500 text-gold-500"
                            : "bg-blue-brand-900 border-blue-brand-800 text-zinc-500 hover:border-zinc-600"
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

      <div className="flex gap-3 pt-4 border-t border-border/30">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-full text-sm font-medium border border-border text-zinc-400 hover:border-zinc-500 transition-all cursor-pointer flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <button type="submit" className="flex-[2] py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-primary-500 to-primary-600 text-blue-brand-950 flex items-center justify-center gap-2 glow-effect cursor-pointer hover:from-primary-600 hover:to-gold-500 transition-all">
          Definir Risco <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
