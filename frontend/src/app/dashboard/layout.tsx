import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Synapta Invest | Minha Plataforma",
  description: "Crie sua rota financeira personalizada e desbloqueie todas as ferramentas da Synapta.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

