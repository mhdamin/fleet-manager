export type ViewState =
  | 'dashboard'
  | 'bookings'
  | 'rentals'
  | 'returns'
  | 'customers'
  | 'pricing'
  | 'invoices'
  | 'payments'
  | 'settlements'
  | 'maintenance'
  | 'damage'
  | 'exceptions'
  | 'branches'
  | 'transfers'
  | 'approvals'
  | 'notifications'
  | 'portal'
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
export type DepositStatus = 'Held' | 'Applied' | 'Partially Refunded' | 'Refunded';
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Refunded';
export type PaymentStatus = 'Pending' | 'Captured' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Card' | 'Bank Transfer' | 'Cash' | 'Corporate Credit';
export type WorkOrderStatus = 'Open' | 'In Progress' | 'Waiting Parts' | 'Completed';
export type DamageCaseStatus = 'Open' | 'Review' | 'Repairing' | 'Resolved';
export type ExceptionStatus = 'Open' | 'Assigned' | 'Resolved';
export type ExceptionType = 'Maintenance' | 'Damage' | 'Settlement';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type TransferStatus = 'Requested' | 'In Transit' | 'Completed';
export type NotificationStatus = 'Unread' | 'Read';

export interface PricingBreakdown {
  ratePlanId?: string;
  baseRate: number;
  rentalDays: number;
  addOnTotal: number;
  discountTotal: number;
  taxTotal: number;
  estimatedTotal: number;
}

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
  pricingBreakdown: PricingBreakdown;
  depositStatus: DepositStatus;
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
  depositStatus: DepositStatus;
  pricingBreakdown: PricingBreakdown;
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
  settlementId?: string;
  outcome: ReturnOutcome;
  submittedAt: string;
  notes?: string;
}

export interface RatePlan {
  id: string;
  name: string;
  vehicleClass: string;
  dailyRate: number;
  includedMileagePerDay: number;
  depositAmount: number;
  taxRate: number;
  active: boolean;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  label: string;
  amount: number;
  category: 'Rental' | 'Deposit' | 'Add-on' | 'Tax' | 'Penalty' | 'Refund';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId?: string;
  rentalId?: string;
  settlementId?: string;
  customerName: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  issuedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentType: 'Deposit' | 'Invoice' | 'Settlement';
  createdAt: string;
}

export interface Refund {
  id: string;
  refundNumber: string;
  invoiceId?: string;
  settlementId?: string;
  customerName: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Processed';
  createdAt: string;
}

export interface SettlementSummary {
  id: string;
  settlementNumber: string;
  rentalId: string;
  returnId: string;
  customerName: string;
  vehiclePlate: string;
  depositHeld: number;
  depositApplied: number;
  depositRefunded: number;
  returnCharges: number;
  invoiceId: string;
  refundId?: string;
  amountDue: number;
  amountRefundable: number;
  status: 'Open' | 'Settled' | 'Refunded';
  createdAt: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  workOrderNumber: string;
  rentalId: string;
  returnId: string;
  vehiclePlate: string;
  issueSummary: string;
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  vendor?: string;
  estimatedCost: number;
  status: WorkOrderStatus;
  createdAt: string;
}

export interface DamageCase {
  id: string;
  caseNumber: string;
  rentalId: string;
  returnId: string;
  vehiclePlate: string;
  customerName: string;
  description: string;
  severity: 'Minor' | 'Moderate' | 'Major';
  estimatedRepairCost: number;
  insuranceStatus: 'Unsubmitted' | 'Submitted' | 'Approved';
  status: DamageCaseStatus;
  createdAt: string;
}

export interface OperationalException {
  id: string;
  referenceNumber: string;
  type: ExceptionType;
  linkedId: string;
  vehiclePlate: string;
  customerName?: string;
  summary: string;
  owner: string;
  status: ExceptionStatus;
  createdAt: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  manager: string;
  vehicleCount: number;
  active: boolean;
}

export interface TransferRequest {
  id: string;
  requestNumber: string;
  vehiclePlate: string;
  fromBranch: string;
  toBranch: string;
  requestedBy: string;
  status: TransferStatus;
  eta: string;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  approvalNumber: string;
  category: 'Refund' | 'Transfer' | 'Override';
  requester: string;
  summary: string;
  approver: string;
  status: ApprovalStatus;
  createdAt: string;
}

export interface NotificationEvent {
  id: string;
  title: string;
  body: string;
  channel: 'Operations' | 'Finance' | 'Customer';
  status: NotificationStatus;
  createdAt: string;
}

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
