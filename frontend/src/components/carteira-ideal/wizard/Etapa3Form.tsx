"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Etapa3Data, Etapa3Schema } from "@/schemas/diagnosticoSchemas";

const PREDEFINED_OBJETIVOS: Array<Etapa3Data["objetivos_selecionados"][number]> = [
  { id: "aposentadoria", label: "Aposentadoria" },
  { id: "renda_passiva", label: "Renda passiva" },
  { id: "crescer_patrimonio", label: "Crescer patrimônio" },
  { id: "independencia_financeira", label: "Independência financeira" },
  { id: "comprar_imovel", label: "Comprar imóvel" },
  { id: "educacao", label: "Educação" },
  { id: "viagem", label: "Viagem" },
  { id: "negocio_proprio", label: "Negócio próprio" },
];

type Props = { onNext: (data: Etapa3Data) => void; onBack: () => void };

export function Etapa3Form({ onNext, onBack }: Props) {
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Etapa3Data>({
    resolver: zodResolver(Etapa3Schema),
    defaultValues: {
      objetivos_selecionados: [],
    },
  });

  const selecionados = useWatch({ control, name: "objetivos_selecionados" }) || [];
  const [showOutro, setShowOutro] = useState(false);
  const [outroLabel, setOutroLabel] = useState("");

  const togglePredefined = (obj: Etapa3Data["objetivos_selecionados"][number]) => {
    const exists = selecionados.find((s) => s.id === obj.id);
    if (exists) {
      setValue(
        "objetivos_selecionados",
        selecionados.filter((s) => s.id !== obj.id)
      );
    } else {
      setValue("objetivos_selecionados", [...selecionados, obj]);
    }
  };

  const removeObjetivo = (id: string) => {
    setValue(
      "objetivos_selecionados",
      selecionados.filter((s) => s.id !== id)
    );
  };

  const handleAddOutro = () => {
    if (outroLabel.trim() === "") return;
    const customId = `custom_${Date.now()}`;
    setValue("objetivos_selecionados", [...selecionados, { id: customId, label: outroLabel.trim() }]);
    setOutroLabel("");
    setShowOutro(false);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold text-blue-brand-950/75">Quais objetivos devem entrar na rota?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREDEFINED_OBJETIVOS.map((obj, index) => {
            const isSelected = selecionados.some((s) => s.id === obj.id);
            return (
              <button
                key={obj.id}
                type="button"
                onClick={() => togglePredefined(obj)}
                className={`min-h-24 rounded-[1rem] border px-3 py-3 text-left text-xs font-semibold transition-all ${
                  isSelected
                    ? "border-blue-brand-950 bg-blue-brand-950 text-white"
                    : "border-blue-brand-950/10 bg-white/55 text-blue-brand-950/60 hover:border-blue-brand-950/30 hover:text-blue-brand-950"
                }`}
              >
                <span className={isSelected ? "text-primary-400" : "text-primary-700"}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-3 block leading-snug">{obj.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowOutro(!showOutro)}
            className="flex min-h-24 flex-col justify-between rounded-[1rem] border border-dashed border-blue-brand-950/20 bg-transparent px-3 py-3 text-left text-xs font-semibold text-blue-brand-950/50 transition-all hover:border-blue-brand-950/35 hover:text-blue-brand-950"
          >
            <Plus size={18} />
            <span>Outro objetivo</span>
          </button>
        </div>

        <AnimatePresence>
          {showOutro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex gap-2 overflow-hidden"
            >
              <input
                type="text"
                value={outroLabel}
                onChange={(e) => setOutroLabel(e.target.value)}
                placeholder="Ex: Comprar um barco..."
                className="flex-1 rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-2.5 text-sm text-blue-brand-950 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddOutro();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddOutro}
                className="rounded-2xl bg-blue-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900"
              >
                Adicionar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {errors.objetivos_selecionados && (
          <p className="mt-1.5 text-xs text-red-500">{errors.objetivos_selecionados.message}</p>
        )}
      </div>

      <div className="border-t border-blue-brand-950/10 pt-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-brand-950/40">
          Objetivos selecionados
        </h3>

        {selecionados.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-blue-brand-950/16 bg-[#f7f3ea]/65 py-6 text-center">
            <p className="text-xs text-blue-brand-950/40">Nenhum objetivo selecionado ainda.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selecionados.map((obj) => (
                <motion.div
                  key={obj.id}
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  className="flex items-center gap-2 rounded-full border border-blue-brand-950/10 bg-white/70 py-1.5 pl-3 pr-1"
                >
                  <span className="text-xs font-semibold text-blue-brand-950">{obj.label}</span>
                  <button
                    type="button"
                    onClick={() => removeObjetivo(obj.id)}
                    className="rounded-full p-1 text-blue-brand-950/40 transition-colors hover:bg-blue-brand-950/10 hover:text-blue-brand-950"
                    aria-label={`Remover ${obj.label}`}
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
