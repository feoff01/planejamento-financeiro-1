"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Guia Synapta — chat lateral didático do onboarding.
 * Por enquanto NÃO é IA: são mensagens pré-prontas, disparadas conforme a etapa,
 * explicando o que a pessoa está preenchendo e por quê. O visual já é o do chat,
 * pronto para receber a IA (produto 08) depois.
 */

type Props = {
  /** Chave da etapa/tela atual (ex.: "objetivos", "comparativo", "plano-nao"). */
  etapaKey: string;
  /** Mensagens extras dinâmicas (ex.: aviso da reserva incompleta no resultado). */
  extras?: string[];
};

type Mensagem = { id: string; texto: string };

const ROTEIRO: Record<string, string[]> = {
  objetivos: [
    "Eu sou o <b>Guia Synapta</b> 👋 e vou te acompanhar em cada passo, explicando o que cada pergunta significa e por que ela importa.",
    "Começamos pelos <b>objetivos</b> porque todo plano precisa de um destino. É a partir deles que calculamos prazos, valores e a estratégia certa para você.",
  ],
  detalhes: [
    "Agora damos números aos planos: <b>valor, prazo e prioridade</b>. Não precisa ser exato — dá para ajustar depois.",
    "Prazo e prioridade mudam a estratégia: metas próximas pedem mais segurança; metas distantes têm tempo para crescer mais.",
  ],
  renda: [
    "Chegou o motor do plano: <b>renda, gastos e a sobra mensal</b> (o aporte). Consistência no aporte vale mais do que valor alto.",
    "Com os seus gastos eu também calculo a sua <b>reserva de emergência</b> ideal: 6 meses de despesas guardados para imprevistos — a base de qualquer plano.",
  ],
  patrimonio: [
    "Essa pergunta define a sua rota: quem <b>ainda não investe</b> vê o custo de deixar o dinheiro parado; quem <b>já investe</b> aprofunda a carteira para liberar o Raio-X.",
    "Não existe resposta errada aqui — responda como as coisas são hoje. 😉",
  ],
  comparativo: [
    "Esse gráfico usa os <b>seus números</b>: a mesma disciplina, dois destinos. A curva dourada cresce mais rápido por causa dos <b>juros compostos</b> — rendimento que rende sobre si mesmo.",
    "A linha pontilhada é o seu objetivo. Investir não é ter pressa: é chegar antes, com método.",
  ],
  investimentos: [
    "Perguntamos <b>onde e quanto</b> você investe para entender custos, riscos e o que dá para otimizar na sua realidade.",
    "Quanto mais fiel o retrato, mais preciso fica o <b>Raio-X da sua carteira</b> — o próximo passo depois do plano.",
  ],
  risco: [
    "Este é o <b>suitability</b>: o questionário que todo bom assessor aplica para medir quanto risco cabe na sua vida.",
    "Ele evita duas armadilhas: risco demais (e vender no pânico na primeira queda) ou de menos (e demorar anos a mais para chegar lá).",
  ],
  cenarios: [
    "🎁 A carteira de renda fixa que apareceu é <b>sua</b> — de graça, 100% aberta e calibrada para o seu perfil.",
    "As estrelas comparam eficiência: seu método atual ★, a carteira que você ganhou ★★★ e a <b>carteira Synapta ideal ★★★★★</b> — renda fixa + ações no peso certo para o seu objetivo.",
  ],
  "plano-nao": [
    "No plano traçado, a <b>renda fixa está aberta</b> porque já é sua. Os ativos de ações — e o peso de cada um — fazem parte da recomendação completa.",
    "Dica: passe sua nova carteira pelo <b>Raio-X</b> para ver os pontos fortes e o que ainda falta nela.",
  ],
  "plano-sim": [
    "Seu plano foi montado com o que você contou. As partes borradas fazem parte do plano completo.",
    "O próximo passo é o <b>Raio-X da sua carteira</b>: concentração, setores pesados demais e o que trava o rendimento. A análise inicial é grátis.",
  ],
  "plano-completo": [
    "Plano completo liberado! 🎉 Explore a alocação e o papel de cada ativo — e me chame quando a IA estiver por aqui. 😉",
  ],
};

let contadorId = 0;
const novoId = () => `msg-${++contadorId}`;

export function GuiaChat({ etapaKey, extras = [] }: Props) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  // Balões temporários ao lado do botão: aparecem quando a página muda e somem sozinhos.
  const [toasts, setToasts] = useState<Mensagem[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const jaEnviadas = useRef<Set<string>>(new Set());
  const abertoRef = useRef(aberto);
  const listaRef = useRef<HTMLDivElement>(null);

  abertoRef.current = aberto;

  // Dispara as mensagens roteirizadas da etapa (uma única vez por etapa).
  useEffect(() => {
    const roteiro = [...(ROTEIRO[etapaKey] ?? []), ...extras];
    const pendentes = roteiro.filter((texto) => !jaEnviadas.current.has(texto));
    if (pendentes.length === 0) return;

    const timers = pendentes.map((texto, index) =>
      window.setTimeout(() => {
        // Marca como enviada apenas NA ENTREGA: o StrictMode (dev) executa o efeito
        // duas vezes — marcar antes fazia a 2ª execução pular as boas-vindas.
        if (jaEnviadas.current.has(texto)) return;
        jaEnviadas.current.add(texto);

        const mensagem: Mensagem = { id: novoId(), texto };
        setMensagens((prev) => [...prev, mensagem]);

        if (!abertoRef.current) {
          setNaoLidas((prev) => prev + 1);
          // Mostra como balão ao lado (máx. 3 na pilha) e agenda o desaparecimento.
          setToasts((prev) => [...prev.slice(-2), mensagem]);
          window.setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== mensagem.id));
          }, 9000);
        }
      }, 600 + index * 2200)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaKey, extras.join("|")]);

  // Auto-scroll para a última mensagem.
  useEffect(() => {
    if (!aberto) return;
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensagens, aberto]);

  const abrir = () => {
    setAberto(true);
    setNaoLidas(0);
    setToasts([]);
  };

  return (
    <>
      {/* Painel do chat */}
      <AnimatePresence>
        {aberto && (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.25rem] border border-blue-brand-950/10 bg-[#f7f3ea] shadow-[0_24px_80px_rgba(11,37,69,0.28)] sm:right-6"
            aria-label="Guia Synapta"
          >
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 bg-blue-brand-950 px-4 py-3.5 text-white">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-primary-500 text-blue-brand-950">
                <Sparkles size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">Guia Synapta</p>
                <p className="text-[11px] text-white/55">Te explicando cada passo do plano</p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar guia"
                className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mensagens */}
            <div ref={listaRef} className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-4">
              {mensagens.map((mensagem) => (
                <motion.div
                  key={mensagem.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-[92%] rounded-2xl rounded-tl-md border border-blue-brand-950/10 bg-white/80 px-3.5 py-2.5 text-xs leading-relaxed text-blue-brand-950/80 [&_b]:font-bold [&_b]:text-blue-brand-950"
                  dangerouslySetInnerHTML={{ __html: mensagem.texto }}
                />
              ))}
            </div>

            {/* Entrada (visual — a IA chega depois) */}
            <div className="border-t border-blue-brand-950/10 bg-white/60 p-3">
              <input
                disabled
                placeholder="Em breve você poderá perguntar por aqui…"
                className="w-full cursor-not-allowed rounded-full border border-blue-brand-950/10 bg-white/70 px-4 py-2.5 text-xs text-blue-brand-950 placeholder:text-blue-brand-950/35"
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Balões temporários (mensagens da etapa) */}
      <div className="pointer-events-none fixed bottom-24 right-4 z-40 flex w-[min(340px,calc(100vw-2rem))] flex-col items-end gap-2 sm:right-6">
        <AnimatePresence>
          {!aberto &&
            toasts.map((toast) => (
              <motion.button
                key={toast.id}
                type="button"
                onClick={abrir}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.35 } }}
                className="pointer-events-auto w-full rounded-2xl rounded-br-md border border-blue-brand-950/10 bg-[#f7f3ea] p-3.5 text-left shadow-[0_16px_48px_rgba(11,37,69,0.22)]"
              >
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-700">
                  <Sparkles size={11} />
                  Guia Synapta
                </span>
                <span
                  className="block text-xs leading-relaxed text-blue-brand-950/80 [&_b]:font-bold [&_b]:text-blue-brand-950"
                  dangerouslySetInnerHTML={{ __html: toast.texto }}
                />
              </motion.button>
            ))}
        </AnimatePresence>
      </div>

      {/* Botão flutuante */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={aberto ? () => setAberto(false) : abrir}
        aria-label={aberto ? "Fechar Guia Synapta" : "Abrir Guia Synapta"}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-primary-500 text-blue-brand-950 shadow-[0_12px_32px_rgba(201,162,75,0.5)] transition-transform hover:scale-105 sm:right-6"
      >
        <MessageCircle size={22} strokeWidth={2.2} />
        {naoLidas > 0 && !aberto && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-brand-950 px-1 text-[10px] font-black text-white">
            {naoLidas}
          </span>
        )}
      </motion.button>
    </>
  );
}
