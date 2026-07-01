import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
});

export const metadata: Metadata = {
  title: "Synapta Invest | Acelere sua Rota Financeira",
  description: "A IA que analisa sua vida, corrige seus investimentos e cria a rota otimizada para você multiplicar seu patrimônio em menos tempo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${manrope.variable} ${instrumentSerif.variable} bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}

