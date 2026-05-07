const { sequelize } = require('./src/config/database');

async function rebuild() {
  try {
    console.log('Rebuilding stock from transaction history...\n');
    
    // Get all unique (product_id, warehouse_id) combinations
    const [combinations] = await sequelize.query(`
      SELECT DISTINCT product_id, warehouse_id
      FROM stock_transaction
      ORDER BY product_id, warehouse_id
    `);
    
    for (const combo of combinations) {
      // Get all transactions for this product/warehouse in order
      const [txns] = await sequelize.query(`
        SELECT txn_id, txn_type, quantity
        FROM stock_transaction
        WHERE product_id = ? AND warehouse_id = ?
        ORDER BY txn_id ASC
      `, { replacements: [combo.product_id, combo.warehouse_id] });
      
      let qty = 0;
      for (const txn of txns) {
        if (['IN', 'TRANSFER_IN', 'RETURN'].includes(txn.txn_type)) {
          qty += txn.quantity;
        } else if (['OUT', 'TRANSFER_OUT', 'WRITE_OFF'].includes(txn.txn_type)) {
          qty -= txn.quantity;
        } else if (txn.txn_type === 'ADJUSTMENT') {
          qty = txn.quantity;
        }
      }
      
      // Ensure qty is not negative
      qty = Math.max(0, qty);
      
      // Update or insert stock
      await sequelize.query(`
        INSERT INTO stock (product_id, warehouse_id, qty_on_hand)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE qty_on_hand = ?
      `, { replacements: [combo.product_id, combo.warehouse_id, qty, qty] });
      
      const [product] = await sequelize.query(`SELECT name FROM product WHERE product_id = ?`, 
        { replacements: [combo.product_id] });
      const [warehouse] = await sequelize.query(`SELECT warehouse_name FROM warehouse WHERE warehouse_id = ?`, 
        { replacements: [combo.warehouse_id] });
      
      console.log(`✓ ${product[0]?.name || 'Product ' + combo.product_id} @ ${warehouse[0]?.warehouse_name || 'Warehouse ' + combo.warehouse_id}: ${qty} units`);
    }
    
    console.log('\n✅ Stock rebuilt successfully!');
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

rebuild();
