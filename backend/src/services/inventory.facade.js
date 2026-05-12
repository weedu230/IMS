const reportService = require('./report.service');
const stockRepo = require('../repositories/stock.repository');

class InventoryFacade {
  async getOverview(query = {}) {
    const [dashboard, stockValuation, lowStock, transactions] = await Promise.all([
      reportService.getDashboard(),
      reportService.getStockValuation({ method: query.valuation_method || 'current' }),
      reportService.getLowStockReport(),
      stockRepo.findTransactions({ limit: 10, page: 1 }),
    ]);

    return {
      generated_at: new Date().toISOString(),
      valuation_method: stockValuation.method,
      dashboard,
      stock_valuation: stockValuation,
      low_stock: lowStock,
      recent_transactions: transactions.data || transactions.rows || transactions,
    };
  }
}

module.exports = new InventoryFacade();