import {
  BookOpen,
  Briefcase,
  Calculator,
  ChartNoAxesCombined,
  CreditCard,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LucideIcon,
  MessageSquareText,
  ScanSearch,
  Target,
  UserCheck,
  Wallet,
} from "lucide-react";

export type NavItem = {
  icon: LucideIcon;
  label: string;
  locked: boolean;
  href?: string;
};

export const navigationItems: NavItem[] = [
  { icon: Target, label: "Carteira Ideal", locked: false, href: "/carteira-ideal" },
  { icon: LayoutDashboard, label: "Dashboard", locked: true },
  { icon: Wallet, label: "Minha Carteira", locked: true },
  { icon: Briefcase, label: "Carteira de Ações", locked: true },
  { icon: ScanSearch, label: "Screening de Ações", locked: true },
  { icon: ChartNoAxesCombined, label: "Otimizador de Carteira", locked: true },
  { icon: MessageSquareText, label: "Consultor IA", locked: true },
  { icon: BookOpen, label: "Conteúdos", locked: true },
  { icon: FileText, label: "Relatórios", locked: true },
  { icon: Calculator, label: "Simuladores", locked: true },
  { icon: UserCheck, label: "Gestor", locked: true },
  { icon: CreditCard, label: "Planos", locked: false, href: "/planos" },
  { icon: LifeBuoy, label: "Suporte", locked: false, href: "/suporte" },
];
