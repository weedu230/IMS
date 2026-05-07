const { sequelize } = require('./src/config/database');

async function check() {
  try {
    const [warehouses] = await sequelize.query(`SELECT * FROM warehouse`);
    console.log('\n=== WAREHOUSES ===');
    console.log(JSON.stringify(warehouses, null, 2));
    
    const [products] = await sequelize.query(`SELECT product_id, name, sku FROM product WHERE product_id = 16`);
    console.log('\n=== PRODUCT 16 ===');
    console.log(JSON.stringify(products, null, 2));
    
    // Try the procedure with more debug output
    console.log('\n=== RUNNING PROCEDURE WITH VARIABLES ===');
    await sequelize.query(`
      SET @p_product_id = 16;
      SET @p_warehouse_id = 1;
      SET @p_txn_type = 'IN';
      SET @p_quantity = 500;
      
      SELECT 'Before' as Step, COUNT(*) as StockRows FROM stock WHERE product_id = 16;
      CALL RecordStockMovement(16, 1, 'IN', 500, NULL, 'Bhai Test', 1);
      SELECT 'After' as Step, COUNT(*) as StockRows FROM stock WHERE product_id = 16;
      SELECT * FROM stock WHERE product_id = 16;
    `);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sequelize.close();
  }
}

check();
