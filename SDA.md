# Software Design & Architecture (SDA) - IMS Project

## 1. Purpose
Yeh document project ke current software architecture, design patterns, aur SDA syllabus concepts ka evidence-based mapping deta hai.

## 2. Current Architecture (Implemented)

### 2.1 Layered Architecture
Project mein clear layered flow implement hai:

- Routes layer: request path mapping and middleware guards
- Controller layer: HTTP handling and response shaping
- Service layer: business logic and workflow rules
- Repository layer: data access abstraction
- Model layer: Sequelize entities and associations

Typical request flow:

`Route -> Controller -> Service -> Repository -> Model/DB`

### 2.2 MVC (Web App)
Backend MVC-ish pattern follow karta hai:

- Model: `backend/src/models/*`
- Controller: `backend/src/controllers/*`
- View: API JSON responses (frontend alag React app mein)

Frontend React SPA bhi component-driven presentation layer provide karti hai.

## 3. Design Patterns Status

### 3.1 Confirmed / Strongly Implemented

1. Repository Pattern
- `BaseRepository` shared CRUD/pagination/audit helpers
- Domain repositories inherit and specialize queries

2. Layered Service Pattern (Service-Repository separation)
- Services encapsulate workflows, validation, transaction orchestration

3. Factory-style Middleware (lightweight)
- `authorize(...roles)` returns a role-guard middleware function

4. Strategy Pattern
- `stockValuation.strategy.js` provides selectable valuation/report strategies
- `report.routes.js` forwards `method` query params to the strategy layer

5. Command Pattern
- Inventory actions are wrapped as command objects in `commands/inventory.commands.js`
- `stock.service.js` now behaves as a command invoker

6. Observer Pattern
- `domainEvents.js` centralises domain events
- `registerDomainEventListeners.js` subscribes to stock and purchase-order events

7. Factory Method / Factory-style creation
- `notification/notification.factory.js` creates channel-specific notifier instances
- Supported channels are `email`, `sms`, `push`, and optional `whatsapp`

8. Builder Pattern
- `reportQuery.builder.js` builds SQL filter clauses fluently
- Report services now compose conditions through a reusable builder

9. Adapter Pattern
- `productImport.adapter.js` normalizes external import rows into internal product payloads
- Product import preview/import endpoints use the adapter before persistence

### 3.2 Partial / Implicit

1. Facade-like orchestration
- Major workflows are coordinated by services, but a single unified facade for cross-module operations is still missing

2. Builder-like construction
- There are structured payloads and SQL queries, but no formal builder abstraction yet

3. Adapter-like integration boundary
- External system integration is not present, so a true adapter layer has not been needed yet

### 3.3 Not Explicitly Implemented (as GoF structures)

- Formal Factory Method classes
- Decorator / Chain of Responsibility as named reusable abstractions

## 4. Reverse Engineering & Dynamic UML (Newly Added)

A new reverse-engineering feature has been added to generate UML dynamically.

### 4.1 What was added

1. Backend endpoint:
- `GET /api/v1/architecture/uml?type=all|class|er`
- Role access: `admin`, `manager`

2. Frontend page:
- Route: `/architecture-uml`
- Sidebar menu item: `Reverse UML`
- Auto-refresh every 20 seconds + manual refresh button
- Renders Mermaid diagrams live

### 4.2 Dynamic update behavior

- Class diagram is generated from Sequelize model metadata and associations.
- ER diagram is generated from current database schema (`INFORMATION_SCHEMA`).
- Is liye model/schema changes ke baad refresh par diagram update ho jata hai.

## 5. SDA Syllabus Mapping (High-Level)

### Week 1-3: Architecture, OOD, UML, Mapping Design to Code
Status: Implemented (with current layered architecture + model relationships + dynamic UML page)

### Week 4: Functional design / UI design / Web app design
Status: Implemented (separate frontend, modular pages, role-based routes)

### Week 5: Persistence layer design
Status: Implemented (Sequelize models, repositories, SQL procedures, transactions)

### Week 6-8: Creational / Structural / Behavioral patterns
Status: Partially implemented
- Strong: Repository
- Partial: Factory-style middleware, command-like service actions
- Missing as formal reusable abstractions: multiple classic GoF patterns

### Week 11: Interactive systems with MVC architecture
Status: Implemented (backend MVC-ish + interactive React frontend)

### Week 12-16: Architectural issues, styles, quality tactics, documentation, evaluation
Status: Partially implemented
- Present: security middleware, logging, rate limiting, validation, error handling, testing
- Can be improved: formal ADRs, quality attribute scenarios, architecture evaluation templates, explicit facade layer, richer event processing, real-time views

### Model-driven development (week 17)
Status: Partially implemented via dynamic UML generation, but no full model-to-code/code-to-model pipeline.

## 5. Important Missing IMS / SDA Concepts

These are the most important gaps if the goal is a more enterprise-grade inventory system:

1. Batch / lot / serial tracking
2. Bin / location-level warehouse stock
3. Stock valuation methods beyond current-value reporting
4. Multi-level approval workflow
5. Import/export for bulk product and stock data
6. Reconciliation between physical and system stock
7. Real-time updates for live inventory changes
8. Notification subsystem for low stock and approvals
9. External integration adapters for scanners, accounting, or supplier systems
10. Formal architecture decision records and quality-attribute docs

## 6. Enterprise Inventory Features Added

1. Bin/location-level stock tracking via `stock.bin_location`.
2. Transaction traceability via `stock_transaction.batch_no` and `stock_transaction.serial_no`.
3. Stored-procedure backed upsert logic that preserves bin-aware stock rows.
4. UI support in stock views for bin and trace information.

## 7. Implementation Roadmap

1. Complete facade layer for cross-module workflows.
2. Add command objects for purchase-order lifecycle actions.
3. Add adapter helpers for import/export and external payloads.
4. Add enterprise inventory fields like batch, serial, and bin tracking.
5. Add real-time stock updates and notification delivery.
6. Document architecture decisions and quality scenarios.

## 8. Quality Attributes Currently Visible

- Security: JWT auth, RBAC, helmet, CORS, rate limit
- Modifiability: layered boundaries, repository abstraction
- Maintainability: shared response and error handling utilities
- Reliability: validation and DB transaction usage in critical flows
- Observability: logging + audit trail

## 9. Recommended Next Improvements (for stronger SDA coverage)

1. Add explicit Strategy pattern for pricing/reorder/fulfillment policies.
2. Add explicit Command pattern with command objects and command history.
3. Add Observer/EventBus for domain events (PO approved, stock low, order fulfilled).
4. Add Architecture Decision Records (ADRs).
5. Add one architecture evaluation checklist (ATAM-lite) in docs.
6. Add auto refresh trigger from DB migration hooks for UML view.

## 10. Conclusion
Project architecture ka foundation strong hai (layered + repository + service orchestration). Course-aligned documentation and dynamic UML reverse engineering ab included hai, lekin pure GoF pattern coverage ke liye explicit abstractions abhi aur add kiye ja sakte hain.
