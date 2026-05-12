"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Plus, X } from "lucide-react";
import { Etapa3Schema, Etapa3Data } from "@/schemas/diagnosticoSchemas";

const PREDEFINED_OBJETIVOS = [
  { id: "aposentadoria", label: "Aposentadoria", emoji: "🌅" },
  { id: "renda_passiva", label: "Renda Passiva", emoji: "💰" },
  { id: "crescer_patrimonio", label: "Crescer Patrimônio", emoji: "📈" },
  { id: "independencia_financeira", label: "Independência Financeira", emoji: "🕊️" },
  { id: "comprar_imovel", label: "Comprar Imóvel", emoji: "🏠" },
  { id: "educacao", label: "Educação", emoji: "🎓" },
  { id: "viagem", label: "Viagem", emoji: "✈️" },
  { id: "negocio_proprio", label: "Negócio Próprio", emoji: "🚀" },
];

type Props = { onNext: (data: Etapa3Data) => void; onBack: () => void };

export function Etapa3Form({ onNext, onBack }: Props) {
  const { handleSubmit, watch, setValue, formState: { errors } } = useForm<Etapa3Data>({
    resolver: zodResolver(Etapa3Schema),
    defaultValues: { 
      objetivos_selecionados: []
    },
  });

  const selecionados = watch("objetivos_selecionados") || [];
  const [showOutro, setShowOutro] = useState(false);
  const [outroLabel, setOutroLabel] = useState("");

  const togglePredefined = (obj: { id: string, label: string, emoji: string }) => {
    const exists = selecionados.find(s => s.id === obj.id);
    if (exists) {
      setValue("objetivos_selecionados", selecionados.filter(s => s.id !== obj.id));
    } else {
      setValue("objetivos_selecionados", [...selecionados, obj]);
    }
  };

  const removeObjetivo = (id: string) => {
    setValue("objetivos_selecionados", selecionados.filter(s => s.id !== id));
  };

  const handleAddOutro = () => {
    if (outroLabel.trim() === "") return;
    const customId = `custom_${Date.now()}`;
    setValue("objetivos_selecionados", [
      ...selecionados,
      { id: customId, label: outroLabel.trim(), emoji: "✨" }
    ]);
    setOutroLabel("");
    setShowOutro(false);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-zinc-300 mb-3">Quais são seus objetivos financeiros?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PREDEFINED_OBJETIVOS.map((obj) => {
            const isSelected = selecionados.some(s => s.id === obj.id);
            return (
              <button
                key={obj.id}
                type="button"
                onClick={() => togglePredefined(obj)}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                  isSelected
                    ? "bg-primary-500/15 border-primary-500/40 text-primary-400"
                    : "bg-surface-light border-border text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <span className="text-xl">{obj.emoji}</span>
                <span>{obj.label}</span>
              </button>
            );
          })}
          
          {/* Botão Outro */}
          <button
            type="button"
            onClick={() => setShowOutro(!showOutro)}
            className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-dashed border-zinc-600 bg-transparent text-xs font-medium text-zinc-500 transition-all cursor-pointer hover:border-zinc-400 hover:text-zinc-300"
          >
            <Plus size={20} />
            <span>Outro</span>
          </button>
        </div>
        
        {/* Input para Outro */}
        <AnimatePresence>
          {showOutro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex gap-2 overflow-hidden"
            >
              <input
                type="text"
                value={outroLabel}
                onChange={(e) => setOutroLabel(e.target.value)}
                placeholder="Ex: Comprar um barco..."
                className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-2 text-sm text-white focus:border-primary-500 outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOutro())}
              />
              <button
                type="button"
                onClick={handleAddOutro}
                className="bg-primary-500 text-blue-brand-950 px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-400 transition-colors cursor-pointer"
              >
                Adicionar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {errors.objetivos_selecionados && (
          <p className="mt-1.5 text-xs text-red-400">{errors.objetivos_selecionados.message}</p>
        )}
      </div>

      {/* Seção Inferior: Objetivos Selecionados */}
      <div className="pt-4 border-t border-border/30">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Seu Carrinho de Sonhos</h3>
        
        {selecionados.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border/50 rounded-2xl bg-surface-light/30">
            <p className="text-xs text-zinc-500">Nenhum objetivo selecionado ainda.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selecionados.map(obj => (
                <motion.div
                  key={obj.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2 bg-blue-brand-800 border border-zinc-700 pl-3 pr-1 py-1.5 rounded-full"
                >
                  <span className="text-sm">{obj.emoji}</span>
                  <span className="text-xs font-medium text-white">{obj.label}</span>
                  <button
                    type="button"
                    onClick={() => removeObjetivo(obj.id)}
                    className="p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-full text-sm font-medium border border-border text-zinc-400 hover:border-zinc-500 transition-all cursor-pointer flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <button type="submit" className="flex-[2] py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-primary-500 to-primary-600 text-blue-brand-950 flex items-center justify-center gap-2 glow-effect cursor-pointer hover:from-primary-600 hover:to-gold-500 transition-all">
          Continuar para Detalhes <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
