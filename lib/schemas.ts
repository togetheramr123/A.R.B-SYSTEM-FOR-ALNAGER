import { z } from 'zod';

// =============================================
// Invoice / Refund
// =============================================

export const InvoiceLineSchema = z.object({
    productId: z.string().nullable().optional(),
    name: z.string().min(1, 'اسم السطر مطلوب'),
    quantity: z.coerce.number().min(0),
    priceUnit: z.coerce.number().min(0),
    priceSubtotal: z.coerce.number().min(0),
    priceNet: z.coerce.number().optional(),
    discount1: z.coerce.number().min(0).max(100).default(0),
    unitName: z.string().nullable().optional(),
    accountId: z.string().nullable().optional(),
    secondaryQuantity: z.coerce.number().default(0),
    secondaryUnit: z.string().nullable().optional(),
    lineType: z.enum(['line', 'section', 'note']).default('line'),
});

export const CreateInvoiceSchema = z.object({
    type: z.enum(['out_invoice', 'in_invoice', 'out_refund', 'in_refund']).default('out_invoice'),
    partnerId: z.string().min(1, 'العميل/المورد مطلوب'),
    dateInvoice: z.string().optional(),
    dateDue: z.string().optional(),
    amountUntaxed: z.coerce.number().default(0),
    amountTax: z.coerce.number().default(0),
    amountTotal: z.coerce.number().default(0),
    narration: z.string().optional(),
    invoiceOrigin: z.string().nullable().optional(),
    saleOrderId: z.string().nullable().optional(),
    purchaseOrderId: z.string().nullable().optional(),
    lines: z.array(InvoiceLineSchema).optional(),
});

// =============================================
// Sale Order
// =============================================

export const SaleOrderLineSchema = z.object({
    productId: z.string().nullable().optional(),
    name: z.string().optional(),
    quantity: z.coerce.number().min(0),
    priceUnit: z.coerce.number().min(0),
    priceSubtotal: z.coerce.number().min(0),
    discount1: z.coerce.number().default(0),
    discount2: z.coerce.number().default(0),
    priceNet: z.coerce.number().default(0),
    unitName: z.string().optional(),
    taxRate: z.coerce.number().default(0),
    lineType: z.enum(['line', 'section', 'note']).default('line'),
    secondaryQuantity: z.coerce.number().default(0),
    secondaryUnit: z.string().optional(),
});

export const CreateSaleOrderSchema = z.object({
    partnerId: z.string().min(1, 'العميل مطلوب'),
    priceListId: z.string().nullable().optional(),
    note: z.string().optional(),
    validityDate: z.string().optional(),
    lines: z.array(SaleOrderLineSchema).min(1, 'يجب إضافة سطر واحد على الأقل'),
});

// =============================================
// Purchase Order
// =============================================

export const PurchaseOrderLineSchema = z.object({
    productId: z.string().nullable().optional(),
    name: z.string().optional(),
    quantity: z.coerce.number().min(0),
    priceUnit: z.coerce.number().min(0),
    priceSubtotal: z.coerce.number().min(0),
    discount1: z.coerce.number().default(0),
    discount2: z.coerce.number().default(0),
    priceNet: z.coerce.number().default(0),
    unitName: z.string().optional(),
    accountId: z.string().nullable().optional(),
    secondaryQuantity: z.coerce.number().default(0),
    secondaryUnit: z.string().optional(),
});

export const CreatePurchaseOrderSchema = z.object({
    partnerId: z.string().min(1, 'المورد مطلوب'),
    priceListId: z.string().nullable().optional(),
    notes: z.string().optional(),
    lines: z.array(PurchaseOrderLineSchema).min(1, 'يجب إضافة سطر واحد على الأقل'),
});

// =============================================
// Payment
// =============================================

export const CreatePaymentSchema = z.object({
    paymentType: z.enum(['inbound', 'outbound']),
    partnerType: z.enum(['customer', 'supplier']),
    amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
    date: z.string().min(1, 'التاريخ مطلوب'),
    ref: z.string().optional(),
    partnerId: z.string().nullable().optional(),
    journalId: z.string().min(1, 'دفتر اليومية مطلوب'),
    destinationAccountId: z.string().nullable().optional(),
    companyId: z.string().optional(),
});

// =============================================
// Partner (Contact)
// =============================================

export const CreatePartnerSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب'),
    type: z.string().default('person'),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    vat: z.string().optional(),
    isVendor: z.boolean().default(false),
    isCustomer: z.boolean().default(true),
    propertyAccountReceivableId: z.string().optional(),
    propertyAccountPayableId: z.string().optional(),
});

// =============================================
// Product
// =============================================

export const CreateProductSchema = z.object({
    name: z.string().min(1, 'اسم المنتج مطلوب'),
    type: z.enum(['storable', 'consumable', 'service']).default('storable'),
    barcode: z.string().optional(),
    sku: z.string().optional(),
    manufacturer: z.string().optional(),
    salePrice: z.coerce.number().min(0).default(0),
    costPrice: z.coerce.number().min(0).default(0),
    uom: z.string().default('Units'),
    categoryId: z.string().optional(),
    tracking: z.enum(['none', 'lot', 'serial']).default('none'),
    canBeSold: z.boolean().default(true),
    canBePurchased: z.boolean().default(true),
});

// =============================================
// Journal Entry
// =============================================

export const JournalItemSchema = z.object({
    accountId: z.string().min(1, 'الحساب مطلوب'),
    name: z.string().optional(),
    debit: z.coerce.number().min(0).default(0),
    credit: z.coerce.number().min(0).default(0),
    partnerId: z.string().optional(),
    analyticAccountId: z.string().optional(),
});

export const CreateJournalEntrySchema = z.object({
    date: z.string().min(1, 'التاريخ مطلوب'),
    journalId: z.string().min(1, 'دفتر اليومية مطلوب'),
    ref: z.string().optional(),
    items: z.array(JournalItemSchema).min(2, 'يجب إضافة سطرين على الأقل'),
});

// =============================================
// Journal
// =============================================

export const SaveJournalSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'الاسم مطلوب'),
    code: z.string().min(1, 'الرمز مطلوب'),
    type: z.string().min(1, 'النوع مطلوب'),
    defaultAccountId: z.string().nullable().optional(),
});

// =============================================
// Budget
// =============================================

export const CreateBudgetSchema = z.object({
    name: z.string().min(1, 'اسم الميزانية مطلوب'),
    userId: z.string().optional(),
    dateFrom: z.string().min(1, 'تاريخ البداية مطلوب'),
    dateTo: z.string().min(1, 'تاريخ النهاية مطلوب'),
});

// =============================================
// Asset
// =============================================

export const CreateAssetSchema = z.object({
    name: z.string().min(1, 'اسم الأصل مطلوب'),
    originalValue: z.coerce.number().positive('القيمة يجب أن تكون أكبر من صفر'),
    date: z.string().min(1, 'التاريخ مطلوب'),
    categoryId: z.string().min(1, 'الفئة مطلوبة'),
    duration: z.coerce.number().min(1).default(5),
});

// =============================================
// Settings / User
// =============================================

export const SaveUserSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'الاسم مطلوب'),
    email: z.string().email('بريد إلكتروني غير صالح'),
    role: z.enum(['ADMIN', 'USER']).default('USER'),
    password: z.string().min(6, 'كلمة السر يجب أن تكون 6 أحرف على الأقل').optional(),
    groupIds: z.array(z.string()).optional(),
});
