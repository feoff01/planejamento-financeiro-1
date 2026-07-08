"use client";

import { PiggyBank, ShieldCheck } from "lucide-react";

import type { PlanoReserva } from "@/lib/plano/projecoes";
import { formatDuracao } from "@/lib/plano/projecoes";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

type Props = {
  plano: PlanoReserva;
  /** Nota extra sob o card (ex.: aviso sobre as projeções usarem o aporte total). */
  notaProjecoes?: boolean;
};

export function ReservaEmergenciaCard({ plano, notaProjecoes = false }: Props) {
  if (plano.metaReserva <= 0) return null;

  // ── Reserva completa ────────────────────────────────────────────────────────
  if (plano.temReserva) {
    return (
      <section className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={1.8} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-blue-brand-950">
              Reserva de emergência: completa ✓
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-blue-brand-950/65 sm:text-sm">
              Você já tem {currencyFormatter.format(plano.guardadoAtual)} guardados — mais do que a
              meta de {currencyFormatter.format(plano.metaReserva)} (6 meses das suas despesas). Sua
              base está protegida, então <strong>100% do aporte segue para os objetivos</strong>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── Reserva em construção ───────────────────────────────────────────────────
  const pctReserva = plano.percentualAporte;
  const semAporte = plano.aporteReserva <= 0;

  return (
    <section className="rounded-[1.25rem] border border-primary-500/30 bg-white/70 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <PiggyBank size={22} className="mt-0.5 shrink-0 text-primary-700" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-blue-brand-950">
              Primeiro passo do plano: sua reserva de emergência
            </p>
            <span className="rounded-full bg-primary-400/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary-700">
              Em construção
            </span>
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-blue-brand-950/65 sm:text-sm">
            Meta: <strong>{currencyFormatter.format(plano.metaReserva)}</strong> (6 meses das suas
            despesas). Você já tem {currencyFormatter.format(plano.guardadoAtual)} — faltam{" "}
            <strong>{currencyFormatter.format(plano.falta)}</strong>.
          </p>

          {semAporte ? (
            <p className="mt-3 rounded-xl bg-primary-400/10 px-3.5 py-2.5 text-xs leading-relaxed text-blue-brand-950/70">
              Como ainda não há sobra mensal, o primeiro objetivo do plano é abrir espaço no orçamento
              para começar a reserva — antes de qualquer investimento de risco.
            </p>
          ) : (
            <>
              {/* Divisão do aporte */}
              <div className="mt-4">
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-blue-brand-950 transition-all"
                    style={{ width: `${pctReserva}%` }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 bg-primary-400" aria-hidden="true" />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[11px] font-semibold">
                  <span className="text-blue-brand-950">
                    {pctReserva}% p/ reserva · {currencyFormatter.format(plano.aporteReserva)}/mês
                  </span>
                  <span className="text-primary-700">
                    {100 - pctReserva}% p/ objetivos · {currencyFormatter.format(plano.aporteObjetivos)}
                    /mês
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-blue-brand-950/65">
                O racional: a fatia da reserva fica em <strong>liquidez diária</strong> (Tesouro Selic
                ou CDB com resgate no dia) — rende e está sempre disponível para imprevistos. O
                restante segue para os objetivos em paralelo. Nesse ritmo, sua reserva completa em{" "}
                <strong className="text-primary-700">
                  {formatDuracao(plano.mesesParaCompletar)}
                </strong>
                ; a partir daí, 100% do aporte volta para as metas.
              </p>
            </>
          )}

          {notaProjecoes && !semAporte && (
            <p className="mt-3 text-[11px] leading-relaxed text-blue-brand-950/45">
              As projeções desta página consideram o aporte total — enquanto a reserva não completa,
              parte dele constrói primeiro a sua segurança.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
