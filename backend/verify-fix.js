const { sequelize } = require('./src/config/database');

async function check() {
  try {
    // Check stock for HP laptop
    const [stock] = await sequelize.query(`
      SELECT s.*, p.sku, p.name
      FROM stock s
      JOIN product p ON s.product_id = p.product_id
      WHERE p.sku = '222'
    `);
    
    console.log('\n=== HP LAPTOP (SKU 222) STOCK ===');
    if (stock.length === 0) {
      console.log('No stock rows');
    } else {
      stock.forEach(row => {
        console.log(`Warehouse ${row.warehouse_id}: ${row.qty_on_hand} units`);
      });
    }
    
    // Check if it's still in low stock
    const [lowStock] = await sequelize.query(`
      SELECT p.product_id, p.sku, p.name,
             COALESCE(SUM(s.qty_on_hand),0) AS total_stock,
             p.reorder_level
      FROM product p
      LEFT JOIN stock s ON p.product_id = s.product_id
      WHERE p.sku = '222'
      GROUP BY p.product_id, p.sku, p.name, p.reorder_level
      HAVING total_stock <= p.reorder_level
    `);
    
    console.log('\n=== LOW STOCK STATUS ===');
    if (lowStock.length === 0) {
      console.log('✅ HP Laptop is NO LONGER in low stock!');
    } else {
      console.log('❌ Still in low stock:', JSON.stringify(lowStock, null, 2));
    }
    
    // Show total stock
    const [total] = await sequelize.query(`
      SELECT COALESCE(SUM(qty_on_hand), 0) as total_stock
      FROM stock
      WHERE product_id = 16
    `);
    console.log(`Total stock across all warehouses: ${total[0].total_stock} units`);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sequelize.close();
  }
}

check();
