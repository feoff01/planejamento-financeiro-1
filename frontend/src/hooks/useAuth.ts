import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth/AuthService";
import { LoginFormData, CadastroFormData } from "@/schemas/authSchemas";

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const signIn = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Chama o Backend passando as credenciais limpas e validadas
      const result = await AuthService.signIn(data);
      
      // 2. Redirecionar para o dashboard
      router.push("/dashboard");
      return result.user;
      
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível entrar agora."));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: CadastroFormData, intentUrlPlan?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Grava no banco e obtém a credencial provisória
      const result = await AuthService.signUp(data);
      
      // 2. Orquestração dos Fluxos baseados em parâmteros (Grátis vs Pro)
      if (intentUrlPlan === "pro") {
        router.push("/checkout-pro"); 
      } else {
        // Vai direto para o dashboard (onde encontrará o wizard de diagnóstico)
        router.push("/dashboard");
      }
      
      return result.user;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível criar sua conta agora."));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
    } catch {
      // Limpa tudo mesmo se o backend falhar
    } finally {
      router.push("/");
    }
  };

  return { signIn, signUp, signOut, isLoading, error };
}

