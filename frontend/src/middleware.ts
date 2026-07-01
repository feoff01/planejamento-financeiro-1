import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware do Next.js (Edge)
 * 
 * Este arquivo implementa a Diretriz de Segurança §4 e Proteção de Rotas §6.
 * Ele intercepta requisições antes de renderizar a página, verificando o cookie
 * seguro definido pelo Backend.
 */
export function middleware(request: NextRequest) {
  // O middleware roda no servidor. Ele consegue ler o cookie httpOnly
  const token = request.cookies.get('sb_token')?.value;

  // 1. Proteger rotas privadas (Route Guard)
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/plano-ideal') ||
                           request.nextUrl.pathname.startsWith('/plano-ideal');
  
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 2. Prevenir acesso a rotas públicas quando já logado
  if (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/cadastro')) {
    if (token) {
      return NextResponse.redirect(new URL('/plano-ideal', request.url));
    }
  }

  return NextResponse.next();
}

// Configura em quais rotas o middleware deve agir
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/plano-ideal/:path*',
    '/plano-ideal/:path*',
    '/auth/login',
    '/auth/cadastro'
  ],
};

