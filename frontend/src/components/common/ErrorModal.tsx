"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, RefreshCcw } from "lucide-react";

type Props = {
  isOpen: boolean;
  message: string | null;
  onClose: () => void;
  onRetry?: () => void;
};

export function ErrorModal({ isOpen, message, onClose, onRetry }: Props) {
  // Tradução de erros técnicos para mensagens amigáveis
  const getFriendlyMessage = (msg: string | null) => {
    if (!msg) return "";
    if (msg.toLowerCase().includes("failed to fetch")) {
      return "Não conseguimos conectar ao nosso servidor. Verifique sua conexão com a internet.";
    }
    if (msg.toLowerCase().includes("database_error")) {
      return "Tivemos um problema ao salvar seus dados no banco. Nossa equipe já foi notificada.";
    }
    return msg;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-blue-brand-950/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-blue-brand-900 border border-red-500/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(239,68,68,0.2)] pointer-events-auto"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  {getFriendlyMessage(message)}
                </p>

                <div className="flex w-full gap-3">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex-1 bg-white text-blue-brand-950 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                    >
                      <RefreshCcw size={16} /> Tentar de novo
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border border-blue-brand-800 text-zinc-400 hover:text-white transition-colors ${!onRetry ? 'w-full' : ''}`}
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Close corner button */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
