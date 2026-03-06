# FleetGuard Product Roadmap

## Product Goal
Evolve the current admin-oriented prototype into a complete fleet rental platform that can run reservation, handover, rental, billing, settlement, and return operations end to end without breaking the existing management console design language.

## Current Implemented Modules
- Dashboard
- Bookings
- Customers
- Rentals
- Returns
- Pricing and rate cards
- Invoices and receipts
- Payments and refunds
- Settlement ledger
- Vehicle Management
- Checklist Management
- Audit Trail
- Reports & Print
- User Management

## Platform Gaps Still Ahead
- Preventive maintenance scheduling and work orders
- Damage case management and insurance claims
- Notifications
- Branch and location management
- Pricing automation and promotional rules
- Consumer self-service app

## Phase 1: Rental Core
Implemented foundation modules:
- Bookings
- Customers
- Rentals
- Returns

## Phase 2: Billing, Pricing, and Settlement
Implemented financial completion for rental operations:
- Pricing / rate cards with deposit and tax assumptions
- Booking quote breakdown support through structured pricing data
- Rental financial summary support through structured pricing and deposit state
- Invoice and receipt tracking
- Payment capture flows
- Refund processing flows
- Return-linked settlement ledger

### Phase 2 Screens
- Pricing / Rate Cards
  - list, create/edit modal, quote preview
- Invoices
  - invoice list, detail modal, status badges
- Payments
  - outstanding invoice capture flow, payment log, refund flow
- Settlements
  - settlement ledger, deposit application, refund and due balances

### Phase 2 Contracts
- `RatePlan`
- `Invoice`
- `Payment`
- `Refund`
- `SettlementSummary`

## Phase 3: Maintenance, Damage, and Exceptions
Next phase should convert return outcomes into operational workflows:
- maintenance scheduling
- work orders
- damage cases
- repair and vendor tracking
- exception queue driven by return outcomes and inspections

## Phase 4: Enterprise Operations and Controls
Future enterprise hardening:
- branch and location management
- transfer workflows
- approvals and stronger role controls
- notification center
- richer audit and compliance controls

## Phase 5: Consumer Self-Service App
Future customer-facing experience:
- account login and profile
- vehicle search and booking
- checkout and payment
- booking management and trip self-service
- support and roadside request flows

## Acceptance Criteria
- Staff can create a customer and use that customer in a booking
- Staff can create and confirm a booking, then assign a vehicle
- Staff can convert a confirmed or assigned booking into a rental contract
- Staff can start a rental and track it as active
- Staff can process a return with charge preview and outcome classification
- Booking, rental, invoice, payment, and settlement records stay commercially consistent
- Deposits can move through held, applied, refunded, and partially refunded outcomes
- Existing dashboard, vehicles, checklist, reports, audit, and user modules continue to render correctly

## Design Constraints
- Reuse the current shared `AppUI` patterns
- Preserve the dark sidebar and light operational console layout
- Keep table density, badge language, and modal interactions consistent with the rest of the app
- Avoid introducing a consumer storefront visual style before the consumer-app phase
