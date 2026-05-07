const { sequelize } = require('./src/config/database');

async function check() {
  try {
    const [before] = await sequelize.query(`
      SELECT COUNT(*) as cnt FROM stock WHERE product_id = 16
    `);
    console.log('\n=== BEFORE PROCEDURE ===');
    console.log('Stock rows for product 16:', before[0].cnt);
    
    console.log('\n=== RUNNING PROCEDURE ===');
    try {
      await sequelize.query(`CALL RecordStockMovement(16, 1, 'IN', 500, NULL, 'Test', 1)`);
      console.log('Procedure executed');
    } catch (err) {
      console.error('Procedure error:', err.message);
      throw err;
    }
    
    const [after] = await sequelize.query(`
      SELECT COUNT(*) as cnt FROM stock WHERE product_id = 16
    `);
    console.log('\n=== AFTER PROCEDURE ===');
    console.log('Stock rows for product 16:', after[0].cnt);
    
    const [rows] = await sequelize.query(`
      SELECT * FROM stock WHERE product_id = 16
    `);
    if (rows.length === 0) {
      console.log('❌ NO STOCK ROWS CREATED!');
    } else {
      console.log('✅ Stock rows:', JSON.stringify(rows, null, 2));
    }
    
    // Check the transactions
    const [txns] = await sequelize.query(`
      SELECT * FROM stock_transaction WHERE product_id = 16 ORDER BY txn_id DESC LIMIT 5
    `);
    console.log('\n=== RECENT TRANSACTIONS ===');
    console.log(JSON.stringify(txns, null, 2));
    
  } catch (e) {
    console.error('Fatal error:', e.message);
  } finally {
    await sequelize.close();
  }
}

check();
