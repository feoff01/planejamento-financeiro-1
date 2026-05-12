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
    <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-surface border-r border-white/5 flex-col z-40 pt-6 pb-8">
      <div className="px-6 mb-10 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-gold-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-blue-brand-950 font-bold text-base leading-none">S</span>
        </div>
        <span className="font-bold text-lg tracking-tight">
          Synapta<span className="text-primary-500">Invest</span>
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item, i) => {
          const Icon = item.icon;
          const isUnlocked = !item.locked;
          const isActive = !!item.href && pathname === item.href;

          const itemContent = (
            <div
              className={`
                flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isUnlocked
                  ? "hover:bg-primary-500/10 hover:text-primary-400 text-zinc-300 cursor-pointer"
                  : "text-zinc-600 cursor-not-allowed select-none"
                }
                ${isActive ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" : "border border-transparent"}
              `}
            >
              <Icon size={16} className={isActive ? "text-primary-400" : isUnlocked ? "text-zinc-400" : "text-zinc-700"} />
              <span className="flex-1">{item.label}</span>
              {item.locked && <Lock size={12} className="text-zinc-700 shrink-0" />}
            </div>
          );

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {isUnlocked && item.href ? <Link href={item.href}>{itemContent}</Link> : itemContent}
            </motion.div>
          );
        })}
      </nav>

      <div className="px-4 mt-auto flex flex-col gap-4">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Voltar para o site</span>
        </Link>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between px-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-brand-800 flex items-center justify-center shrink-0">
              <User size={14} className="text-zinc-400" />
            </div>
            <span className="text-sm font-medium text-zinc-300 truncate max-w-[100px]">{userName}</span>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
