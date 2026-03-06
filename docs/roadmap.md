# FleetGuard Product Roadmap

## Product Goal
Evolve the current admin-oriented prototype into a complete fleet rental platform that can run reservation, handover, rental, billing, settlement, return, and exception handling operations end to end without breaking the existing management console design language.

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
- Maintenance work orders
- Damage cases
- Exception queue
- Vehicle Management
- Checklist Management
- Audit Trail
- Reports & Print
- User Management

## Platform Gaps Still Ahead
- Branch and location management
- Transfer workflows
- Approval workflows and stronger permissions
- Notifications and outbound messaging
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

## Phase 3: Maintenance, Damage, and Exceptions
Implemented operational handling for post-return issues:
- maintenance work orders created from maintenance-hold returns
- damage cases created from damage-review returns
- exception queue combining maintenance, damage, and outstanding settlement follow-up
- operational owner and status tracking for each exception type

### Phase 3 Screens
- Maintenance
  - work order list, assignee/vendor editing, workshop status tracking
- Damage Cases
  - case list, insurance state, repair progression, resolution flow
- Exception Queue
  - combined queue for maintenance, damage, and unsettled balances with owner assignment

## Phase 4: Enterprise Operations and Controls
Next phase should harden the platform for larger operations:
- branch and location management
- vehicle transfer workflows
- approval routing for sensitive actions
- stronger role controls and permissions
- notification center and richer compliance workflows

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
- Maintenance-hold returns generate work orders and stay operationally visible
- Damage-review returns generate cases and stay operationally visible
- Outstanding settlements can appear in the exception queue for follow-up
- Existing dashboard, vehicles, checklist, reports, audit, and user modules continue to render correctly

## Design Constraints
- Reuse the current shared `AppUI` patterns
- Preserve the dark sidebar and light operational console layout
- Keep table density, badge language, and modal interactions consistent with the rest of the app
- Avoid introducing a consumer storefront visual style before the consumer-app phase
