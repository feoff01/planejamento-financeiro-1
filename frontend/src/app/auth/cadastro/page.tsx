"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useAuth } from "@/hooks/useAuth";
import { CadastroFormData, CadastroSchema } from "@/schemas/authSchemas";

const benefits = [
  "Diagnóstico personalizado da sua vida financeira",
  "Plano ideal alinhado a objetivo, prazo e risco",
  "Comece grátis, sem cartão",
];

export default function CadastroPage() {
  const [showPass, setShowPass] = useState(false);
  const { signUp, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(CadastroSchema),
  });

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" }) ?? "";
  const passwordStrength = getPasswordStrength(passwordValue);

  const onSubmit = (data: CadastroFormData) => {
    signUp(data);
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
            Nova conta
          </p>
          <h1 className="font-editorial text-6xl leading-[0.92] xl:text-7xl">
            Comece com uma visão clara do seu patrimônio.
          </h1>

          <div className="mt-9 max-w-md divide-y divide-blue-brand-950/10 border-y border-blue-brand-950/10">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 py-4">
                <CheckCircle2 size={17} className="shrink-0 text-primary-600" />
                <span className="text-sm font-medium text-blue-brand-950/66">{benefit}</span>
              </div>
            ))}
          </div>
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

          <div className="mb-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">
              Cadastro
            </p>
            <h2 className="font-editorial text-5xl leading-none">Crie sua conta.</h2>
            <p className="mt-4 text-sm leading-relaxed text-blue-brand-950/60">
              A primeira leitura é gratuita e leva poucos minutos.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="cadastro-nome" className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75">
                Nome completo
              </label>
              <input
                id="cadastro-nome"
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                {...register("nome")}
                className="w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              />
              {errors.nome && <p className="mt-1.5 text-xs text-red-500">{errors.nome.message}</p>}
            </div>

            <div>
              <label htmlFor="cadastro-email" className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75">
                E-mail
              </label>
              <input
                id="cadastro-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register("email")}
                className="w-full rounded-2xl border border-blue-brand-950/10 bg-white/70 px-4 py-3 text-sm text-blue-brand-950 placeholder:text-blue-brand-950/35 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="cadastro-password" className="mb-1.5 block text-sm font-semibold text-blue-brand-950/75">
                Senha
              </label>
              <div className="relative">
                <input
                  id="cadastro-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
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

              {passwordValue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2"
                >
                  <div className="mb-1 flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength.level >= level ? passwordStrength.bar : "bg-blue-brand-950/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color}`}>{passwordStrength.label}</p>
                </motion.div>
              )}

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

          <p className="mt-6 text-center text-sm text-blue-brand-950/55">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="font-semibold text-primary-700 transition-colors hover:text-primary-600">
              Entrar
            </Link>
          </p>
        </motion.section>

        <p className="text-center text-xs text-blue-brand-950/40 lg:col-start-2">
          Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </main>
  );
}

function getPasswordStrength(password: string): {
  level: number;
  label: string;
  color: string;
  bar: string;
} {
  if (password.length === 0) return { level: 0, label: "", color: "", bar: "" };

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isLong = password.length >= 10;

  const score = [hasLetter, hasNumber, hasSpecial, isLong].filter(Boolean).length;

  if (score <= 1) return { level: 1, label: "Senha fraca", color: "text-red-600", bar: "bg-red-500" };
  if (score <= 2) return { level: 2, label: "Senha razoável", color: "text-primary-700", bar: "bg-primary-500" };
  return { level: 3, label: "Senha forte", color: "text-emerald-600", bar: "bg-emerald-500" };
}