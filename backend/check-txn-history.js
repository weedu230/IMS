const { sequelize } = require('./src/config/database');

async function check() {
  try {
    // Get all transactions for product 16
    const [txns] = await sequelize.query(`
      SELECT txn_id, txn_type, quantity, txn_date, notes
      FROM stock_transaction
      WHERE product_id = 16
      ORDER BY txn_id ASC
    `);
    
    console.log('\n=== ALL TRANSACTIONS FOR HP LAPTOP (PRODUCT 16) ===');
    let total = 0;
    txns.forEach(t => {
      if (['IN', 'TRANSFER_IN', 'RETURN'].includes(t.txn_type)) {
        total += t.quantity;
      } else if (['OUT', 'TRANSFER_OUT', 'WRITE_OFF'].includes(t.txn_type)) {
        total -= t.quantity;
      } else if (t.txn_type === 'ADJUSTMENT') {
        total = t.quantity;
      }
      console.log(`TXN #${t.txn_id}: ${t.txn_type.padEnd(15)} ${t.quantity.toString().padStart(6)} units | ${t.notes}`);
    });
    
    console.log(`\nExpected total based on transactions: ${total} units`);
    
    const [stock] = await sequelize.query(`
      SELECT COALESCE(SUM(qty_on_hand), 0) as actual_total
      FROM stock
      WHERE product_id = 16
    `);
    
    console.log(`Actual stock in database: ${stock[0].actual_total} units`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sequelize.close();
  }
}

check();
