import { redirect } from 'next/navigation';

export default function DashboardIndex() {
  // Redireciona o dashboard raiz para a pagina principal no momento (Plano Ideal)
  redirect('/plano-ideal');
}

