const { sequelize } = require('./src/config/database');

async function check() {
  try {
    // Check raw stock table
    const [stock] = await sequelize.query(`
      SELECT s.*, p.sku, p.name 
      FROM stock s
      JOIN product p ON s.product_id = p.product_id
      WHERE p.sku = '222'
    `);
    
    console.log('\n=== RAW STOCK DATA (SKU 222) ===');
    console.log(JSON.stringify(stock, null, 2));
    
    // Check stock transaction history
    const [txn] = await sequelize.query(`
      SELECT txn_id, product_id, warehouse_id, txn_type, quantity, txn_date
      FROM stock_transaction
      WHERE product_id = (SELECT product_id FROM product WHERE sku = '222')
      ORDER BY txn_id DESC LIMIT 10
    `);
    
    console.log('\n=== RECENT TRANSACTIONS (SKU 222) ===');
    console.log(JSON.stringify(txn, null, 2));
    
    // Check low stock query result
    const [lowStock] = await sequelize.query(`
      SELECT p.product_id, p.sku, p.name,
             COALESCE(SUM(s.qty_on_hand),0) AS total_stock,
             p.reorder_level,
             (p.reorder_level - COALESCE(SUM(s.qty_on_hand),0)) AS shortage
      FROM product p
      LEFT JOIN stock s ON p.product_id = s.product_id
      WHERE p.sku = '222'
      GROUP BY p.product_id, p.sku, p.name, p.reorder_level
      HAVING total_stock <= p.reorder_level
    `);
    
    console.log('\n=== LOW STOCK QUERY RESULT ===');
    if (lowStock.length === 0) {
      console.log('✗ NOT in low stock (query returned no rows)');
    } else {
      console.log(JSON.stringify(lowStock, null, 2));
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sequelize.close();
  }
}

check();
