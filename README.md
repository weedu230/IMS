# IMS Pro — Inventory Management System
[DBMS-Project-Report-Template-06052026-120106pm.docx](https://github.com/user-attachments/files/27491024/DBMS-Project-Report-Template-06052026-120106pm.docx)


IMS Pro is a full‑stack inventory management application that supports multi‑warehouse stock tracking, purchase order lifecycle, role‑based access, audit logging and reporting.

## Introduction

- **Purpose:** Manage products, warehouses, stock movements and purchase orders with an auditable history.
- **Scope:** Backend (Node.js + Express + Sequelize + MySQL) and Frontend (React) with JWT authentication and role permissions.

## Key Features

- Product / Category management
- Multi‑warehouse stock tracking (`stock` per product per warehouse)
- Stock transactions (`stock_transaction`) with ACID guarantees via stored procedure
- Purchase Order workflow: create → approve → receive (supports partial receives)
- Low‑stock alerts and dashboard KPIs
- Audit logs for important create/update/delete actions
- Employee management & admin password reset

## SS 


https://github.com/user-attachments/assets/9c82b46e-a6b1-4445-9aea-4e702b562c51

<img width="1366" height="768" alt="Screenshot 2026-05-07 221140" src="https://github.com/user-attachments/assets/fe23badd-b117-4bef-b968-bdd4ac96a4a1" />
<img width="1366" height="768" alt="Screenshot 2026-05-07 221123" src="https://github.com/user-attachments/assets/c349aa9b-14bd-4a43-8a27-6c7ba7ec93b7" />
<img width="1366" height="768" alt="Screenshot 2026-05-07 221101" src="https://github.com/user-attachments/assets/d36c81d7-7367-47f1-a468-2a01d55d4fa3" />
<img width="1366" height="768" alt="Screenshot 2026-05-07 221002" src="https://github.com/user-attachments/assets/967aac0b-806f-41e8-9cee-a04d7723a5aa" />
<img width="1366" height="768" alt="Screenshot 2026-05-07 220942" src="https://github.com/user-attachments/assets/59988a47-7db2-442d-bd03-147ae51a3326" />
<img width="326" height="316" alt="a" src="https://github.com/user-attachments/assets/3ceaaa84-7e46-45aa-9167-d15481e07fd7" />


## Tech Stack

- Backend: Node.js, Express, Sequelize
- Database: MySQL 8 (InnoDB)
- Frontend: React, React Router, Tailwind CSS
- Auth: JWT, bcrypt
- Testing: Jest (backend)

## Project Structure (top-level)

```
ims/
  backend/      # Node/Express API, Sequelize models, migrations, stored procedures
  frontend/     # React SPA
  LOGIC.md      # Project logic & workflow (generated)
  REPORT.md     # Project report (generated)
```

## Prerequisites

- Node.js v18+ (recommended)
- MySQL 8
- Git

## Environment setup

Create a `.env` in `backend/` with values similar to:

```bash
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ims_db
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=8h
AUDIT_LOG_ENABLED=true
```

Create a `.env` in `frontend/` if needed to point to the API (example):

```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Running the project (development)

### Backend

```bash
cd ims/backend
npm install
# run migrations/seeds if applicable
node src/server.js    # or npm start
```

### Frontend

```bash
cd ims/frontend
npm install
npm run dev
```

## Database notes

- The project defines `schema.sql` which includes the `RecordStockMovement` stored procedure used to perform ACID stock updates and to prevent negative stock.
- Main tables: `product`, `warehouse`, `stock`, `stock_transaction`, `purchase_order`, `po_item`, `employee`, `audit_log`.

## Testing

- Backend unit tests use Jest. Run from `backend/`:

```bash
cd ims/backend
npm test
```

## Contributing & Deployment

- Add a `.gitignore` entry for secrets and node modules (already present).
- For production, set secure `JWT_SECRET` and configure MySQL access securely.

## Useful Commands

```bash
# Commit changes
git add .
git commit -m "chore: update README"
git push origin main
```

## References

- This project is inspired by common ERP inventory modules (Odoo, NetSuite) and standard inventory management patterns.

---

Generated: May 7, 2026
