const fs = require('fs');
const path = require('path');
const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

const modelsToAddMessages = [
  'PriceList', 'Account', 'Journal', 'ProductCategory', 
  'Warehouse', 'Asset', 'Employee', 'StockScrap', 'BankStatement'
];

// Add messages Message[] to each model
for (const model of modelsToAddMessages) {
  const modelRegex = new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`, 'g');
  content = content.replace(modelRegex, (match) => {
    if (match.includes('messages Message[]')) return match;
    return match.replace(/\n\}/, '\n\n  messages Message[]\n}');
  });
}

// Add the new fields to Message model specifically
const messageFields = `
  employeeId String?
  employee   Employee? @relation(fields: [employeeId], references: [id])

  assetId String?
  asset   Asset? @relation(fields: [assetId], references: [id])

  warehouseId String?
  warehouse   Warehouse? @relation(fields: [warehouseId], references: [id])

  stockScrapId String?
  stockScrap   StockScrap? @relation(fields: [stockScrapId], references: [id])

  bankStatementId String?
  bankStatement   BankStatement? @relation(fields: [bankStatementId], references: [id])

  journalId String?
  journal   Journal? @relation(fields: [journalId], references: [id])

  accountId String?
  account   Account? @relation(fields: [accountId], references: [id])

  priceListId String?
  priceList   PriceList? @relation(fields: [priceListId], references: [id])

  productCategoryId String?
  productCategory   ProductCategory? @relation(fields: [productCategoryId], references: [id])

  attachments Attachment[]`;

const messageRegex = /model Message \{([\s\S]*?)\}/;
content = content.replace(messageRegex, (match) => {
    return match.replace('  attachments Attachment[]', messageFields);
});

fs.writeFileSync(schemaPath, content);
console.log('Schema updated successfully');
