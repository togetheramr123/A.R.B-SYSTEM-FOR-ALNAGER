const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetData() {
    console.log('🔄 بدء تصفير البيانات...\n');

    // === 1. الفواتير وما يتبعها ===
    console.log('📄 حذف الفواتير...');
    const invoiceLines = await prisma.invoiceLine.deleteMany({});
    console.log(`   ✓ بنود الفواتير: ${invoiceLines.count}`);
    const invoices = await prisma.invoice.deleteMany({});
    console.log(`   ✓ الفواتير: ${invoices.count}`);

    // === 2. المدفوعات ===
    console.log('💳 حذف المدفوعات...');
    const payments = await prisma.payment.deleteMany({});
    console.log(`   ✓ المدفوعات: ${payments.count}`);

    // === 3. القيود المحاسبية ===
    console.log('📒 حذف القيود المحاسبية...');
    const journalItems = await prisma.journalItem.deleteMany({});
    console.log(`   ✓ بنود القيود: ${journalItems.count}`);
    const journalEntries = await prisma.journalEntry.deleteMany({});
    console.log(`   ✓ القيود: ${journalEntries.count}`);

    // === 4. أوامر الشراء ===
    console.log('🛒 حذف أوامر الشراء...');
    const poLines = await prisma.purchaseOrderLine.deleteMany({});
    console.log(`   ✓ بنود أوامر الشراء: ${poLines.count}`);
    const pos = await prisma.purchaseOrder.deleteMany({});
    console.log(`   ✓ أوامر الشراء: ${pos.count}`);

    // === 5. أوامر البيع ===
    console.log('📦 حذف أوامر البيع...');
    try {
        const soOptions = await prisma.saleOrderOption.deleteMany({});
        console.log(`   ✓ خيارات أوامر البيع: ${soOptions.count}`);
    } catch(e) { console.log('   ⚠ خيارات أوامر البيع: تخطي'); }
    const soLines = await prisma.saleOrderLine.deleteMany({});
    console.log(`   ✓ بنود أوامر البيع: ${soLines.count}`);
    const sos = await prisma.saleOrder.deleteMany({});
    console.log(`   ✓ أوامر البيع: ${sos.count}`);

    // === 6. حركات المخزون ===
    console.log('🏭 حذف حركات المخزون...');
    const stockMoves = await prisma.stockMove.deleteMany({});
    console.log(`   ✓ حركات المخزون: ${stockMoves.count}`);
    const stockPickings = await prisma.stockPicking.deleteMany({});
    console.log(`   ✓ عمليات التحويل: ${stockPickings.count}`);
    const stockQuants = await prisma.stockQuant.deleteMany({});
    console.log(`   ✓ أرصدة المخزون: ${stockQuants.count}`);
    const stockLots = await prisma.stockLot.deleteMany({});
    console.log(`   ✓ أرقام التشغيلات: ${stockLots.count}`);

    // === 7. الأصناف (المنتجات) ===
    console.log('📋 حذف الأصناف...');
    try {
        const supplierInfo = await prisma.productSupplierInfo.deleteMany({});
        console.log(`   ✓ معلومات الموردين: ${supplierInfo.count}`);
    } catch(e) { console.log('   ⚠ معلومات الموردين: تخطي'); }
    try {
        const attrLines = await prisma.productAttributeLine.deleteMany({});
        console.log(`   ✓ خطوط الخصائص: ${attrLines.count}`);
    } catch(e) { console.log('   ⚠ خطوط الخصائص: تخطي'); }
    try {
        const priceListItems = await prisma.priceListItem.deleteMany({});
        console.log(`   ✓ بنود قوائم الأسعار: ${priceListItems.count}`);
    } catch(e) { console.log('   ⚠ بنود قوائم الأسعار: تخطي'); }
    const products = await prisma.product.deleteMany({});
    console.log(`   ✓ الأصناف: ${products.count}`);

    // === 8. الرسائل (Chatter) ===
    console.log('💬 حذف الرسائل...');
    try {
        const trackingValues = await prisma.trackingValue.deleteMany({});
        console.log(`   ✓ قيم التتبع: ${trackingValues.count}`);
    } catch(e) { console.log('   ⚠ قيم التتبع: تخطي'); }
    const messages = await prisma.message.deleteMany({});
    console.log(`   ✓ الرسائل: ${messages.count}`);

    console.log('\n✅ تم تصفير النظام بنجاح!');
    console.log('   - الأصناف (المنتجات) ✓');
    console.log('   - الفواتير والمدفوعات ✓');
    console.log('   - أوامر الشراء والبيع ✓');
    console.log('   - حركات وأرصدة المخزون ✓');
    console.log('   - القيود المحاسبية ✓');
}

resetData()
    .catch((e) => {
        console.error('❌ خطأ:', e.message);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
