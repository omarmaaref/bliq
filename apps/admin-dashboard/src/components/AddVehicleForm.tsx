import { useState, type FormEvent } from 'react';

type Props = {
  onCreate: (name: string) => Promise<void>;
};

export function AddVehicleForm({ onCreate }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onCreate(trimmed);
      setName('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <h3>Add vehicle</h3>
      <form className="form-row" onSubmit={submit}>
        <div>
          <label htmlFor="new-vehicle-name">Name</label>
          <input
            id="new-vehicle-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rover-05"
            disabled={busy}
          />
        </div>
        <button type="submit" disabled={busy || name.trim().length === 0}>
          {busy ? 'Adding…' : 'Add vehicle'}
        </button>
      </form>
    </div>
  );
}
