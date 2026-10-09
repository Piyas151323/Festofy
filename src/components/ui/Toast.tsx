import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
};

const borderStyles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-[#121b16]',
  error: 'border-red-500/30 bg-[#1e1315]',
  warning: 'border-amber-500/30 bg-[#1e1913]',
  info: 'border-blue-500/30 bg-[#131924]',
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const item: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev.slice(-4), item]);

      if (duration > 0) {
        const timer = window.setTimeout(() => {
          dismiss(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast('success', message, title),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast('error', message, title, 5500),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast('info', message, title),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast('warning', message, title),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismiss }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="false"
            className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role={t.type === 'error' ? 'alert' : 'status'}
                className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 text-[#f4f5f7] ${borderStyles[t.type]}`}
              >
                <div className="mt-0.5">{icons[t.type]}</div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  {t.title && (
                    <div className="font-heading text-xs font-bold text-white truncate">
                      {t.title}
                    </div>
                  )}
                  <div className="text-xs text-[#8a91a6] leading-relaxed break-words">
                    {t.message}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss toast"
                  className="text-[#656c80] hover:text-[#f4f5f7] p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
