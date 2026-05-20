// Run with: node scripts/migrate.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

try {
    const db = new Database(dbPath);

    // Create StockValuationLayer table
    db.exec(`
        CREATE TABLE IF NOT EXISTS "StockValuationLayer" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "description" TEXT,
            "productId" TEXT NOT NULL,
            "quantity" DECIMAL NOT NULL DEFAULT 0,
            "value" DECIMAL NOT NULL DEFAULT 0,
            "unitCost" DECIMAL NOT NULL DEFAULT 0,
            "remainingQty" DECIMAL NOT NULL DEFAULT 0,
            "remainingValue" DECIMAL NOT NULL DEFAULT 0,
            "stockMoveId" TEXT,
            "companyId" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "StockValuationLayer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT "StockValuationLayer_stockMoveId_fkey" FOREIGN KEY ("stockMoveId") REFERENCES "StockMove" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
    `);

    console.log('✅ StockValuationLayer table created');

    // Verify
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='StockValuationLayer'").all();
    console.log('Table exists:', tables.length > 0);

    db.close();
    console.log('Done!');
} catch (e) {
    console.error('Error:', e.message);
}
