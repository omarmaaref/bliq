export interface Vehicle {
  id: string;
  name: string;
  connectivityStatus: 'online' | 'offline';
  assignedOperatorId: string | null;
}
