const { sequelize } = require('../config/database');

class StockValuationStrategy {
  constructor(name, sqlBuilder) {
    this.name = name;
    this.sqlBuilder = sqlBuilder;
  }

  async execute() {
    const { sql, replacements = [] } = this.sqlBuilder();
    const [rows] = await sequelize.query(sql, { replacements });
    return rows;
  }
}

const currentValueStrategy = new StockValuationStrategy('current', () => ({
  sql: `
    SELECT
      p.product_id,
      p.sku,
      p.name,
      c.category_name,
      p.unit_price,
      COALESCE(SUM(s.qty_on_hand), 0)               AS total_qty,
      COALESCE(SUM(s.qty_on_hand), 0) * p.unit_price AS total_value
    FROM   product p
    LEFT   JOIN category c ON p.category_id = c.category_id
    LEFT   JOIN stock    s ON p.product_id  = s.product_id
    WHERE  p.is_active = 1
    GROUP  BY p.product_id, p.sku, p.name, c.category_name, p.unit_price
    ORDER  BY total_value DESC
  `,
}));

const categorySummaryStrategy = new StockValuationStrategy('category', () => ({
  sql: `
    SELECT
      c.category_id,
      c.category_name,
      COUNT(DISTINCT p.product_id) AS product_count,
      COALESCE(SUM(s.qty_on_hand), 0) AS total_qty,
      COALESCE(SUM(s.qty_on_hand * p.unit_price), 0) AS total_value
    FROM   category c
    LEFT   JOIN product p ON p.category_id = c.category_id AND p.is_active = 1
    LEFT   JOIN stock s ON s.product_id = p.product_id
    GROUP  BY c.category_id, c.category_name
    ORDER  BY total_value DESC
  `,
}));

const STRATEGIES = new Map([
  [currentValueStrategy.name, currentValueStrategy],
  [categorySummaryStrategy.name, categorySummaryStrategy],
]);

const getStockValuationStrategy = (method = 'current') => {
  return STRATEGIES.get(String(method || 'current').toLowerCase()) || currentValueStrategy;
};

const listStockValuationStrategies = () => Array.from(STRATEGIES.keys());

module.exports = {
  StockValuationStrategy,
  getStockValuationStrategy,
  listStockValuationStrategies,
};