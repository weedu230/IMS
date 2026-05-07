# 📊 IMS - Complete Business Logic & Workflow
**Using HP Laptop (SKU 222) as Example**

---

## 🎯 PART 1: SYSTEM OVERVIEW

### What is this system?
An **Inventory Management System** that tracks:
- **Products** (what you buy/sell)
- **Stock** (how much you have, where, and when to reorder)
- **Suppliers** (who you buy from)
- **Purchase Orders** (orders to suppliers when stock is low)
- **Customer Orders** (orders from customers)
- **Audit Logs** (who changed what, when, for compliance)

---

## 📦 PART 2: HP LAPTOP WORKFLOW (Complete Journey)

### Initial Setup (Admin does this once):

```
HP Laptop Details:
├─ SKU: 222
├─ Name: hp laptop
├─ Category: Laptops
├─ Unit Price: Rs. 150,000
├─ Reorder Level: 10 units (minimum we keep)
├─ Reorder Quantity: 50 units (how many to order at once)
└─ Preferred Supplier: Dell Supplier (example)
```

---

## 🔄 WORKFLOW STAGES: HP Laptop from Start to Finish

### STAGE 1️⃣: NORMAL OPERATION (Stock is OK)
```
Initial Stock: 50 units in Main Warehouse

┌─────────────────────────────────────────┐
│  STOCK PAGE > "Levels" TAB              │
│  ┌─────────────────────────────────────┐
│  │ SKU: 222                            │
│  │ Product: hp laptop                  │
│  │ Total Stock: 50 units               │
│  │ Reorder At: 10 units                │
│  │ Status: ✅ OK (green)                │
│  └─────────────────────────────────────┘
└─────────────────────────────────────────┘

WHO DOES WHAT?
├─ Admin: Monitors dashboard (can see KPIs)
├─ Manager: Can place orders (customer orders)
├─ Staff: Can fulfill orders, adjust stock
└─ Viewer: Can only see reports
```

**What happens at this stage:**
- ✅ Customers order HP laptops
- ✅ Staff fulfills from available stock
- ✅ Stock decreases as orders are fulfilled
- ✅ No urgent action needed

---

### STAGE 2️⃣: LOW STOCK ALERT ⚠️
```
Stock drops to 8 units (below reorder level of 10)

┌─────────────────────────────────────────┐
│  STOCK PAGE > "Low Stock" TAB            │
│  (RED BADGE with count appears!)        │
│  ┌─────────────────────────────────────┐
│  │ SKU: 222                            │
│  │ Product: hp laptop                  │
│  │ In Stock: 8 units ❌ RED            │
│  │ Min Level: 10                       │
│  │ Shortage: -2 (need 2 more)          │
│  │ Order Qty: 50                       │
│  │ Supplier: Dell Supplier             │
│  └─────────────────────────────────────┘
└─────────────────────────────────────────┘

DASHBOARD also shows:
├─ Low Stock Items: 1
├─ Reorder needed: 50 units of hp laptop
└─ Action required by Manager/Admin
```

**Who gets notified?**
- ✅ Admin (sees on dashboard)
- ✅ Manager (sees on Low Stock tab)
- ✅ Staff (can see if they check)

---

### STAGE 3️⃣: CREATE PURCHASE ORDER (Manager does this)
```
Manager says: "I need to reorder HP laptops"

STEP 1: Go to "Purchase Orders" page
STEP 2: Click "+ Create New"
STEP 3: Fill form:
  ├─ Supplier: Select "Dell Supplier"
  ├─ Expected Delivery: 7 days from now
  ├─ Add Item:
  │  ├─ Product: hp laptop
  │  ├─ Warehouse: Main Warehouse
  │  ├─ Qty Ordered: 50 units
  │  └─ Unit Cost: Rs. 120,000
  └─ Notes: "Reorder due to low stock"

Result:
┌─────────────────────────────────────┐
│ PURCHASE ORDER Created!             │
├─────────────────────────────────────┤
│ PO #2                               │
│ Supplier: Dell Supplier             │
│ Status: 🔵 PENDING (blue)           │
│ Items: 50 × hp laptop               │
│ Total: Rs. 6,000,000                │
│ Order Date: 2026-05-07              │
│ Expected: 2026-05-14                │
└─────────────────────────────────────┘

🔍 AUDIT LOG recorded:
├─ User: Manager (e.g., sara@ims.local)
├─ Action: Created Purchase Order
├─ Table: purchase_order
├─ Time: 2026-05-07 10:30 AM
└─ Status: INSERT (new record)
```

**WHO CAN DO THIS?** 
- ✅ Admin
- ✅ Manager
- ❌ Staff (read-only)
- ❌ Viewer (read-only)

---

### STAGE 4️⃣: APPROVE PURCHASE ORDER (Manager/Admin does this)
```
Manager checks the PO and approves it

STEP 1: Go to Purchase Orders > Find PO #2
STEP 2: Click "✓ Approve"

Result:
┌─────────────────────────────────────┐
│ PO #2 Status Changes:               │
│ 🔵 PENDING → 🟢 APPROVED            │
├─────────────────────────────────────┤
│ Now officially sent to supplier     │
│ Supplier knows they must deliver    │
└─────────────────────────────────────┘

🔍 AUDIT LOG recorded:
├─ User: Manager
├─ Action: Updated Purchase Order
├─ Field Changed: status
├─ Old Value: PENDING
├─ New Value: APPROVED
├─ Time: 2026-05-07 11:00 AM
└─ Changed At: audit_log
```

---

### STAGE 5️⃣: GOODS RECEIVED (Staff does this) 🚚
```
Days pass... Supplier delivers the HP laptops!
Staff receives the shipment at warehouse

STEP 1: Go to Purchase Orders > Find PO #2
STEP 2: Click "📦 Receive Goods"
STEP 3: Mark items as received:
  ├─ Item: 50 × hp laptop
  ├─ Qty Received: 50 (match order)
  └─ Check "Confirm Receipt"
STEP 4: Click "✓ Record Receipt"

AUTOMATIC ACTIONS HAPPEN:
┌───────────────────────────────────────────┐
│ 1. Stock updated automatically            │
├───────────────────────────────────────────┤
│    BEFORE: 8 units                        │
│    → Goods IN: +50 units                  │
│    → AFTER: 58 units ✅                   │
├───────────────────────────────────────────┤
│ 2. Transaction recorded:                  │
│    ├─ Type: "IN" (inventory increase)     │
│    ├─ Product: hp laptop                  │
│    ├─ Warehouse: Main Warehouse           │
│    ├─ Qty: 50                             │
│    ├─ Ref: PO #2                          │
│    └─ Notes: "Goods receipt for PO #2"    │
├───────────────────────────────────────────┤
│ 3. PO Status Updated:                     │
│    🟢 APPROVED → 🟣 RECEIVED              │
├───────────────────────────────────────────┤
│ 4. Audit Log Created:                     │
│    ├─ User: Staff member                  │
│    ├─ Action: Updated PO status           │
│    ├─ New Status: RECEIVED                │
│    └─ Time: 2026-05-14 09:30 AM           │
└───────────────────────────────────────────┘

🔍 AUDIT LOGS (multiple entries):
├─ PO Item Updated (qty_received: 0 → 50)
├─ Stock Transaction Created (IN +50)
├─ Stock Level Updated (8 → 58)
└─ Purchase Order Status Updated (APPROVED → RECEIVED)
```

**WHO CAN DO THIS?**
- ✅ Admin
- ✅ Manager  
- ✅ Staff (warehouse workers)
- ❌ Viewer

---

### STAGE 6️⃣: BACK TO NORMAL OPERATION ✅
```
Now stock is healthy again!

┌─────────────────────────────────────────┐
│  STOCK PAGE > "Levels" TAB              │
│  ┌─────────────────────────────────────┐
│  │ SKU: 222                            │
│  │ Product: hp laptop                  │
│  │ Total Stock: 58 units               │
│  │ Reorder At: 10 units                │
│  │ Status: ✅ OK (green)                │
│  └─────────────────────────────────────┘
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  DASHBOARD (Low Stock Tab)              │
│  HP Laptop no longer appears ✅         │
│  (Only shows products below reorder)    │
└─────────────────────────────────────────┘

Customers can order again!
Stock available: 58 units
```

---

## 📋 PART 3: WHAT HAPPENS AT EACH STAGE

### Complete Decision Flow:

```
┌─────────────────────────────────────────────────────────────┐
│                  STOCK MONITORING                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
            Is Stock <= Reorder Level?
                    ↙              ↘
                 YES                NO
                  ↓                 ↓
        ┌─────────────────┐   ┌──────────────┐
        │ ALERT! Low      │   │ ✅ All Good  │
        │ Stock Alert     │   │ Continue     │
        │ Shows in:       │   │ Operations   │
        │ • Dashboard     │   └──────────────┘
        │ • Low Stock Tab │
        │ • Red Badge     │
        └────────┬────────┘
                 ↓
    Manager: Create Purchase Order?
                 ↓ YES
        ┌─────────────────────────────┐
        │ Create PO to Supplier       │
        │ Status: PENDING             │
        │ Awaiting approval           │
        └────────┬────────────────────┘
                 ↓
    Manager/Admin: Approve PO?
                 ↓ YES
        ┌─────────────────────────────┐
        │ PO Approved                 │
        │ Status: APPROVED            │
        │ Sent to supplier            │
        └────────┬────────────────────┘
                 ↓
         Supplier Delivers Goods
                 ↓
    Staff: Receive Goods at Warehouse?
                 ↓ YES
        ┌─────────────────────────────┐
        │ AUTOMATIC:                  │
        │ • Stock Updated (+50)       │
        │ • Transaction Recorded      │
        │ • PO Status: RECEIVED       │
        │ • Audit Log Created         │
        └────────┬────────────────────┘
                 ↓
    ✅ Back to normal operation
    Stock is now sufficient again
```

---

## 👥 PART 4: WHO DOES WHAT (Roles & Permissions)

### ADMIN
```
Can Do:
  ✅ Create/Edit/Delete Products
  ✅ Create/Edit/Delete Suppliers
  ✅ View Dashboard (KPIs)
  ✅ View Audit Logs (who did what)
  ✅ Reset Employee Passwords
  ✅ Create/Approve/Cancel Purchase Orders
  ✅ Receive Goods at Warehouse
  ✅ Adjust Stock Manually
  ✅ View Reports

Example: Admin monitors overall system health via Dashboard
```

### MANAGER
```
Can Do:
  ✅ Create/Approve Purchase Orders
  ✅ View Stock Levels
  ✅ View Low Stock Alerts
  ✅ Receive Goods (approve receipt)
  ✅ Create Customer Orders
  ✅ View Reports
  ✅ View Audit Logs (limited)
  ❌ Cannot reset passwords
  ❌ Cannot delete products/suppliers

Example: Manager sees HP laptop stock is low,
         creates PO for 50 units from supplier
```

### STAFF
```
Can Do:
  ✅ View Stock Levels
  ✅ View Low Stock Alerts
  ✅ Receive Goods (warehouse worker)
  ✅ Manually Adjust Stock (+ / -)
  ✅ Create Customer Orders
  ✅ Fulfill Customer Orders
  ❌ Cannot Approve Orders
  ❌ Cannot Create Purchase Orders
  ❌ Cannot Edit Products

Example: Staff receives HP laptops from supplier,
         marks them as received in system
```

### VIEWER
```
Can Do:
  ✅ View Stock Levels (read-only)
  ✅ View Reports
  ✅ View Low Stock Alerts
  ✅ View Audit Logs
  ❌ Cannot modify anything
  ❌ Cannot create orders

Example: Manager wants to check historical reports
```

---

## 🔄 PART 5: KEY PROCESSES EXPLAINED

### Process 1: How Reorder Works

```
TRIGGER: Stock drops to or below reorder_level

HP Laptop Example:
├─ Reorder Level: 10 units
├─ Current Stock: 8 units
├─ Status: ⚠️ NEEDS REORDER

Actions:
1. System calculates shortage: 10 - 8 = 2 units needed
2. Suggests ordering Reorder Qty: 50 units
3. Shows "Low Stock" tab with red badge
4. Shows on Dashboard

Manager does:
1. Goes to Purchase Orders
2. Creates new PO for 50 units
3. Selects "Dell Supplier"
4. Specifies expected delivery date
5. Submits for approval

Admin approves:
1. Reviews the order
2. Clicks "Approve"
3. PO is sent to supplier

Supplier delivers:
1. Sends 50 units to warehouse

Staff receives:
1. Counts/verifies units
2. Marks as received in system
3. Stock automatically updated: 8 + 50 = 58 units

Result: Back to normal operation ✅
```

### Process 2: How Receive Works

```
TRIGGER: Goods arrive at warehouse from supplier

Step 1: Staff receives physical goods
        └─ Counts boxes
        └─ Verifies quantity: 50 units match PO

Step 2: Staff goes to "Purchase Orders" > PO #2
        └─ Clicks "📦 Receive Goods"
        └─ Confirms: 50 units received

Step 3: System automatically does:
        ├─ Updates stock table:
        │  └─ INSERT INTO stock
        │     (product_id=16, warehouse_id=1, qty_on_hand=58)
        │
        ├─ Creates transaction record:
        │  └─ INSERT INTO stock_transaction
        │     (txn_type='IN', quantity=50, ref_id=2)
        │
        ├─ Updates PO status:
        │  └─ status = 'RECEIVED'
        │
        └─ Creates audit log:
           └─ INSERT INTO audit_log
              (action='UPDATE', changed_by=staff_emp_id)

Step 4: Staff sees success message
        ✅ "Goods received successfully"
        
Step 5: System is updated
        ├─ Stock: 58 units available
        ├─ No longer in Low Stock
        ├─ PO marked as complete
        └─ History recorded for compliance

Step 6: If partial receive:
        └─ PO status = 'PARTIALLY_RECEIVED'
        └─ Can receive rest later
```

### Process 3: How Stock Adjustments Work

```
SCENARIO 1: Stock was damaged/broken
├─ Staff adjusts stock downward
├─ Goes to Stock > Adjust Stock
├─ Transaction Type: OUT (or WRITE_OFF)
├─ Quantity: 5 units (damaged)
├─ Notes: "5 units damaged in handling"
└─ Result: Stock decreased by 5

SCENARIO 2: Inventory count shows extra stock
├─ Staff adjusts stock upward
├─ Goes to Stock > Adjust Stock
├─ Transaction Type: IN (or ADJUSTMENT)
├─ Quantity: 10 units
├─ Notes: "Physical count adjustment"
└─ Result: Stock increased by 10

SCENARIO 3: Stock Transfer between warehouses
├─ From Main Warehouse: 20 units
├─ To North Distribution: 20 units
├─ Goes to Stock > Transfer
├─ Result:
│  ├─ Main Warehouse: 58 - 20 = 38 units
│  └─ North Distribution: 0 + 20 = 20 units
```

---

## 🔐 PART 6: AUDIT & COMPLIANCE

### What gets logged?

Every important action creates an audit log entry:

```
HP Laptop Example Timeline:

2026-05-07 10:00 AM
├─ Admin creates product "hp laptop"
├─ Audit: INSERT product
│         product_id=16, name="hp laptop", reorder_level=10

2026-05-07 10:30 AM
├─ Manager creates Purchase Order
├─ Audit: INSERT purchase_order
│         po_id=2, supplier_id=1, status="PENDING"

2026-05-07 11:00 AM
├─ Manager approves Purchase Order
├─ Audit: UPDATE purchase_order
│         po_id=2, status: PENDING → APPROVED

2026-05-14 09:30 AM
├─ Staff receives goods
├─ Audit: UPDATE po_item
│         qty_received: 0 → 50
├─ Audit: INSERT stock_transaction
│         type="IN", quantity=50
├─ Audit: UPDATE stock
│         qty_on_hand: 8 → 58
└─ Audit: UPDATE purchase_order
           status: APPROVED → RECEIVED

Who can see?
├─ Admins: Can see ALL audit logs
├─ Managers: Can see relevant logs
├─ Staff: Limited audit view
└─ Viewers: Read-only audit logs
```

---

## 📊 PART 7: EXAMPLE DASHBOARD DATA

### For HP Laptop, you'd see:

```
DASHBOARD > Low Stock Items
┌────────────────────────────────┐
│ When Stock = 8 (below 10):    │
├────────────────────────────────┤
│ ⚠️ Low Stock Items: 1          │
│   └─ hp laptop (8/10)          │
│   └─ Shortage: -2              │
│   └─ Reorder: 50 units         │
│   └─ Est. Cost: Rs. 6,000,000  │
└────────────────────────────────┘

STOCK METRICS
├─ Total Inventory Value: Rs. 8,700,000
├─ Stock Turnover: 2.3x per month
├─ Avg Days in Stock: 13 days
└─ On-Order Value: Rs. 6,000,000 (PO #2)

PO SUMMARY
├─ Pending Orders: 0
├─ Approved Orders: 1 (PO #2)
├─ Received Orders: 5
└─ Total Ordered Value: Rs. 25,000,000
```

---

## 🎯 PART 8: DECISION TREE - What Happens When?

```
EVERY DAY (Automated):
├─ System calculates stock levels
├─ Checks: stock <= reorder_level?
├─ If YES:
│  └─ Product appears in "Low Stock" tab ⚠️
│  └─ Admin sees alert on Dashboard
│  └─ Manager is notified (Low Stock badge)
└─ If NO:
   └─ Normal operations continue ✅

WHEN MANAGER CREATES PO:
├─ PO status = PENDING
├─ Awaits approval
├─ Supplier not yet notified

WHEN ADMIN APPROVES PO:
├─ PO status = APPROVED
├─ Officially sent to supplier
├─ Supplier must deliver within expected_date

WHEN GOODS ARRIVE:
├─ Staff goes to warehouse
├─ Receives physical goods
├─ Marks as received in system

WHEN STAFF MARKS AS RECEIVED:
├─ AUTOMATIC: Stock updated
├─ AUTOMATIC: Transaction recorded
├─ AUTOMATIC: PO marked RECEIVED
├─ AUTOMATIC: Audit log created
├─ Result: Item no longer in Low Stock ✅

IF PARTIAL RECEIVE (e.g., only 30 of 50):
├─ PO status = PARTIALLY_RECEIVED
├─ Can receive remaining later
├─ Stock updated for what was received
```

---

## 🚀 SUMMARY

### HP Laptop Complete Cycle:

```
START: 50 units in stock
  ↓ (Customers buy)
LOW STOCK: 8 units (below reorder level of 10) ⚠️
  ↓ (Manager creates PO)
PENDING: Purchase Order #2 created 🔵
  ↓ (Admin approves)
APPROVED: PO sent to supplier 🟢
  ↓ (Supplier delivers)
DELIVERY: 50 units arrive at warehouse
  ↓ (Staff receives in system)
RECEIVED: Stock updated to 58 units, PO complete 🟣
  ↓ (Back to normal)
NORMAL: 58 units available for customer orders ✅

Total Time: ~7-14 days (depending on supplier lead time)
Audit Trail: All actions logged and traceable
Stock Accuracy: 100% (via stored procedure ACID transactions)
```

---

## 📝 NOTES FOR DEVELOPMENT

### Key Technical Details:

1. **Stock Updates**: Uses MySQL stored procedure for ACID compliance
2. **Audit Trail**: Every change logged with user, timestamp, old/new values
3. **Partial Receives**: Supported (multiple receives for same PO)
4. **Multiple Warehouses**: Each warehouse tracks separately
5. **Negative Stock Guard**: System prevents stock from going negative
6. **Automatic Calculations**: Shortage = reorder_level - current_stock

### API Endpoints Used:

```
GET  /api/v1/stock                    # Get all stock levels
GET  /api/v1/stock/alerts/low-stock   # Get low stock items
POST /api/v1/purchase-orders          # Create PO
PUT  /api/v1/purchase-orders/:id/receive  # Receive goods
POST /api/v1/stock/adjust             # Adjust stock manually
GET  /api/v1/audit-logs               # View audit trail
```

---

**Created**: May 7, 2026
**Purpose**: Complete IMS Logic Documentation
**Example**: HP Laptop (SKU 222)
**Status**: ✅ System Fully Operational
