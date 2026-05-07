const { sequelize } = require('./src/config/database');

async function fix() {
  try {
    console.log('Dropping old RecordStockMovement procedure...');
    await sequelize.query(`DROP PROCEDURE IF EXISTS RecordStockMovement`);
    
    console.log('Creating fixed RecordStockMovement procedure...');
    await sequelize.query(`
      CREATE PROCEDURE RecordStockMovement(
          IN p_product_id   INT,
          IN p_warehouse_id INT,
          IN p_txn_type     VARCHAR(20),
          IN p_quantity     INT,
          IN p_ref_id       INT,
          IN p_notes        TEXT,
          IN p_created_by   INT
      )
      BEGIN
          DECLARE v_current_qty INT DEFAULT 0;
          DECLARE v_new_qty     INT DEFAULT 0;
          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
              ROLLBACK;
              RESIGNAL;
          END;

          START TRANSACTION;

          -- Get current qty (or 0 if no row)
          SELECT COALESCE(qty_on_hand, 0) INTO v_current_qty
          FROM stock
          WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

          -- Calculate new quantity
          SET v_new_qty = CASE
              WHEN p_txn_type IN ('IN', 'TRANSFER_IN', 'RETURN')  THEN v_current_qty + p_quantity
              WHEN p_txn_type IN ('OUT','TRANSFER_OUT','WRITE_OFF') THEN v_current_qty - p_quantity
              WHEN p_txn_type = 'ADJUSTMENT'                       THEN p_quantity
              ELSE v_current_qty
          END;

          -- Guard: prevent negative stock
          IF v_new_qty < 0 THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Insufficient stock: transaction would result in negative quantity';
          END IF;

          -- Record the transaction first
          INSERT INTO stock_transaction
              (product_id, warehouse_id, txn_type, quantity, ref_id, notes, created_by)
          VALUES
              (p_product_id, p_warehouse_id, p_txn_type, p_quantity, p_ref_id, p_notes, p_created_by);

          -- Upsert stock: INSERT if not exists, UPDATE if exists
          INSERT INTO stock (product_id, warehouse_id, qty_on_hand, last_updated)
          VALUES (p_product_id, p_warehouse_id, v_new_qty, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE
              qty_on_hand = v_new_qty,
              last_updated = CURRENT_TIMESTAMP;

          COMMIT;
      END
    `);
    
    console.log('✅ Procedure fixed!');
    
    // Test it
    console.log('\nTesting the fixed procedure...');
    await sequelize.query(`CALL RecordStockMovement(16, 1, 'IN', 100, NULL, 'Fix Test', 1)`);
    
    const [result] = await sequelize.query(`SELECT * FROM stock WHERE product_id = 16 AND warehouse_id = 1`);
    if (result.length > 0) {
      console.log('✅ FIXED! Stock row now exists:');
      console.log(JSON.stringify(result[0], null, 2));
    } else {
      console.log('❌ Still broken');
    }
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fix();
