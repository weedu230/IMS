const { sequelize } = require('../config/database');
const { AppError }  = require('../middleware/errorHandler');
const { getStockValuationStrategy, listStockValuationStrategies } = require('./stockValuation.strategy');
const ReportQueryBuilder = require('../utils/reportQuery.builder');

class ReportService {

  /**
   * GET /reports/stock-valuation
   * Current inventory value = qty_on_hand × unit_price per product
   */
  async getStockValuation({ method = 'current' } = {}) {
    const strategy = getStockValuationStrategy(method);
    const rows = await strategy.execute();

    const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.total_value || 0), 0);
    return {
      method: strategy.name,
      available_methods: listStockValuationStrategies(),
      rows,
      grand_total: grandTotal.toFixed(2),
    };
  }

  /**
   * GET /reports/stock-movement
   * Transaction summary by type and product for a date range
   */
  async getStockMovement({ from, to, product_id, warehouse_id }) {
    if (!from || !to) throw new AppError('from and to date params are required', 400);

    const builder = new ReportQueryBuilder()
      .dateRange('st.txn_date', from, to)
      .equals('st.product_id', product_id)
      .equals('st.warehouse_id', warehouse_id)
      .group('st.txn_type, p.product_id, p.sku, p.name, w.warehouse_id, w.warehouse_name, DATE(st.txn_date)')
      .order('txn_day DESC, p.name');

    const { clause: filter, params } = builder.buildWhere();

    const [rows] = await sequelize.query(`
      SELECT
        st.txn_type,
        p.sku,
        p.name        AS product_name,
        w.warehouse_name,
        COUNT(*)      AS txn_count,
        SUM(st.quantity) AS total_qty,
        DATE(st.txn_date) AS txn_day
      FROM   stock_transaction st
      JOIN   product   p ON st.product_id   = p.product_id
      JOIN   warehouse w ON st.warehouse_id = w.warehouse_id
      ${filter}
      GROUP  BY st.txn_type, p.product_id, p.sku, p.name, w.warehouse_id, w.warehouse_name, DATE(st.txn_date)
      ORDER  BY txn_day DESC, p.name
    `, { replacements: params });

    return rows;
  }

  /**
   * GET /reports/low-stock
   * Identical to stock alert — also callable as a report endpoint
   */
  async getLowStockReport() {
    const [rows] = await sequelize.query(`
      SELECT
        p.product_id, p.sku, p.name,
        c.category_name,
        COALESCE(SUM(s.qty_on_hand), 0) AS total_stock,
        p.reorder_level,
        p.reorder_qty,
        (p.reorder_level - COALESCE(SUM(s.qty_on_hand), 0)) AS shortage,
        ps_pref.company_name AS preferred_supplier
      FROM   product p
      LEFT   JOIN category c         ON p.category_id  = c.category_id
      LEFT   JOIN stock    s         ON p.product_id   = s.product_id
      LEFT   JOIN product_supplier ps ON p.product_id  = ps.product_id AND ps.is_preferred = 1
      LEFT   JOIN supplier ps_pref   ON ps.supplier_id = ps_pref.supplier_id
      WHERE  p.is_active = 1
      GROUP  BY p.product_id, p.sku, p.name, c.category_name,
                p.reorder_level, p.reorder_qty, ps_pref.company_name
      HAVING total_stock <= p.reorder_level
      ORDER  BY shortage DESC
    `);
    return rows;
  }

  /**
   * GET /reports/purchase-orders
   * PO summary by supplier and status
   */
  async getPurchaseOrderSummary({ from, to }) {
    const params = [];
    let dateFilter = '';
    if (from && to) {
      dateFilter = 'WHERE po.order_date BETWEEN ? AND ?';
      params.push(from, to);
    }

    const [rows] = await sequelize.query(`
      SELECT
        s.supplier_id,
        s.company_name,
        po.status,
        COUNT(po.po_id)            AS po_count,
        SUM(po.total_amount)       AS total_value,
        AVG(DATEDIFF(po.updated_at, po.order_date)) AS avg_days_to_close
      FROM   purchase_order po
      JOIN   supplier s ON po.supplier_id = s.supplier_id
      ${dateFilter}
      GROUP  BY s.supplier_id, s.company_name, po.status
      ORDER  BY s.company_name, po.status
    `, { replacements: params });
    return rows;
  }

  /**
   * GET /reports/sales-summary
   * Revenue and order count by customer
   */
  async getSalesSummary({ from, to }) {
    const params = [];
    let dateFilter = '';
    if (from && to) {
      dateFilter = 'AND co.order_date BETWEEN ? AND ?';
      params.push(from, to);
    }

    const [rows] = await sequelize.query(`
      SELECT
        c.customer_id,
        c.name        AS customer_name,
        COUNT(co.order_id)    AS order_count,
        SUM(co.total_amount)  AS total_revenue,
        AVG(co.total_amount)  AS avg_order_value,
        MAX(co.order_date)    AS last_order_date
      FROM   customer_order co
      JOIN   customer c ON co.customer_id = c.customer_id
      WHERE  co.status NOT IN ('cancelled','returned')
      ${dateFilter}
      GROUP  BY c.customer_id, c.name
      ORDER  BY total_revenue DESC
    `, { replacements: params });
    return rows;
  }

  /**
   * GET /reports/dashboard
   * KPI summary for the dashboard widgets
   */
  async getDashboard() {
    const [[stockVal]]    = await sequelize.query(`SELECT COALESCE(SUM(s.qty_on_hand * p.unit_price),0) AS total_value FROM stock s JOIN product p ON s.product_id=p.product_id WHERE p.is_active=1`);
    const [[lowStock]]    = await sequelize.query(`SELECT COUNT(*) AS count FROM (SELECT p.product_id, p.reorder_level FROM product p LEFT JOIN stock s ON p.product_id=s.product_id WHERE p.is_active=1 GROUP BY p.product_id, p.reorder_level HAVING COALESCE(SUM(s.qty_on_hand),0) <= p.reorder_level) t`);
    const [[pendingPOs]]  = await sequelize.query(`SELECT COUNT(*) AS count FROM purchase_order WHERE status IN ('pending_approval','approved','sent')`);
    const [[activeOrders]]= await sequelize.query(`SELECT COUNT(*) AS count FROM customer_order WHERE status IN ('pending','confirmed','picking','packed')`);
    const [[totalProducts]]= await sequelize.query(`SELECT COUNT(*) AS count FROM product WHERE is_active=1`);
    const [[totalSuppliers]]= await sequelize.query(`SELECT COUNT(*) AS count FROM supplier WHERE is_active=1`);

    // Recent transactions (last 10)
    const [recentTxns] = await sequelize.query(`
      SELECT st.txn_id, st.txn_type, st.quantity, st.txn_date,
             p.name AS product_name, p.sku, w.warehouse_name
      FROM   stock_transaction st
      JOIN   product   p ON st.product_id   = p.product_id
      JOIN   warehouse w ON st.warehouse_id = w.warehouse_id
      ORDER  BY st.txn_date DESC LIMIT 10
    `);

    return {
      kpis: {
        total_inventory_value: parseFloat(stockVal.total_value).toFixed(2),
        low_stock_items:       parseInt(lowStock.count),
        pending_purchase_orders: parseInt(pendingPOs.count),
        active_customer_orders:  parseInt(activeOrders.count),
        total_active_products:   parseInt(totalProducts.count),
        total_active_suppliers:  parseInt(totalSuppliers.count),
      },
      recent_transactions: recentTxns,
    };
  }
}

module.exports = new ReportService();
