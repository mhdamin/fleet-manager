export type ViewState = 'dashboard' | 'vehicles' | 'checklist' | 'audit' | 'reports' | 'users';

// Vehicle type matching backend VehicleResponseDTO
export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  manufacturer: string;
  year: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

// Vehicle statistics matching backend VehicleStatsDTO
export interface VehicleStats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
}

// Activity log matching backend VehicleChangeLogResponseDTO
export interface Activity {
  id: string;
  checklistId: string;
  changeType: string;
  oldVehiclePlate: string | null;
  newVehiclePlate: string | null;
  reason: string;
  timestamp: string;
  staffName: string;
}

export interface User {
  id: number;
  username: string;
  roles: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ip: string;
  status: 'Success' | 'Warning' | 'Critical';
}

// Checklist Data Structure
export interface InspectionPoint {
  id: number;
  x: number;
  y: number; // Percentage positions
  label: string;
  position?: string; // Position description (e.g., "Hood", "Left Front Door")
  status?: 'Normal' | 'Abnormal' | 'N/A' | 'Not Inspected';
  notes?: string;
}

export interface ChecklistData {
  vehicleId: string;
  plate: string;
  makeModel: string;
  odometer: string;
  fuelLevel: string;
  type: string;
  exteriorPoints: InspectionPoint[];
  interior: {
    dashboard: string;
    seats: string;
    carpets: string;
    windows: string;
    electronics: string;
    safety: string;
  };
  signature: {
    customerName: string;
    inspectorName: string;
    date: string;
    signed: boolean;
  };
}