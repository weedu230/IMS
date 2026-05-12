const PDFDocument = require('pdfkit');
const reportService = require('./report.service');

class PDFService {
  static _normalizeRows(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.rows)) return result.rows;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  }

  /**
   * Generate PDF for Stock Valuation Report
   */
  static async generateStockValuationPDF(stream) {
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Stock Valuation Report', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Get data
    const data = await reportService.getStockValuation();
    const rows = PDFService._normalizeRows(data);
    const grandTotal = Number(data?.grand_total ?? 0);

    // Summary
    doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Total Inventory Value');
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#6366f1').text(`PKR ${grandTotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    doc.moveDown();

    // Table headers
    doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
    const tableTop = doc.y;
    const col1 = 40, col2 = 120, col3 = 200, col4 = 260, col5 = 320, col6 = 380;

    doc.text('SKU', col1, tableTop);
    doc.text('Product', col2, tableTop);
    doc.text('Category', col3, tableTop);
    doc.text('Qty', col4, tableTop);
    doc.text('Unit Price', col5, tableTop);
    doc.text('Total Value', col6, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(520, tableTop + 15).stroke();
    doc.moveDown();

    // Table rows
    doc.font('Helvetica').fontSize(9).fillColor('#333');
    rows.forEach((row) => {
      const y = doc.y;
      if (y > 700) {
        doc.addPage();
        doc.y = 40;
      }
      doc.text(row.sku, col1, doc.y, { width: 70 });
      doc.text(row.name.substring(0, 20), col2, y, { width: 70 });
      doc.text(row.category_name || '-', col3, y, { width: 50 });
      doc.text(row.total_qty.toString(), col4, y, { width: 50, align: 'right' });
      doc.text(`PKR ${parseFloat(row.unit_price).toFixed(2)}`, col5, y, { width: 50, align: 'right' });
      doc.text(`PKR ${parseFloat(row.total_value).toFixed(2)}`, col6, y, { width: 80, align: 'right' });
      doc.moveDown();
    });

    doc.end();
  }

  /**
   * Generate PDF for Low Stock Report
   */
  static async generateLowStockPDF(stream) {
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Low Stock Alert Report', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Get data
    const data = await reportService.getLowStockReport();
    const items = PDFService._normalizeRows(data);

    doc.fontSize(11).fillColor('#d32f2f').font('Helvetica-Bold').text(`⚠️  ${items.length} product(s) below reorder level`);
    doc.moveDown();

    // Table headers
    doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
    const tableTop = doc.y;
    const col1 = 40, col2 = 120, col3 = 200, col4 = 260, col5 = 320, col6 = 380;

    doc.text('SKU', col1, tableTop);
    doc.text('Product', col2, tableTop);
    doc.text('Stock', col4, tableTop);
    doc.text('Min Level', col5, tableTop);
    doc.text('Shortage', col6, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(520, tableTop + 15).stroke();
    doc.moveDown();

    // Table rows
    doc.font('Helvetica').fontSize(9).fillColor('#333');
    items.forEach((row) => {
      const y = doc.y;
      if (y > 700) {
        doc.addPage();
        doc.y = 40;
      }
      doc.text(row.sku, col1, doc.y, { width: 70 });
      doc.text(row.name.substring(0, 20), col2, y, { width: 70 });
      doc.text(row.total_stock.toString(), col4, y, { width: 50, align: 'right' });
      doc.text(row.reorder_level.toString(), col5, y, { width: 50, align: 'right' });
      doc.fillColor('#d32f2f').text(`-${row.shortage}`, col6, y, { width: 80, align: 'right' });
      doc.fillColor('#333');
      doc.moveDown();
    });

    doc.end();
  }

  /**
   * Generate PDF for Stock Movement Report
   */
  static async generateStockMovementPDF(stream, query) {
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Stock Movement Report', { align: 'center' });
    const dateRange = query.from || query.to ? ` (${query.from} to ${query.to})` : '';
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}${dateRange}`, { align: 'center' });
    doc.moveDown();

    // Get data
    const data = await reportService.getStockMovement(query);
    const items = PDFService._normalizeRows(data);

    doc.fontSize(11).fillColor('#000').font('Helvetica-Bold').text(`Total Records: ${items.length}`);
    doc.moveDown();

    // Table headers
    doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
    const tableTop = doc.y;
    const col1 = 40, col2 = 100, col3 = 160, col4 = 240, col5 = 310, col6 = 380;

    doc.text('Date', col1, tableTop);
    doc.text('Product', col2, tableTop);
    doc.text('Warehouse', col3, tableTop);
    doc.text('Type', col4, tableTop);
    doc.text('Count', col5, tableTop);
    doc.text('Total Qty', col6, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(520, tableTop + 15).stroke();
    doc.moveDown();

    // Table rows
    doc.font('Helvetica').fontSize(9).fillColor('#333');
    items.forEach((row) => {
      const y = doc.y;
      if (y > 700) {
        doc.addPage();
        doc.y = 40;
      }
      doc.text(row.txn_day, col1, doc.y, { width: 50 });
      doc.text(row.product_name?.substring(0, 15) || '-', col2, y, { width: 50 });
      doc.text(row.warehouse_name?.substring(0, 15) || '-', col3, y, { width: 70 });
      doc.text(row.txn_type, col4, y, { width: 60 });
      doc.text(row.txn_count.toString(), col5, y, { width: 50, align: 'right' });
      doc.text(row.total_qty.toString(), col6, y, { width: 60, align: 'right' });
      doc.moveDown();
    });

    doc.end();
  }

  /**
   * Generate PDF for PO Summary Report
   */
  static async generatePOSummaryPDF(stream, query) {
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Purchase Order Summary', { align: 'center' });
    const dateRange = query.from || query.to ? ` (${query.from} to ${query.to})` : '';
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}${dateRange}`, { align: 'center' });
    doc.moveDown();

    // Get data
    const data = await reportService.getPurchaseOrderSummary(query);
    const items = PDFService._normalizeRows(data);

    doc.fontSize(11).fillColor('#000').font('Helvetica-Bold').text(`Total Suppliers: ${items.length}`);
    doc.moveDown();

    // Table headers
    doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
    const tableTop = doc.y;
    const col1 = 40, col2 = 150, col3 = 230, col4 = 310, col5 = 420;

    doc.text('Supplier', col1, tableTop);
    doc.text('Status', col2, tableTop);
    doc.text('# POs', col3, tableTop);
    doc.text('Total Value', col4, tableTop);
    doc.text('Avg Days', col5, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(520, tableTop + 15).stroke();
    doc.moveDown();

    // Table rows
    doc.font('Helvetica').fontSize(9).fillColor('#333');
    items.forEach((row) => {
      const y = doc.y;
      if (y > 700) {
        doc.addPage();
        doc.y = 40;
      }
      doc.text(row.company_name?.substring(0, 30) || '-', col1, doc.y, { width: 100 });
      doc.text(row.status, col2, y, { width: 70 });
      doc.text(row.po_count.toString(), col3, y, { width: 50, align: 'right' });
      doc.text(`PKR ${parseFloat(row.total_value).toFixed(2)}`, col4, y, { width: 80, align: 'right' });
      doc.text(row.avg_days_to_close ? `${parseFloat(row.avg_days_to_close).toFixed(1)}d` : '—', col5, y, { width: 60, align: 'right' });
      doc.moveDown();
    });

    doc.end();
  }

  /**
   * Generate PDF for Sales Summary Report
   */
  static async generateSalesSummaryPDF(stream, query) {
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Sales Summary Report', { align: 'center' });
    const dateRange = query.from || query.to ? ` (${query.from} to ${query.to})` : '';
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}${dateRange}`, { align: 'center' });
    doc.moveDown();

    // Get data
    const data = await reportService.getSalesSummary(query);
    const items = PDFService._normalizeRows(data);

    doc.fontSize(11).fillColor('#000').font('Helvetica-Bold').text(`Total Customers: ${items.length}`);
    doc.moveDown();

    // Table headers
    doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
    const tableTop = doc.y;
    const col1 = 40, col2 = 150, col3 = 230, col4 = 310, col5 = 420;

    doc.text('Customer', col1, tableTop);
    doc.text('Orders', col2, tableTop);
    doc.text('Revenue', col3, tableTop);
    doc.text('Avg Order', col4, tableTop);
    doc.text('Last Order', col5, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(520, tableTop + 15).stroke();
    doc.moveDown();

    // Table rows
    doc.font('Helvetica').fontSize(9).fillColor('#333');
    items.forEach((row) => {
      const y = doc.y;
      if (y > 700) {
        doc.addPage();
        doc.y = 40;
      }
      doc.text(row.customer_name?.substring(0, 30) || '-', col1, doc.y, { width: 100 });
      doc.text(row.order_count.toString(), col2, y, { width: 70, align: 'right' });
      doc.text(`PKR ${parseFloat(row.total_revenue).toFixed(2)}`, col3, y, { width: 70, align: 'right' });
      doc.text(`PKR ${parseFloat(row.avg_order_value).toFixed(2)}`, col4, y, { width: 100, align: 'right' });
      doc.text(row.last_order_date?.slice(0, 10) || '—', col5, y, { width: 60, align: 'right' });
      doc.moveDown();
    });

    doc.end();
  }
}

module.exports = PDFService;
