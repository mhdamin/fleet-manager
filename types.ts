export type ViewState =
  | 'dashboard'
  | 'bookings'
  | 'rentals'
  | 'returns'
  | 'customers'
  | 'vehicles'
  | 'checklist'
  | 'audit'
  | 'reports'
  | 'users';

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

export type BookingStatus = 'Draft' | 'Confirmed' | 'Assigned' | 'Cancelled' | 'Checked Out' | 'Completed';

export type RentalStatus = 'Reserved' | 'Active' | 'Overdue' | 'Closed';

export type ReturnOutcome = 'Clean Close' | 'Charges Applied' | 'Damage Review Required' | 'Maintenance Hold';

export type VehicleOperationalStatus = 'available' | 'reserved' | 'rented' | 'maintenance' | 'inspection_hold';

export interface Customer {
  id: string;
  customerNumber: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  identityStatus: 'Verified' | 'Pending' | 'Flagged';
  notes: string;
  status: 'Active' | 'Watchlist' | 'Inactive';
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  dropoffDateTime: string;
  vehicleClass: string;
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  estimatedTotal: number;
  depositAmount: number;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
}

export interface RentalContract {
  id: string;
  rentalNumber: string;
  bookingId: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleClass: string;
  pickupDateTime: string;
  expectedReturnDateTime: string;
  actualReturnDateTime?: string;
  odometerOut: number;
  odometerIn?: number;
  fuelOut: string;
  fuelIn?: string;
  depositAmount: number;
  addOns: string[];
  status: RentalStatus;
  createdAt: string;
  notes?: string;
}

export interface ReturnAssessment {
  id: string;
  returnNumber: string;
  rentalId: string;
  rentalNumber: string;
  bookingNumber: string;
  customerName: string;
  vehiclePlate: string;
  odometerIn: number;
  fuelIn: string;
  checklistId?: string;
  damageFlag: boolean;
  maintenanceFlag: boolean;
  lateHours: number;
  baseCharges: number;
  extraCharges: number;
  totalCharges: number;
  outcome: ReturnOutcome;
  submittedAt: string;
  notes?: string;
}

// Checklist Data Structure
export interface InspectionPoint {
  id: number;
  x: number;
  y: number;
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
