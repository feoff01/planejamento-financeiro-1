"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Target, 
  Wallet, 
  CreditCard, 
  User 
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Início", href: "/dashboard" },
  { icon: Target, label: "Carteira", href: "/carteira-ideal" },
  { icon: Wallet, label: "Patrimônio", href: "/dashboard" }, // Placeholder
  { icon: CreditCard, label: "Planos", href: "/planos" },
  { icon: User, label: "Conta", href: "/dashboard" }, // Placeholder
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2">
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-around py-3 px-2 shadow-2xl shadow-black/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.label} 
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[64px] transition-all"
            >
              <div className={`p-2 rounded-xl transition-all ${
                isActive 
                  ? "bg-primary-500 text-black" 
                  : "text-zinc-500 active:scale-95"
              }`}>
                <Icon size={20} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-all ${
                isActive ? "text-primary-400" : "text-zinc-500"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
