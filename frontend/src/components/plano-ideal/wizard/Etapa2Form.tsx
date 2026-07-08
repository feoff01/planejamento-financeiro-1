"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sprout, TrendingUp } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Etapa2Data, Etapa2Schema } from "@/schemas/diagnosticoSchemas";

const OPCOES_INVESTE = [
  {
    id: "nao" as const,
    icon: Sprout,
    titulo: "Ainda não invisto",
    desc: "Guardo (ou quero guardar), mas nunca investi de verdade.",
  },
  {
    id: "sim" as const,
    icon: TrendingUp,
    titulo: "Já invisto",
    desc: "Tenho dinheiro aplicado em corretora, banco ou fundos.",
  },
];

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

  const investeAtualmente = useWatch({ control, name: "investe_atualmente" });

  const selecionarInveste = (id: "sim" | "nao") => {
    setValue("investe_atualmente", id, { shouldValidate: true });
    // Quem ainda não investe não escolhe tipos de ativos — só informa o que tem guardado.
    // Quem já investe informa quanto/onde na próxima etapa (evita pergunta duplicada):
    // aqui o patrimônio fica 0 e será preenchido com o total investido informado lá.
    setValue("tipos_ativos", []);
    if (id === "sim") setValue("patrimonio_total", 0, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* 1. Pergunta divisora — vem primeiro e define o resto da etapa */}
      <div>
        <p className="mb-1 text-sm font-semibold text-blue-brand-950/75">Você investe atualmente?</p>
        <p className="mb-3 text-xs leading-relaxed text-blue-brand-950/45">
          Essa resposta define o próximo passo do seu plano — cada caminho tem uma rota diferente.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {OPCOES_INVESTE.map((opcao) => {
            const Icon = opcao.icon;
            const selecionado = investeAtualmente === opcao.id;

            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => selecionarInveste(opcao.id)}
                aria-pressed={selecionado}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  selecionado
                    ? "border-primary-500 bg-primary-400/15 ring-4 ring-primary-500/10"
                    : "border-blue-brand-950/10 bg-white/55 hover:border-blue-brand-950/30"
                }`}
              >
                <Icon
                  size={20}
                  className={selecionado ? "text-primary-600" : "text-blue-brand-950/40"}
                />
                <p className="mt-2.5 text-sm font-bold text-blue-brand-950">{opcao.titulo}</p>
                <p className="mt-1 text-xs leading-relaxed text-blue-brand-950/55">{opcao.desc}</p>
              </button>
            );
          })}
        </div>
        {errors.investe_atualmente && (
          <p className="mt-1.5 text-xs text-red-500">{errors.investe_atualmente.message}</p>
        )}
      </div>

      {/* 2. O restante da etapa se adapta à resposta */}
      <AnimatePresence mode="wait">
        {investeAtualmente === "nao" && (
          <motion.div
            key="nao"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="patrimonio_total"
                className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75"
              >
                Você tem algo guardado hoje? Quanto?
              </label>
              <p className="mb-2 text-xs leading-relaxed text-blue-brand-950/45">
                Poupança, conta corrente, dinheiro parado… tudo conta. Se não tiver nada, deixe 0.
              </p>
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
              {errors.patrimonio_total && (
                <p className="mt-1.5 text-xs text-red-500">{errors.patrimonio_total.message}</p>
              )}
            </div>
          </motion.div>
        )}

        {investeAtualmente === "sim" && (
          <motion.p
            key="sim"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-primary-500/30 bg-primary-400/10 p-4 text-xs leading-relaxed text-blue-brand-950/70 sm:text-sm"
          >
            Perfeito — na próxima etapa você conta <strong>quanto tem investido e em quê</strong>, tudo
            de uma vez só.
          </motion.p>
        )}
      </AnimatePresence>

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
