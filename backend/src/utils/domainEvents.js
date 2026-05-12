const { EventEmitter } = require('events');

const domainEvents = new EventEmitter();
domainEvents.setMaxListeners(50);

const DOMAIN_EVENTS = Object.freeze({
  STOCK_CHANGED: 'stock:changed',
  STOCK_LOW: 'stock:low',
  PURCHASE_ORDER_CREATED: 'purchase-order:created',
  PURCHASE_ORDER_STATUS_CHANGED: 'purchase-order:status-changed',
});

module.exports = { domainEvents, DOMAIN_EVENTS };