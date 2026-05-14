"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Lock, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/services/auth/AuthService";
import { navigationItems } from "./navigationItems";

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [userName, setUserName] = useState("Carregando...");

  useEffect(() => {
    AuthService.getMe()
      .then((user) => {
        if (user?.user_metadata?.full_name) {
          const firstName = user.user_metadata.full_name.split(" ")[0];
          setUserName(firstName);
        } else {
          setUserName("Minha Conta");
        }
      })
      .catch(() => setUserName("Minha Conta"));
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-blue-brand-950/10 bg-[#f7f3ea] pb-8 pt-6 text-blue-brand-950 md:flex">
      <div className="mb-10 flex items-center gap-2.5 px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-brand-950">
          <span className="text-sm font-bold leading-none text-primary-400">S</span>
        </div>
        <span className="text-base font-semibold tracking-tight">
          Synapta<span className="text-primary-600">Invest</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navigationItems.map((item, i) => {
          const Icon = item.icon;
          const isUnlocked = !item.locked;
          const isActive = !!item.href && pathname === item.href;

          const itemContent = (
            <div
              className={`
                flex min-h-11 items-center gap-3 rounded-full border px-3.5 py-2.5 text-sm font-semibold transition-all
                ${
                  isUnlocked
                    ? "cursor-pointer text-blue-brand-950/70 hover:border-blue-brand-950/10 hover:bg-white/55 hover:text-blue-brand-950"
                    : "cursor-not-allowed select-none text-blue-brand-950/30"
                }
                ${isActive ? "border-blue-brand-950 bg-blue-brand-950 text-white shadow-sm" : "border-transparent"}
              `}
            >
              <Icon
                size={16}
                className={isActive ? "text-primary-400" : isUnlocked ? "text-blue-brand-950/50" : "text-blue-brand-950/25"}
              />
              <span className="flex-1">{item.label}</span>
              {item.locked && <Lock size={12} className="shrink-0 text-blue-brand-950/25" />}
            </div>
          );

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.035 }}
            >
              {isUnlocked && item.href ? <Link href={item.href}>{itemContent}</Link> : itemContent}
            </motion.div>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 px-4">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold text-blue-brand-950/55 transition-all hover:bg-white/55 hover:text-blue-brand-950"
        >
          <ArrowLeft size={16} />
          <span>Voltar para o site</span>
        </Link>

        <div className="flex items-center justify-between border-t border-blue-brand-950/10 px-2 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-brand-950 text-primary-400">
              <User size={15} />
            </div>
            <span className="max-w-[110px] truncate text-sm font-semibold text-blue-brand-950/72">{userName}</span>
          </div>
          <button
            onClick={signOut}
            className="rounded-full p-2 text-blue-brand-950/45 transition-all hover:bg-red-500/10 hover:text-red-600"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
