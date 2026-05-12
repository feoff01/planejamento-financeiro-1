"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CadastroSchema, CadastroFormData } from "@/schemas/authSchemas";
import { useAuth } from "@/hooks/useAuth";

const benefits = [
  "Análise personalizada da sua carteira",
  "Rota financeira otimizada por IA",
  "Grátis para começar, sem cartão",
];

export default function CadastroPage() {
  const [showPass, setShowPass] = useState(false);
  const { signUp, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(CadastroSchema),
  });

  const passwordValue = watch("password", "");
  const passwordStrength = getPasswordStrength(passwordValue);

  const onSubmit = (data: CadastroFormData) => {
    signUp(data);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-gold-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-gold-600 rounded-lg flex items-center justify-center">
            <span className="text-blue-brand-950 font-bold text-lg leading-none">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight">
            Synapta<span className="text-primary-500">Invest</span>
          </span>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/5 relative z-10"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Crie sua conta grátis</h1>
          <p className="text-sm text-zinc-400">Comece sua jornada rumo à independência financeira.</p>
        </div>

        {/* Benefits strip */}
        <div className="mb-6 space-y-2">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <CheckCircle2 size={14} className="text-primary-500 shrink-0" />
              <span className="text-xs text-zinc-400">{b}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

          {/* Nome completo */}
          <div>
            <label htmlFor="cadastro-nome" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Nome completo
            </label>
            <input
              id="cadastro-nome"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              {...register("nome")}
              className="w-full px-4 py-3 rounded-xl bg-surface-light border border-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
            />
            {errors.nome && (
              <p className="mt-1.5 text-xs text-red-400">{errors.nome.message}</p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label htmlFor="cadastro-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              E-mail
            </label>
            <input
              id="cadastro-email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              {...register("email")}
              className="w-full px-4 py-3 rounded-xl bg-surface-light border border-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="cadastro-password" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                id="cadastro-password"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                {...register("password")}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-surface-light border border-border text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Força da senha */}
            {passwordValue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2"
              >
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.level >= level
                          ? passwordStrength.level === 1
                            ? "bg-red-500"
                            : passwordStrength.level === 2
                            ? "bg-yellow-500"
                            : "bg-green-500"
                          : "bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength.color}`}>{passwordStrength.label}</p>
              </motion.div>
            )}

            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Erro global do backend */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full py-3.5 rounded-full font-semibold text-sm bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-gold-500 text-blue-brand-950 flex items-center justify-center gap-2 glow-effect transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Criando sua conta...
              </>
            ) : (
              <>
                Criar conta grátis
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Já tem uma conta?{" "}
          <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-xs text-zinc-700 text-center max-w-sm relative z-10"
      >
        Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
      </motion.p>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getPasswordStrength(password: string): {
  level: number;
  label: string;
  color: string;
} {
  if (password.length === 0) return { level: 0, label: "", color: "" };

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isLong = password.length >= 10;

  const score = [hasLetter, hasNumber, hasSpecial, isLong].filter(Boolean).length;

  if (score <= 1) return { level: 1, label: "Senha fraca", color: "text-red-400" };
  if (score <= 2) return { level: 2, label: "Senha razoável", color: "text-yellow-400" };
  return { level: 3, label: "Senha forte", color: "text-green-400" };
}
