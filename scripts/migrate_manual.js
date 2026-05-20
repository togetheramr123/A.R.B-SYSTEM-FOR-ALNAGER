const Database = require('better-sqlite3');
const db = new Database('./dev.db');

console.log('Recreating StockMove table...');

db.prepare('DROP TABLE IF EXISTS StockMove').run();

db.prepare(`
  CREATE TABLE StockMove (
    id TEXT PRIMARY KEY,
    name TEXT,
    reference TEXT,
    productId TEXT,
    sourceLocationId TEXT,
    destLocationId TEXT,
    quantity REAL NOT NULL,
    quantityDone REAL DEFAULT 0.0,
    status TEXT DEFAULT 'draft',
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    pickingId TEXT,
    purchaseLineId TEXT,
    saleLineId TEXT,
    discount1 REAL DEFAULT 0.0,
    discount2 REAL DEFAULT 0.0,
    priceNet REAL DEFAULT 0.0,
    unitName TEXT,
    secQty REAL DEFAULT 0.0,
    secUnitName TEXT,
    FOREIGN KEY (productId) REFERENCES Product(id),
    FOREIGN KEY (pickingId) REFERENCES StockPicking(id),
    FOREIGN KEY (purchaseLineId) REFERENCES PurchaseOrderLine(id),
    FOREIGN KEY (saleLineId) REFERENCES SaleOrderLine(id)
  )
`).run();

console.log('StockMove table recreated successfully.');
db.close();
