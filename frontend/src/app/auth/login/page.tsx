"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/useAuth";
import { LoginFormData, LoginSchema } from "@/schemas/authSchemas";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const { signIn, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    signIn(data);
  };

  return (
    <main className="min-h-dvh bg-[#f7f3ea] px-4 py-8 text-blue-brand-950">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="hidden lg:block"
        >
          <Link href="/" className="mb-16 inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-brand-950">
              <span className="text-sm font-bold leading-none text-primary-400">S</span>
            </div>
            <span className="text-base font-semibold tracking-tight">
              Synapta<span className="text-primary-600">Invest</span>
            </span>
          </Link>

          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">
            Plataforma Synapta
          </p>
          <h1 className="font-editorial text-6xl leading-[0.92] xl:text-7xl">
            Volte para a sua rota patrimonial.
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-blue-brand-950/60">
            Acompanhe seu diagnóstico, revise seus objetivos e siga com decisões financeiras mais claras.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mx-auto w-full max-w-md rounded-[1.5rem] border border-blue-brand-950/10 bg-white/55 p-6 shadow-[0_24px_80px_rgba(11,37,69,0.08)] backdrop-blur md:p-8"
        >
          <Link href="/" className="mb-10 inline-flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-brand-950">
              <span className="text-sm font-bold leading-none text-primary-400">S</span>
            </div>
            <span className="text-base font-semibold tracking-tight">
              Synapta<span className="text-primary-600">Invest</span>
            </span>
          </Link>

          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">
              Entrar
            </p>
            <h2 className="font-editorial text-5xl leading-none">Bem-vindo de volta.</h2>
            <p className="mt-4 text-sm leading-relaxed text-blue-brand-950/60">
              Continue sua jornada financeira de onde parou.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register("email")}
                className="w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-semibold text-blue-brand-950/75">
                  Senha
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary-700 transition-colors hover:text-primary-600"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 pr-12 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-brand-950/45 transition-colors hover:text-blue-brand-950"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-brand-950 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar na minha conta
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-blue-brand-950/55">
            Ainda não tem conta?{" "}
            <Link href="/auth/cadastro" className="font-semibold text-primary-700 transition-colors hover:text-primary-600">
              Cadastre-se grátis
            </Link>
          </p>
        </motion.section>

        <p className="text-center text-xs text-blue-brand-950/40 lg:col-start-2">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </main>
  );
}
