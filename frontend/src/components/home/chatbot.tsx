// src/components/home/chatbot.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaRobot } from "react-icons/fa"; // <-- NUEVO

export type ChatAction =
  | { type: "open_url"; url: string }
  | { type: "copy"; text: string }
  | { type: "emit"; event: string; payload?: any };

export type ChatOption = {
  id: string;
  label: string;
  next?: string;
  action?: ChatAction;
  description?: string;
};

export type ChatNode = {
  id: string;
  message: string;
  options?: ChatOption[];
  isEnd?: boolean;
};

export type ChatTree = {
  startId: string;
  nodes: Record<string, ChatNode>;
};

type OptionChatbotProps = {
  tree: ChatTree;
  title?: string;
  brand?: {
    primary?: string;
    primaryText?: string;
    bubbleBot?: string;
    bubbleUser?: string;
    border?: string;
    surface?: string;
    accent?: string;
    gradientDark?: string;
  };
  floating?: boolean;
  storageKey?: string;
  onEvent?: (event: string, payload?: any) => void;
};

type Message =
  | { role: "bot"; text: string; nodeId: string }
  | { role: "user"; text: string; optionId: string; nodeId: string };

const DEFAULT_BRAND = {
  primary: "#c14421",
  primaryText: "#ffffff",
  bubbleBot: "#1e1e1e",
  bubbleUser: "#f7efe1",
  border: "#e5d0ac",
  surface: "#ffffff",
  accent: "#e5d0ac",
  gradientDark: "#8e2a12",
};

export default function OptionChatbot({
  tree,
  title = "Asistente Quincho Alto Bonito",
  brand,
  floating = true,
  storageKey = "qab-option-chatbot",
  onEvent,
}: OptionChatbotProps) {
  const theme = { ...DEFAULT_BRAND, ...(brand || {}) };

  const [open, setOpen] = useState(!floating);
  const [currentId, setCurrentId] = useState<string>(tree.startId);
  const [history, setHistory] = useState<string[]>([tree.startId]);
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Cargar historial guardado o iniciar con el primer nodo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setOpen(parsed.open ?? !floating);
        setCurrentId(parsed.currentId ?? tree.startId);
        setHistory(parsed.history ?? [tree.startId]);
        setMessages(parsed.messages ?? []);
        return;
      }
    } catch {
      /* no-op */
    }
    const first = tree.nodes[tree.startId];
    if (first) {
      setMessages([{ role: "bot", text: first.message, nodeId: first.id }]);
    }
  }, [storageKey, tree.startId, floating, tree.nodes]);

  // Guardar estado
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ open, currentId, history, messages })
      );
    } catch {
      /* no-op */
    }
  }, [open, currentId, history, messages, storageKey]);

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const currentNode = useMemo(() => tree.nodes[currentId], [tree, currentId]);

  const goTo = (nextId: string) => {
    const node = tree.nodes[nextId];
    if (!node) return;
    setCurrentId(nextId);
    setHistory((h) => [...h, nextId]);
    setMessages((msgs) => [
      ...msgs,
      { role: "bot", text: node.message, nodeId: node.id },
    ]);
  };

  const handleAction = async (action: ChatAction | undefined) => {
    if (!action) return;
    if (action.type === "open_url") {
      window.open(action.url, "_blank", "noopener,noreferrer");
    } else if (action.type === "copy") {
      try {
        await navigator.clipboard.writeText(action.text);
        onEvent?.("copied", { text: action.text });
      } catch {
        /* no-op */
      }
    } else if (action.type === "emit") {
      onEvent?.(action.event, action.payload);
    }
  };

  const chooseOption = async (opt: ChatOption) => {
    setMessages((msgs) => [
      ...msgs,
      { role: "user", text: opt.label, optionId: opt.id, nodeId: currentId },
    ]);
    if (opt.action) await handleAction(opt.action);
    if (opt.next) goTo(opt.next);
  };

  const canGoBack = history.length > 1;
  const goHome = () => {
    setCurrentId(tree.startId);
    setHistory([tree.startId]);
    setMessages([
      { role: "bot", text: tree.nodes[tree.startId].message, nodeId: tree.startId },
    ]);
  };

  // Contenedor
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    floating ? (
      <>
        <button
          aria-label={open ? "Cerrar chat" : "Abrir chat"}
          onClick={() => setOpen((v) => !v)}
          className="fixed bottom-5 right-5 rounded-full shadow-xl px-5 py-4 text-white z-50 text-base font-semibold focus:outline-none focus:ring transition flex items-center gap-2" // <-- flex + gap para icono
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradientDark})`,
          }}
        >
          <FaRobot className="text-lg" aria-hidden /> {/* <-- ICONO */}
          {open ? "Cerrar" : "Asistencia"}
        </button>

        {open && (
          <div
            className="fixed bottom-24 right-5 w-[420px] max-w-[94vw] h:[70vh] md:h-[70vh] h-[70vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden z-50 transition-all"
            style={{
              border: `2px solid ${theme.border}`,
              backgroundColor: theme.surface,
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
            role="dialog"
            aria-label={title}
          >
            {children}
          </div>
        )}
      </>
    ) : (
      <div
        className="w-full h-full min-h-[480px] flex flex-col rounded-3xl shadow-xl overflow-hidden bg-white"
        style={{ border: `2px solid ${theme.border}` }}
      >
        {children}
      </div>
    );

  return (
    <Wrapper>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.gradientDark})`,
          color: theme.primaryText,
        }}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-lg tracking-wide">{title}</span>
          <span className="text-xs opacity-90">
            {currentId === tree.startId ? "Inicio" : `Inicio / ${currentId.replace(/_/g, " ")}`}
          </span>
        </div>

        {canGoBack && (
          <button
            onClick={goHome}
            className="text-sm px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 focus:ring"
            title="Volver al inicio"
          >
            Inicio
          </button>
        )}
      </div>

      {/* Cuerpo */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ background: "linear-gradient(180deg, #fff, #fff8f3 60%)" }}
      >
        {/* Historial */}
        <ul className="space-y-3">
          {messages.map((m, idx) => (
            <li
              key={idx}
              className={`flex ${m.role === "bot" ? "justify-start" : "justify-end"}`}
            >
              <div
                className="max-w-[90%] rounded-2xl px-4 py-3 text-[16px] leading-relaxed shadow transition"
                style={{
                  backgroundColor: m.role === "bot" ? theme.bubbleBot : theme.bubbleUser,
                  color: m.role === "bot" ? "#fff" : "#1e1e1e",
                  border: m.role === "bot" ? `1px solid #00000020` : `1px solid ${theme.accent}`,
                }}
              >
                {m.text}
              </div>
            </li>
          ))}
        </ul>

        {/* Opciones */}
        {currentNode?.options && currentNode.options.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3" role="listbox" aria-label="Opciones">
            {currentNode.options.map((opt) => (
              <button
                key={opt.id}
                role="option"
                aria-selected="false"
                onClick={() => chooseOption(opt)}
                className="w-full text-left rounded-2xl border shadow-sm focus:ring transition p-4 group"
                style={{
                  borderColor: theme.accent,
                  background: "#ffffff",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Barra acento */}
                  <span
                    aria-hidden
                    className="block mt-0.5 rounded-full"
                    style={{
                      width: 6,
                      height: 28,
                      background: `linear-gradient(180deg, ${theme.primary}, ${theme.gradientDark})`,
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-[17px] font-semibold text-gray-900">
                      {opt.label}
                    </div>
                    {opt.description && (
                      <div className="text-[13px] text-gray-600 mt-1">
                        {opt.description}
                      </div>
                    )}
                  </div>
                  <div
                    aria-hidden
                    className="rounded-full px-2 py-1 text-sm opacity-70 group-hover:opacity-100"
                    style={{
                      background: "#fff2ea",
                      color: theme.primary,
                      border: `1px solid ${theme.accent}`,
                    }}
                  >
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 text-[13px]"
        style={{
          background: `linear-gradient(90deg, ${theme.accent}40, transparent)`,
          color: "#374151",
          borderTop: `1px solid ${theme.accent}`,
        }}
      >
        Seleccione una opción para continuar.
      </div>
    </Wrapper>
  );
}
