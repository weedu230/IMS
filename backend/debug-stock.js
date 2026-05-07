const { sequelize } = require('./src/config/database');

async function check() {
  try {
    // Check all stock rows
    const [all] = await sequelize.query(`SELECT * FROM stock LIMIT 20`);
    console.log('\n=== ALL STOCK ROWS ===');
    if (all.length === 0) {
      console.log('STOCK TABLE IS EMPTY!');
    } else {
      console.log(JSON.stringify(all, null, 2));
    }
    
    // Check the unique constraint
    const [dupes] = await sequelize.query(`
      SELECT product_id, warehouse_id, COUNT(*) as cnt
      FROM stock
      GROUP BY product_id, warehouse_id
      HAVING cnt > 1
    `);
    
    console.log('\n=== DUPLICATE STOCK ENTRIES ===');
    console.log(dupes.length > 0 ? JSON.stringify(dupes, null, 2) : 'None (good)');
    
    // Test the stored procedure manually
    console.log('\n=== TESTING STORED PROCEDURE ===');
    try {
      await sequelize.query(`
        CALL RecordStockMovement(16, 1, 'IN', 100, NULL, 'Test', 1)
      `);
      console.log('Stored procedure executed successfully');
      
      // Check if stock was updated
      const [test] = await sequelize.query(`
        SELECT * FROM stock WHERE product_id = 16 AND warehouse_id = 1
      `);
      console.log('Stock after procedure:', JSON.stringify(test, null, 2));
    } catch (e) {
      console.error('Stored procedure error:', e.message);
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sequelize.close();
  }
}

check();
