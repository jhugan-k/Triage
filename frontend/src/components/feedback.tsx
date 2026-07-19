"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

/**
 * Themed replacements for alert() and confirm(). The native dialogs are OS-styled
 * and block the main thread, which looks broken against the rest of the UI.
 */

type ToastVariant = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

const ToastCtx = createContext<(message: string, variant?: ToastVariant) => void>(() => {});
const ConfirmCtx = createContext<(opts: ConfirmOptions) => Promise<boolean>>(async () => false);

export const useToast = () => useContext(ToastCtx);
export const useConfirm = () => useContext(ConfirmCtx);

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: React.ReactNode }> = {
  success: { ring: "border-success/40", icon: <CheckCircle2 className="text-success shrink-0" size={18} /> },
  error: { ring: "border-danger/40", icon: <AlertTriangle className="text-danger shrink-0" size={18} /> },
  info: { ring: "border-accent/40", icon: <Info className="text-accent-bright shrink-0" size={18} /> },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(0);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>(resolve => setConfirmState({ ...opts, resolve }));
  }, []);

  const settle = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  // Stable identities so consumers don't re-render on every toast change.
  const toastValue = useMemo(() => toast, [toast]);
  const confirmValue = useMemo(() => confirm, [confirm]);

  return (
    <ToastCtx.Provider value={toastValue}>
      <ConfirmCtx.Provider value={confirmValue}>
        {children}

        {/* Toasts */}
        <div className="fixed bottom-6 right-6 z-200 flex flex-col gap-3 pointer-events-none" aria-live="polite">
          <AnimatePresence>
            {toasts.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                className={`panel pointer-events-auto flex items-center gap-3 bg-surface-2 ${VARIANT_STYLES[t.variant].ring} rounded-2xl px-5 py-4 shadow-2xl max-w-sm`}
              >
                {VARIANT_STYLES[t.variant].icon}
                <span className="text-sm font-bold text-primary">{t.message}</span>
                <button
                  onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                  aria-label="Dismiss"
                  className="ml-auto text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Confirm dialog */}
        <AnimatePresence>
          {confirmState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
              onClick={() => settle(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.97, y: 6 }}
                onClick={e => e.stopPropagation()}
                className="panel bg-surface rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
              >
                <h2 id="confirm-title" className="text-2xl font-black text-primary tracking-tighter mb-2">
                  {confirmState.title}
                </h2>
                {confirmState.body && <p className="text-muted text-sm mb-8">{confirmState.body}</p>}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => settle(false)}
                    className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-white/5 border border-line text-secondary hover:bg-white/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    autoFocus
                    onClick={() => settle(true)}
                    className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-colors cursor-pointer ${
                      confirmState.destructive
                        ? "bg-danger/90 hover:bg-danger"
                        : "bg-accent-deep hover:bg-accent"
                    }`}
                  >
                    {confirmState.confirmLabel || "Confirm"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}
