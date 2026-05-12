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
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar Placeholder (could be a separate component but simple enough here) */}
      <header className="fixed top-0 inset-x-0 h-20 z-50 bg-background/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-2 shrink-0">
           <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-500 to-gold-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-blue-brand-950 font-bold text-lg sm:text-xl leading-none">S</span>
           </div>
           <span className="font-bold text-lg sm:text-xl tracking-tight shrink-0">Synapta<span className="text-primary-500">Invest</span></span>
        </div>
        <div className="flex items-center">
          <Link 
            href="/auth/login" 
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-blue-brand-950 text-sm font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(201, 162, 75,0.2)] whitespace-nowrap"
          >
            Entrar na plataforma
          </Link>
        </div>
      </header>

      <Hero />
      <Problem />
      <Solutions />
      <Testimonials />
      <Pricing />
      <Guarantee />
      <CTA />

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-background text-center text-zinc-500">
        <p className="mb-4">Synapta Invest © {new Date().getFullYear()}. Todos os direitos reservados.</p>
        <p className="text-sm max-w-lg mx-auto">
          A Synapta não é uma corretora, mas a ponte tecnológica inteligente entre você e seu sucesso financeiro.
        </p>
      </footer>
    </main>
  );
}
