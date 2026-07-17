import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { OperatorSelectionModal } from './components/OperatorSelectionModal';

export function App() {
  const [operatorId, setOperatorId] = useState<string | null>(null);

  if (!operatorId) {
    return <OperatorSelectionModal onSelect={setOperatorId} />;
  }

  return (
    <Dashboard
      operatorId={operatorId}
      onSwitchOperator={() => setOperatorId(null)}
    />
  );
}
