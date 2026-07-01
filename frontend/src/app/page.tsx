import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Solutions } from "@/components/Solutions";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { CTA } from "@/components/CTA";
import { Guarantee } from "@/components/Guarantee";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-blue-brand-950 flex flex-col">
      <header className="fixed top-0 inset-x-0 h-16 z-50 bg-[#f7f3ea]/90 backdrop-blur-md border-b border-blue-brand-950/10 flex items-center justify-between px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-blue-brand-950 rounded-full flex items-center justify-center shrink-0">
            <span className="text-primary-400 font-bold text-sm leading-none">S</span>
          </div>
          <span className="font-semibold text-sm sm:text-base tracking-tight shrink-0">
            Synapta<span className="text-primary-600">Invest</span>
          </span>
        </div>

        <Link
          href="/auth/login"
          className="px-5 py-2 bg-blue-brand-950 hover:bg-blue-brand-900 text-white text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap"
        >
          Entrar na plataforma
        </Link>
      </header>

      <Hero />
      <Problem />
      <Solutions />
      <Testimonials />
      <Pricing />
      <Guarantee />
      <CTA />

      <footer className="py-12 border-t border-blue-brand-950/10 bg-[#f7f3ea] text-center text-blue-brand-950/55 px-6">
        <p className="mb-4">Synapta Invest © {new Date().getFullYear()}. Todos os direitos reservados.</p>
        <p className="text-sm max-w-lg mx-auto">
          A Synapta não é uma corretora, mas a ponte tecnológica inteligente entre você e seu sucesso financeiro.
        </p>
      </footer>
    </main>
  );
}

