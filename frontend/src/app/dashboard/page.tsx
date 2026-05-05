import { redirect } from 'next/navigation';

export default function DashboardIndex() {
  // Redireciona o dashboard raiz para a página principal no momento (Carteira Ideal)
  redirect('/carteira-ideal');
}
