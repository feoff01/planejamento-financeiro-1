import {
  BookOpen,
  Briefcase,
  Calculator,
  ChartNoAxesCombined,
  CreditCard,
  Activity,
  LayoutDashboard,
  LifeBuoy,
  LucideIcon,
  MessageSquareText,
  Radar,
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
  { icon: Target, label: "Plano Ideal", locked: false, href: "/plano-ideal" },
  { icon: Radar, label: "Raio-X da Carteira", locked: false, href: "/raio-x" },
  { icon: Activity, label: "Meu acompanhamento", locked: false, href: "/meu-acompanhamento" },
  { icon: LayoutDashboard, label: "Dashboard", locked: true },
  { icon: Wallet, label: "Minha Carteira", locked: true },
  { icon: Briefcase, label: "Carteira Recomendada", locked: true },
  { icon: ScanSearch, label: "Screening de Ações", locked: true },
  { icon: ChartNoAxesCombined, label: "Otimizador de Carteira", locked: true },
  { icon: MessageSquareText, label: "Consultor IA", locked: true },
  { icon: BookOpen, label: "Conteúdos", locked: true },
  { icon: Calculator, label: "Simuladores", locked: true },
  { icon: UserCheck, label: "Gestor", locked: true },
  { icon: CreditCard, label: "Planos", locked: false, href: "/planos" },
  { icon: LifeBuoy, label: "Suporte", locked: false, href: "/suporte" },
];

