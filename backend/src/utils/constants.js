/**
 * Application-wide constants.
 * Centralised here so a change in one place ripples everywhere.
 */

// ─── RBAC Roles (matches Employee.role column) ─────────────────────────────────
const ROLES = Object.freeze({
  ADMIN:   'admin',
  MANAGER: 'manager',
  STAFF:   'staff',
  VIEWER:  'viewer',
});

// ─── Purchase Order statuses ───────────────────────────────────────────────────
const PO_STATUS = Object.freeze({
  DRAFT:              'draft',
  PENDING_APPROVAL:   'pending_approval',
  APPROVED:           'approved',
  SENT:               'sent',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED:           'received',
  CANCELLED:          'cancelled',
});

// ─── Customer Order statuses ───────────────────────────────────────────────────
const ORDER_STATUS = Object.freeze({
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  PICKING:    'picking',
  PACKED:     'packed',
  DISPATCHED: 'dispatched',
  FULFILLED:  'fulfilled',
  CANCELLED:  'cancelled',
  RETURNED:   'returned',
});

// ─── Stock Transaction types ───────────────────────────────────────────────────
const TXN_TYPE = Object.freeze({
  IN:           'IN',        // Goods receipt
  OUT:          'OUT',       // Order fulfillment / dispatch
  TRANSFER_OUT: 'TRANSFER_OUT', // Leaving source warehouse
  TRANSFER_IN:  'TRANSFER_IN',  // Arriving at destination warehouse
  ADJUSTMENT:   'ADJUSTMENT',   // Manual stock adjustment
  RETURN:       'RETURN',    // Customer return
  WRITE_OFF:    'WRITE_OFF', // Damaged / expired
});

// ─── Pagination defaults ───────────────────────────────────────────────────────
const PAGINATION = Object.freeze({
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     100,
});

module.exports = { ROLES, PO_STATUS, ORDER_STATUS, TXN_TYPE, PAGINATION };
