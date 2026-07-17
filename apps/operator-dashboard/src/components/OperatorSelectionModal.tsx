import { useEffect, useState } from 'react';
import { api } from '../api';
import { ApiError, type Operator } from '../types';

type Props = {
  onSelect: (operatorId: string) => void;
};

export function OperatorSelectionModal({ onSelect }: Props) {
  const [operators, setOperators] = useState<Operator[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listOperators()
      .then((list) => {
        if (cancelled) return;
        setOperators(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : 'Failed to load operators');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Sign in as operator</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: 0 }}>
          Pick who you are to open the dashboard.
        </p>

        {error && <div className="state error">{error}</div>}

        {!error && operators === null && <div className="state">Loading operators…</div>}

        {!error && operators && operators.length === 0 && (
          <div className="state">
            No operators seeded. Start the backend once so the seed runs.
          </div>
        )}

        {!error && operators && operators.length > 0 && (
          <>
            <label htmlFor="operator-select">Operator</label>
            <select
              id="operator-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button
                className="primary"
                onClick={() => onSelect(selectedId)}
                disabled={!selectedId}
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
