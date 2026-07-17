import type { Toast } from '../hooks/useToasts';

type Props = {
  toasts: Toast[];
  onDismiss: (id: number) => void;
};

export function Toasts({ toasts, onDismiss }: Props) {
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
