import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CircleDollarSign,
  ClipboardList,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

import { MobileNav } from "@/components/dashboard/MobileNav";
import { Sidebar } from "@/components/dashboard/Sidebar";

const acompanhamentoCards = [
  {
    icon: TrendingUp,
    title: "Andamento dos objetivos",
    text: "Mostrar se cada objetivo esta em dia, atrasado ou adiantado em relacao ao plano gerado.",
  },
  {
    icon: CircleDollarSign,
    title: "Capacidade financeira",
    text: "Guardar renda, gastos, aporte planejado e aporte real medio para entender se a rota ainda faz sentido.",
  },
  {
    icon: CalendarCheck,
    title: "Aportes realizados",
    text: "Registrar mensalmente quanto foi aportado de fato e comparar com o aporte ideal definido pelo motor.",
  },
  {
    icon: SlidersHorizontal,
    title: "Perfil do plano",
    text: "Permitir que o usuario mude para uma versao mais conservadora, equilibrada ou arrojada e recalcule a carteira.",
  },
];

const gatilhos = [
  "Aporte real menor que o planejado por alguns meses: sugerir recalculo do plano.",
  "Aporte real maior que o planejado: mostrar antecipacao potencial dos objetivos.",
  "Mudanca de renda ou gastos: atualizar capacidade mensal e impacto no prazo.",
  "Mudanca de perfil de risco: gerar nova carteira e comparar risco, prazo e chance de sucesso.",
];

export default function MeuAcompanhamentoPage() {
  return (
    <div className="min-h-screen bg-[#f7f3ea] text-blue-brand-950 md:flex">
      <Sidebar />

      <main className="min-h-screen flex-1 md:ml-64">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 md:px-10 md:py-10">
          <header className="border-b border-blue-brand-950/10 pb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-brand-950 text-primary-400">
              <Activity size={22} />
            </div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary-700">
              Meu acompanhamento
            </p>
            <h1 className="max-w-3xl font-editorial text-5xl leading-[0.95] text-blue-brand-950 md:text-6xl">
              O lugar onde o plano deixa de ser estatico e passa a acompanhar a vida real.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-blue-brand-950/65">
              Esta tela sera o painel pos-assinatura para acompanhar objetivos, renda, gastos, perfil de investidor e
              aderencia aos aportes. O Plano Ideal cria ou recalcula o plano; o Meu acompanhamento mostra se o usuario
              esta conseguindo seguir a rota.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {acompanhamentoCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1rem] bg-white/70 p-5 shadow-[0_18px_50px_rgba(11,37,69,0.05)]">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-primary-400/25 text-blue-brand-950">
                    <Icon size={19} />
                  </div>
                  <h2 className="text-sm font-bold text-blue-brand-950">{item.title}</h2>
                  <p className="mt-3 text-xs leading-relaxed text-blue-brand-950/60">{item.text}</p>
                </article>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.25rem] bg-blue-brand-950 p-6 text-white md:p-7">
              <div className="mb-6 flex items-center gap-3">
                <ClipboardList className="text-primary-400" size={22} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-300">Contexto da ferramenta</p>
                  <h2 className="mt-1 text-xl font-bold">Para que esta aba existe</h2>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/70">
                O objetivo desta area e responder: "meu plano ainda esta de pe?". Ela deve centralizar o acompanhamento
                dos objetivos do usuario depois que o Output Especifico for desbloqueado. Aqui entram os aportes reais,
                mudancas de renda, mudancas de gastos, perfil de investidor e gatilhos para recalcular o Plano Ideal.
              </p>
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="border-t border-white/15 pt-4">
                  <p className="font-editorial text-3xl text-primary-300">01</p>
                  <p className="mt-1 text-xs text-white/65">Monitorar se o usuario esta seguindo o aporte planejado.</p>
                </div>
                <div className="border-t border-white/15 pt-4">
                  <p className="font-editorial text-3xl text-primary-300">02</p>
                  <p className="mt-1 text-xs text-white/65">Detectar mudancas de vida que afetem a rota financeira.</p>
                </div>
                <div className="border-t border-white/15 pt-4">
                  <p className="font-editorial text-3xl text-primary-300">03</p>
                  <p className="mt-1 text-xs text-white/65">Levar o usuario para ver ou recalcular o Plano Ideal.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.25rem] bg-white/70 p-6 shadow-[0_18px_50px_rgba(11,37,69,0.05)] md:p-7">
              <div className="mb-6 flex items-center gap-3">
                <RefreshCw className="text-primary-700" size={21} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-brand-950/40">Gatilhos futuros</p>
                  <h2 className="mt-1 text-xl font-bold text-blue-brand-950">Quando recalcular</h2>
                </div>
              </div>
              <div className="space-y-3">
                {gatilhos.map((item) => (
                  <div key={item} className="border-b border-blue-brand-950/10 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-sm leading-relaxed text-blue-brand-950/70">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-[1.25rem] bg-white/70 p-6 shadow-[0_18px_50px_rgba(11,37,69,0.05)] md:flex-row md:items-center md:justify-between md:p-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-brand-950/40">
                Acao conectada
              </p>
              <h2 className="mt-2 text-xl font-bold text-blue-brand-950">Ver plano ou gerar uma nova carteira</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-brand-950/60">
                Quando algum dado importante mudar, esta aba deve conduzir o usuario de volta para o Plano Ideal com
                o contexto necessario para revisar o plano.
              </p>
            </div>
            <Link
              href="/plano-ideal"
              className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-400 px-5 text-sm font-bold text-blue-brand-950 transition-colors hover:bg-primary-500"
            >
              Ir para Plano Ideal
              <ArrowRight size={17} />
            </Link>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

