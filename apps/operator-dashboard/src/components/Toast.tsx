import { useEffect } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export type ToastState = {
  kind: ToastKind;
  message: string;
  code?: string;
};

type Props = {
  toast: ToastState | null;
  onDismiss: () => void;
};

export function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div className={`toast ${toast.kind}`}>
      <div>{toast.message}</div>
      {toast.code && <div className="toast-code">{toast.code}</div>}
    </div>
  );
}
