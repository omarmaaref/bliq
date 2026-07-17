import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';
export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  code?: string;
};

let nextId = 1;

export function useToasts(dismissAfterMs = 4000) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { ...toast, id }]);
      const t = window.setTimeout(() => dismiss(id), dismissAfterMs);
      timers.current.set(id, t);
    },
    [dismiss, dismissAfterMs],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => window.clearTimeout(t));
      map.clear();
    };
  }, []);

  return { toasts, push, dismiss };
}

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.kind}`}
          onClick={() => onDismiss(toast.id)}
          role="button"
        >
          <div>{toast.message}</div>
          {toast.code && <div className="toast-code">{toast.code}</div>}
        </div>
      ))}
    </div>
  );
}
