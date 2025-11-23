export type ViewState = 'dashboard' | 'vehicles' | 'checklist' | 'audit' | 'reports' | 'users';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  plate: string;
  status: 'Available' | 'Rented' | 'Maintenance';
  lastService: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'Operator';
  department: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
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
  status?: 'Normal' | 'Abnormal' | 'N/A' | 'Not Inspected';
  notes?: string;
}

export interface ChecklistData {
  vehicleId: string;
  plate: string;
  makeModel: string;
  odometer: string;
  fuelLevel: string;
  type: string; // 'pickup', 'return', etc.
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