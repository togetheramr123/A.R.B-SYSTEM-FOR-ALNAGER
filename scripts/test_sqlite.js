const Database = require('better-sqlite3');
const db = new Database('./dev.db');

const tables = ['Partner', 'Product', 'SaleOrder', 'SaleOrderLine', 'PurchaseOrder', 'PurchaseOrderLine', 'Invoice', 'InvoiceLine', 'StockPicking', 'StockMove'];

console.log('--- Final Data Counts ---');
tables.forEach(table => {
  try {
    const row = db.prepare(`SELECT count(*) as count FROM ${table}`).get();
    console.log(`${table}: ${row.count}`);
  } catch (e) {
    console.log(`${table}: Table missing or empty`);
  }
});
db.close();
