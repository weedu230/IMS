# IMS Pro — Project Report

## Report Metadata
- **Project Title:** IMS Pro (Inventory Management System)
- **Document Type:** Project Report
- **Version:** Updated
- **Generated:** May 17, 2026

## 1. Abstract
IMS Pro is a full-stack inventory management system for small-to-medium businesses. It supports multi-warehouse stock tracking, purchase-order lifecycle management, role-based access control, audit logging, and reporting dashboards. The solution is implemented with Node.js/Express + Sequelize/MySQL on the backend and React on the frontend.

## 2. Introduction
### 2.1 Background
Inventory operations require reliable stock visibility, controlled purchase flow, and traceable updates. IMS Pro addresses these needs with centralized product, warehouse, stock, and transaction management.

### 2.2 Objectives
- Maintain accurate, auditable inventory records.
- Support PO lifecycle: create → approve → receive.
- Enable role-based operations (Admin, Manager, Staff, Viewer).
- Provide reporting and low-stock visibility for decision-making.

### 2.3 Reference Template
[Updated-SDA-LAB-MANUAL-SPR-2026-14052026-090546am.docx](https://github.com/user-attachments/files/27898688/Updated-SDA-LAB-MANUAL-SPR-2026-14052026-090546am.docx)

## 3. System Overview
### 3.1 Key Features
- Product/category management
- Multi-warehouse stock tracking
- Stock transactions (`IN`, `OUT`, `ADJUSTMENT`, `TRANSFER`)
- Purchase order workflow with partial receiving
- Audit logging for critical operations
- Dashboard and low-stock alerts

### 3.2 User Roles
- **Admin:** Full access and master-data control
- **Manager:** PO approvals and reports
- **Staff:** Receiving, stock updates, fulfillment actions
- **Viewer:** Read-only operational visibility

## 4. Architecture and Design
### 4.1 Client–Server–Database Flow
- React client sends HTTP requests to Express REST APIs.
- Backend validates and executes business logic through service/repository layers.
- MySQL stores normalized data and enforces consistency.

### 4.2 Database Technology
- **DBMS:** MySQL 8.0 (InnoDB)
- **Reasoning:** Relational design fits product/warehouse/order entities; transaction support ensures consistency.

### 4.3 Core Tables
- `product`, `category`
- `warehouse`, `stock`, `stock_transaction`
- `purchase_order`, `po_item`
- `employee`, `audit_log`

### 4.4 ER Diagram
```mermaid
erDiagram
  PRODUCT ||--o{ STOCK : has
  WAREHOUSE ||--o{ STOCK : stores
  PRODUCT ||--o{ PO_ITEM : ordered_in
  PURCHASE_ORDER ||--o{ PO_ITEM : contains
  WAREHOUSE ||--o{ PO_ITEM : destination
  PRODUCT ||--o{ STOCK_TRANSACTION : transacts
  WAREHOUSE ||--o{ STOCK_TRANSACTION : records
  EMPLOYEE ||--o{ STOCK_TRANSACTION : creates
  EMPLOYEE ||--o{ PURCHASE_ORDER : creates
  EMPLOYEE ||--o{ AUDIT_LOG : changes
```

### 4.5 Sequence: Receive Purchase Order
```mermaid
sequenceDiagram
  participant C as Client (React)
  participant S as Server (Express)
  participant DB as MySQL

  C->>S: PUT /purchase-orders/:id/receive { items }
  S->>DB: START TRANSACTION
  S->>DB: Record stock movement for each item
  S->>DB: UPDATE po_item qty_received
  S->>DB: UPDATE purchase_order status
  S->>DB: COMMIT
  S-->>C: 200 OK
```

## 5. Implementation Summary
### 5.1 Technology Stack
- **Backend:** Node.js, Express, Sequelize, MySQL
- **Frontend:** React, react-router
- **Security/Auth:** JWT, bcrypt
- **Logging:** Winston
- **Testing:** Jest

### 5.2 Implemented Functionalities
- Product CRUD and validation
- Stock aggregation and low-stock detection
- Purchase order lifecycle with partial receives
- Audit logging for create/update/delete
- Report and analytics endpoints

## 6. Screenshots / Evidence
> All previously provided README images are retained below.

![System Screenshot 1](https://github.com/user-attachments/assets/9c82b46e-a6b1-4445-9aea-4e702b562c51)

<img width="1366" height="768" alt="Screenshot 2026-05-07 221140" src="https://github.com/user-attachments/assets/fe23badd-b117-4bef-b968-bdd4ac96a4a1" />
<img width="1366" height="768" alt="Screenshot 2026-05-07 221123" src="https://github.com/user-attachments/assets/c349aa9b-14bd-4a43-8a27-6c7ba7ec93b7" />
<img width="1366" height="768" alt="Screenshot 2026-05-07 221101" src="https://github.com/user-attachments/assets/d36c81d7-7367-47f1-a468-2a01d55d4fa3" />
<img width="1366" height="768" alt="Screenshot 2026-05-07 221002" src="https://github.com/user-attachments/assets/967aac0b-806f-41e8-9cee-a04d7723a5aa" />
<img width="1366" height="768" alt="Screenshot 2026-05-07 220942" src="https://github.com/user-attachments/assets/59988a47-7db2-442d-bd03-147ae51a3326" />
<img width="326" height="316" alt="a" src="https://github.com/user-attachments/assets/3ceaaa84-7e46-45aa-9167-d15481e07fd7" />

## 7. Testing and Validation
### 7.1 Approach
- UI workflow checks (PO create → approve → receive)
- Backend service-level tests with Jest
- DB-level validation of transaction and stock consistency

### 7.2 Representative Cases
- Full receive updates stock correctly
- Partial receive updates PO state correctly
- Validation prevents invalid operations
- Audit logs capture critical changes

## 8. Conclusion
IMS Pro delivers a practical inventory solution with traceability, multi-warehouse support, and role-aware operations. The architecture is modular and extendable for future additions like notifications, automated reconciliation, and advanced forecasting.

## 9. References
- Project source: `/backend` and `/frontend`
- Common ERP/IMS workflow concepts

---
Generated: May 17, 2026
