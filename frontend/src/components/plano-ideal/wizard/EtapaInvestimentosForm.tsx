"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  EtapaInvestimentosData,
  EtapaInvestimentosSchema,
} from "@/schemas/diagnosticoSchemas";

const INSTITUICOES = [
  "XP",
  "BTG Pactual",
  "Rico",
  "NuInvest",
  "Inter",
  "Banco tradicional",
  "Corretora internacional",
  "Outra",
];

const CLASSES = [
  "Renda Fixa",
  "Ações BR",
  "FIIs",
  "Fundos",
  "ETFs / Exterior",
  "Cripto",
  "Previdência",
];

const ESTRATEGIAS = [
  {
    id: "sem_estrategia",
    label: "Não tenho estratégia definida",
    desc: "Invisto conforme aparece oportunidade ou sobra.",
  },
  {
    id: "renda_passiva",
    label: "Foco em renda passiva",
    desc: "Dividendos, FIIs e fluxo de caixa recorrente.",
  },
  {
    id: "longo_prazo",
    label: "Crescimento de longo prazo",
    desc: "Aportes constantes pensando em anos à frente.",
  },
  {
    id: "recomendacoes",
    label: "Sigo recomendações de terceiros",
    desc: "Casas de análise, influenciadores ou assessores.",
  },
  {
    id: "curto_prazo",
    label: "Trade / curto prazo",
    desc: "Compro e vendo com frequência buscando ganhos rápidos.",
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

type Props = {
  onNext: (data: EtapaInvestimentosData) => void;
  onBack: () => void;
};

export function EtapaInvestimentosForm({ onNext, onBack }: Props) {
  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EtapaInvestimentosData>({
    resolver: zodResolver(EtapaInvestimentosSchema),
    defaultValues: { onde_investe: [], classes_investidas: [], estrategia_atual: "" },
  });

  const ondeInveste = useWatch({ control, name: "onde_investe" }) || [];
  const classes = useWatch({ control, name: "classes_investidas" }) || [];
  const estrategia = useWatch({ control, name: "estrategia_atual" });

  const toggle = (campo: "onde_investe" | "classes_investidas", value: string) => {
    const atual = campo === "onde_investe" ? ondeInveste : classes;
    const updated = atual.includes(value) ? atual.filter((v) => v !== value) : [...atual, value];
    setValue(campo, updated, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <ChipGroup
        titulo="Onde você investe hoje?"
        opcoes={INSTITUICOES}
        selecionadas={ondeInveste}
        onToggle={(value) => toggle("onde_investe", value)}
        erro={errors.onde_investe?.message}
      />

      <div>
        <label htmlFor="valor_investido" className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75">
          Quanto você tem investido no total?{" "}
          <span className="font-normal text-blue-brand-950/40">(aproximado já ajuda)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-brand-950/40">
            R$
          </span>
          <Controller
            name="valor_investido"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <input
                id="valor_investido"
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
        {errors.valor_investido && (
          <p className="mt-1.5 text-xs text-red-500">{errors.valor_investido.message}</p>
        )}
      </div>

      <ChipGroup
        titulo="Quais classes de ativos você possui?"
        opcoes={CLASSES}
        selecionadas={classes}
        onToggle={(value) => toggle("classes_investidas", value)}
        erro={errors.classes_investidas?.message}
      />

      <div>
        <p className="mb-3 text-sm font-semibold text-blue-brand-950/75">
          Como você descreveria sua estratégia atual?
        </p>
        <div className="space-y-2.5">
          {ESTRATEGIAS.map((opcao) => {
            const selecionado = estrategia === opcao.id;
            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => setValue("estrategia_atual", opcao.id, { shouldValidate: true })}
                aria-pressed={selecionado}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selecionado
                    ? "border-primary-500 bg-primary-400/15 ring-4 ring-primary-500/10"
                    : "border-blue-brand-950/10 bg-white/55 hover:border-blue-brand-950/30"
                }`}
              >
                <p className="text-sm font-bold text-blue-brand-950">{opcao.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-blue-brand-950/55">{opcao.desc}</p>
              </button>
            );
          })}
        </div>
        {errors.estrategia_atual && (
          <p className="mt-1.5 text-xs text-red-500">{errors.estrategia_atual.message}</p>
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

function ChipGroup({
  titulo,
  opcoes,
  selecionadas,
  onToggle,
  erro,
}: {
  titulo: string;
  opcoes: string[];
  selecionadas: string[];
  onToggle: (value: string) => void;
  erro?: string;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-blue-brand-950/75">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
              selecionadas.includes(item)
                ? "border-blue-brand-950 bg-blue-brand-950 text-white"
                : "border-blue-brand-950/10 bg-white/55 text-blue-brand-950/60 hover:border-blue-brand-950/30 hover:text-blue-brand-950"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      {erro && <p className="mt-1.5 text-xs text-red-500">{erro}</p>}
    </div>
  );
}
