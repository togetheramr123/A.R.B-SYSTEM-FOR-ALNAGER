const Database = require('better-sqlite3');
const db = new Database('./dev.db');

const tables = [
    'Partner', 'Product', 'SaleOrder', 'SaleOrderLine', 
    'PurchaseOrder', 'PurchaseOrderLine', 'Invoice', 'InvoiceLine',
    'StockPicking', 'StockMove'
];

console.log('--- Database Status ---');
tables.forEach(table => {
    try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
        console.log(`${table}: ${count}`);
    } catch (e) {
        console.log(`${table}: Table not found or error`);
    }
});
db.close();
