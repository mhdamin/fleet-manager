# FleetGuard Rental Core Roadmap

## Product Goal
Evolve the current admin-oriented prototype into a complete fleet rental platform that can run reservation, handover, rental, and return operations end to end without breaking the existing management console design language.

## Current Implemented Modules
- Dashboard
- Vehicle Management
- Checklist Management
- Audit Trail
- Reports & Print
- User Management

## Missing Modules
- Bookings
- Customers
- Rentals
- Returns
- Billing and payments
- Maintenance and work orders
- Damage and claims
- Notifications
- Branch and location management
- Pricing and rate cards
- Consumer self-service app

## Phase 1 Scope
Phase 1 adds the rental core required to operate the business lifecycle inside the existing console:
- Bookings
- Customers
- Rentals
- Returns

## Phase 1 Screens
- Booking list with search, status tabs, create flow, detail modal, confirm/cancel actions, and vehicle assignment
- Customer list with search, create/edit flow, account detail view, and rental history summary
- Rental list with search, create-from-booking flow, start action, and extension flow
- Return list with settlement preview, return submission, and disposition outcome tracking

## Required Backend Contracts
### Bookings
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `POST /api/bookings`
- `PUT /api/bookings/:id`
- `POST /api/bookings/:id/confirm`
- `POST /api/bookings/:id/cancel`
- `POST /api/bookings/:id/assign-vehicle`

### Customers
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `GET /api/customers/search?q=`
- `GET /api/customers/:id/history-summary`

### Rentals
- `GET /api/rentals`
- `GET /api/rentals/:id`
- `POST /api/rentals`
- `POST /api/rentals/:id/start`
- `POST /api/rentals/:id/extend`
- `POST /api/rentals/:id/close`

### Returns
- `POST /api/returns/quote`
- `GET /api/returns`
- `POST /api/returns`
- `POST /api/returns/:id/finalize`

## Deferred Phases
- Billing, invoicing, and refunds
- Payment gateway integration
- Preventive maintenance scheduling and work orders
- Damage case management and insurance claims
- Notification center and outbound messaging
- Branch/location transfer flows
- Customer-facing booking and self-service app

## Acceptance Criteria
- Staff can create a customer and use that customer in a booking
- Staff can create and confirm a booking, then assign a vehicle
- Staff can convert a confirmed or assigned booking into a rental contract
- Staff can start a rental and track it as active
- Staff can process a return with charge preview and outcome classification
- Vehicle disposition changes after return according to clean close, charges, damage review, or maintenance hold
- Existing dashboard, vehicles, checklist, reports, audit, and user modules continue to render correctly

## Design Constraints
- Reuse the current shared `AppUI` patterns
- Preserve the dark sidebar and light operational console layout
- Keep table density, badge language, and modal interactions consistent with the rest of the app
- Avoid introducing a consumer storefront visual style in this phase
