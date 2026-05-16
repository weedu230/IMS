const logger = require('./logger');
const { domainEvents, DOMAIN_EVENTS } = require('./domainEvents');
const notificationService = require('../services/notification.service');
const { publishStockUpdate } = require('./stockStreamHub');

const registerDomainEventListeners = () => {
  domainEvents.removeAllListeners(DOMAIN_EVENTS.STOCK_CHANGED);
  domainEvents.removeAllListeners(DOMAIN_EVENTS.STOCK_LOW);
  domainEvents.removeAllListeners(DOMAIN_EVENTS.PURCHASE_ORDER_CREATED);
  domainEvents.removeAllListeners(DOMAIN_EVENTS.PURCHASE_ORDER_STATUS_CHANGED);

  domainEvents.on(DOMAIN_EVENTS.STOCK_CHANGED, (payload) => {
    logger.info(
      `[event] stock changed product=${payload.product_id} warehouse=${payload.warehouse_id} qty=${payload.quantity}`
    );
    publishStockUpdate({ event: DOMAIN_EVENTS.STOCK_CHANGED, payload, generated_at: new Date().toISOString() });
    notificationService.notifyAdmins(
      'Stock Updated',
      `Stock changed for product ${payload.product_id} in warehouse ${payload.warehouse_id} (${payload.txn_type}).`,
      payload
    ).catch((err) => logger.error(`[notification] stock change notify failed: ${err.message}`));
  });

  domainEvents.on(DOMAIN_EVENTS.STOCK_LOW, (payload) => {
    logger.warn(
      `[event] low stock product=${payload.product_id} total=${payload.total_stock} threshold=${payload.reorder_level}`
    );
    publishStockUpdate({ event: DOMAIN_EVENTS.STOCK_LOW, payload, generated_at: new Date().toISOString() });
    notificationService.notifyAdmins(
      'Low Stock Alert',
      `Product ${payload.product_id} is below reorder level. Total stock: ${payload.total_stock}.`,
      payload
    ).catch((err) => logger.error(`[notification] low stock notify failed: ${err.message}`));
  });

  domainEvents.on(DOMAIN_EVENTS.PURCHASE_ORDER_CREATED, (payload) => {
    logger.info(`[event] purchase order created po=${payload.po_id} supplier=${payload.supplier_id}`);
    publishStockUpdate({ event: DOMAIN_EVENTS.PURCHASE_ORDER_CREATED, payload, generated_at: new Date().toISOString() });
    notificationService.notifyAdmins(
      'Purchase Order Created',
      `Purchase order ${payload.po_id} has been created for supplier ${payload.supplier_id}.`,
      payload
    ).catch((err) => logger.error(`[notification] PO created notify failed: ${err.message}`));
  });

  domainEvents.on(DOMAIN_EVENTS.PURCHASE_ORDER_STATUS_CHANGED, (payload) => {
    logger.info(`[event] purchase order status changed po=${payload.po_id} status=${payload.status}`);
    publishStockUpdate({ event: DOMAIN_EVENTS.PURCHASE_ORDER_STATUS_CHANGED, payload, generated_at: new Date().toISOString() });
    notificationService.notifyAdmins(
      'Purchase Order Status Changed',
      `Purchase order ${payload.po_id} status changed to ${payload.status}.`,
      payload
    ).catch((err) => logger.error(`[notification] PO status notify failed: ${err.message}`));
  });
};

module.exports = { registerDomainEventListeners };