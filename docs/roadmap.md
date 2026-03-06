# FleetGuard Product Roadmap

## Product Goal
Evolve the current admin-oriented prototype into a complete fleet rental platform that can run reservation, handover, rental, billing, settlement, return, enterprise control, and customer self-service operations end to end without breaking the existing management console design language.

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
- Branches and locations
- Vehicle transfers
- Approvals
- Notification center
- Customer portal
- Vehicle Management
- Checklist Management
- Audit Trail
- Reports & Print
- User Management

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

## Phase 4: Enterprise Operations and Controls
Implemented enterprise administration and oversight capabilities:
- branch and location directory
- vehicle transfer workflow between branches
- approval queue for sensitive actions
- notification center spanning operations, finance, and customer updates

### Phase 4 Screens
- Branches
  - distributed branch overview, local manager ownership, branch fleet counts
- Transfers
  - inter-branch request flow, transit tracking, completion actions
- Approvals
  - pending approval review, approver assignment, approve/reject decisions
- Notifications
  - multi-channel alert list with read state tracking

## Phase 5: Consumer Self-Service App
Implemented a customer-facing portal on the same system data:
- customer profile selector for portal preview
- active rate-plan search and browsing
- booking and trip summary for the selected customer
- customer invoice visibility and balance review

### Phase 5 Screens
- Customer Portal
  - search and browse available rate plans
  - review upcoming trips and booking history
  - review invoices and outstanding balances

## Acceptance Criteria
- Staff can create a customer and use that customer in a booking
- Staff can create and confirm a booking, then assign a vehicle
- Staff can convert a confirmed or assigned booking into a rental contract
- Staff can start a rental and track it as active
- Staff can process a return with charge preview and outcome classification
- Booking, rental, invoice, payment, settlement, maintenance, and damage records stay operationally connected
- Branch transfers can be created and moved through request, transit, and completion states
- Approval requests can be reviewed and decided
- Notifications surface enterprise and customer-facing updates in one place
- Customers can browse rates, review trips, and review billing data from the portal
- Existing dashboard, vehicles, checklist, reports, audit, and user modules continue to render correctly

## Design Constraints
- Reuse the current shared `AppUI` patterns for all admin modules
- Preserve the dark sidebar and light operational console layout for enterprise features
- Keep table density, badge language, and modal interactions consistent with the rest of the console
- Let the customer portal feel distinct through a lighter self-service layout while still sharing the same data model and codebase
