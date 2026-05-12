"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Lock, LogOut, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/services/auth/AuthService";
import { navigationItems } from "./navigationItems";

export function MobileNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("Minha Conta");

  useEffect(() => {
    AuthService.getMe()
      .then((user) => {
        if (user?.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name.split(" ")[0]);
        } else {
          setUserName("Minha Conta");
        }
      })
      .catch(() => setUserName("Minha Conta"));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed right-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-blue-brand-950/85 text-zinc-100 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all active:scale-95"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-blue-brand-950/70 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="md:hidden fixed right-0 top-0 z-50 flex h-dvh w-[min(88vw,360px)] flex-col border-l border-white/10 bg-surface shadow-2xl shadow-black/60"
            >
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-gold-600">
                    <span className="text-xs font-bold leading-none text-blue-brand-950">S</span>
                  </div>
                  <span className="text-xs font-bold tracking-tight">
                    Synapta<span className="text-primary-500">Invest</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-white/5 hover:text-white active:scale-95"
                  aria-label="Fechar menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isUnlocked = !item.locked;
                  const isActive = !!item.href && pathname === item.href;

                  const itemContent = (
                    <div
                      className={`
                        flex min-h-10 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all
                        ${isUnlocked ? "text-zinc-200 active:scale-[0.99]" : "cursor-not-allowed select-none text-zinc-600"}
                        ${isActive ? "border-primary-500/25 bg-primary-500/10 text-primary-400" : "border-transparent bg-transparent"}
                      `}
                    >
                      <Icon size={15} className={isActive ? "text-primary-400" : isUnlocked ? "text-zinc-400" : "text-zinc-700"} />
                      <span className="flex-1">{item.label}</span>
                      {item.locked && <Lock size={11} className="text-zinc-700" />}
                    </div>
                  );

                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.025 }}
                    >
                      {isUnlocked && item.href ? (
                        <Link href={item.href} onClick={() => setIsOpen(false)}>
                          {itemContent}
                        </Link>
                      ) : (
                        itemContent
                      )}
                    </motion.div>
                  );
                })}
              </nav>

              <div className="border-t border-white/5 px-3 py-3">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="mb-2 flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
                >
                  <ArrowLeft size={14} />
                  <span>Voltar para o site</span>
                </Link>

                <div className="flex items-center justify-between rounded-xl bg-blue-brand-950/45 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-brand-800">
                      <User size={13} className="text-zinc-400" />
                    </div>
                    <span className="truncate text-xs font-medium text-zinc-300">{userName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={signOut}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Sair"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
