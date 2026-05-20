/**
 * lib/validations.ts
 * ==================
 * Central Zod v4 validation schemas for all ERP server actions.
 * Each schema validates input data BEFORE it reaches the database.
 * 
 * USAGE in server actions:
 *   import { CreateProductSchema, validateSafe } from '@/lib/validations';
 *   const validation = validateSafe(CreateProductSchema, data);
 *   if (!validation.success) return { error: validation.error };
 */

import { z } from 'zod';

// ============================================================
// HELPERS (Zod v4 compatible)
// ============================================================

/** Accepts string or number, coerces to number */
const numericField = (label: string) =>
  z.coerce.number({ message: `${label} يجب أن يكون رقماً` });

/** Optional positive number (price, qty, etc.) */
const positiveOptional = (label: string) =>
  numericField(label).min(0, `${label} لا يمكن أن يكون سالباً`).optional().default(0);

/** Required non-empty string */
const requiredString = (label: string) =>
  z.string({ message: `${label} مطلوب` }).min(1, `${label} مطلوب`);

/** Optional string (nullable) */
const optionalString = () => z.string().optional().nullable();

// ============================================================
// 1. PRODUCTS
// ============================================================

export const CreateProductSchema = z.object({
  name: requiredString('اسم المنتج'),
  detailedType: z.enum(['consu', 'storable', 'service']).optional().default('consu'),
  can_sell: z.boolean().optional().default(true),
  can_purchase: z.boolean().optional().default(true),
  uom: optionalString(),
  purchaseUom: optionalString(),
  salePrice: positiveOptional('سعر البيع'),
  costPrice: positiveOptional('سعر التكلفة'),
  taxes: positiveOptional('الضرائب'),
  listPrice: positiveOptional('سعر البيع'),
  standardPrice: positiveOptional('سعر التكلفة'),
  internalReference: optionalString(),
  barcode: optionalString(),
  categoryId: optionalString(),
  description: optionalString(),
  image: optionalString(),
  hasSecondaryUnit: z.boolean().optional().default(false),
  secondaryUom: optionalString(),
  secondaryUomFactor: positiveOptional('معامل التحويل'),
  weight: positiveOptional('الوزن'),
  volume: positiveOptional('الحجم'),
  tracking: z.enum(['none', 'lot', 'serial']).optional().default('none'),
}).passthrough();

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  name: requiredString('اسم المنتج'),
});

// ============================================================
// 2. PRODUCT CATEGORIES
// ============================================================

export const CreateCategorySchema = z.object({
  name: requiredString('اسم الفئة'),
  parentId: optionalString(),
  costingMethod: z.enum(['standard', 'avco', 'fifo']).optional().default('standard'),
  valuation: z.enum(['manual_periodic', 'real_time']).optional().default('manual_periodic'),
  propertyAccountIncomeId: optionalString(),
  propertyAccountExpenseId: optionalString(),
}).passthrough();

// ============================================================
// 3. PURCHASE ORDERS
// ============================================================

const PurchaseLineSchema = z.object({
  productId: optionalString(),
  description: optionalString(),
  qty: numericField('الكمية').min(0, 'الكمية لا يمكن أن تكون سالبة'),
  price: numericField('السعر').min(0, 'السعر لا يمكن أن يكون سالباً'),
  discount: numericField('الخصم').min(0).max(100, 'الخصم لا يمكن أن يتجاوز 100%').optional().default(0),
  taxRate: positiveOptional('نسبة الضريبة'),
  taxes: z.boolean().optional(),
  unitSelection: z.enum(['primary', 'secondary']).optional().default('primary'),
  accountId: optionalString(),
}).passthrough();

export const CreatePurchaseOrderSchema = z.object({
  partnerId: optionalString(),
  vendor: optionalString(),
  date: z.string().min(1, 'التاريخ مطلوب'),
  priceListId: optionalString(),
  lines: z.array(PurchaseLineSchema),
}).passthrough();

// ============================================================
// 4. SALE ORDERS
// ============================================================

const SaleLineSchema = z.object({
  productId: optionalString(),
  description: optionalString(),
  qty: numericField('الكمية').min(0, 'الكمية لا يمكن أن تكون سالبة'),
  price: numericField('السعر').min(0, 'السعر لا يمكن أن يكون سالباً'),
  discount: numericField('الخصم').min(0).max(100).optional().default(0),
  tax: positiveOptional('نسبة الضريبة'), taxIds: z.array(z.string()).optional().default([]),
  unitSelection: z.enum(['primary', 'secondary']).optional().default('primary'),
}).passthrough();

export const CreateSaleOrderSchema = z.object({
  partnerId: optionalString(),
  date: z.string().min(1, 'التاريخ مطلوب'),
  priceListId: optionalString(),
  lines: z.array(SaleLineSchema),
});

// ============================================================
// 5. PARTNERS / CONTACTS
// ============================================================

export const CreatePartnerSchema = z.object({
  name: requiredString('اسم جهة الاتصال'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().nullable().or(z.literal('')),
  phone: optionalString(),
  mobile: optionalString(),
  type: z.enum(['company', 'person', 'contact', 'invoice', 'delivery', 'private', 'other', 'supplier', 'customer']).optional().default('person'),
  customerType: z.enum(['commercial', 'cash', 'none', '']).optional().default('none'),
  isCompany: z.boolean().optional().default(false),
  isCustomer: z.boolean().optional().default(true),
  isSupplier: z.boolean().optional().default(false),
  isVendor: z.boolean().optional().default(false),
  street: optionalString(),
  city: optionalString(),
  country: optionalString(),
  taxId: optionalString(),
}).passthrough();

export const UpdatePartnerSchema = CreatePartnerSchema.partial().extend({
  name: requiredString('اسم جهة الاتصال'),
});

// ============================================================
// 6. INVOICES / ACCOUNTING
// ============================================================

const InvoiceLineSchema = z.object({
  name: optionalString(),
  quantity: numericField('الكمية').min(0.001, 'الكمية مطلوبة'),
  priceUnit: numericField('سعر الوحدة').min(0, 'السعر لا يمكن أن يكون سالباً'),
  discount1: positiveOptional('الخصم'),
  taxRate: positiveOptional('نسبة الضريبة'),
  productId: optionalString(),
  accountId: optionalString(),
}).passthrough();

export const CreateInvoiceSchema = z.object({
  partnerId: requiredString('الشريك / العميل'),
  type: z.enum(['out_invoice', 'in_invoice', 'out_refund', 'in_refund']).optional().default('out_invoice'),
  dateInvoice: z.string().optional(),
  lines: z.array(InvoiceLineSchema).min(1, 'يجب إضافة بند واحد على الأقل'),
}).passthrough();

// ============================================================
// 7. JOURNAL ENTRIES
// ============================================================

const JournalItemSchema = z.object({
  accountId: requiredString('الحساب'),
  debit: positiveOptional('مدين'),
  credit: positiveOptional('دائن'),
  label: optionalString(),
  partnerId: optionalString(),
}).refine(
  (data) => (data.debit || 0) > 0 || (data.credit || 0) > 0,
  { message: 'يجب تحديد مبلغ مدين أو دائن' }
);

export const CreateJournalEntrySchema = z.object({
  journalId: requiredString('الدفتر'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  ref: optionalString(),
  items: z.array(JournalItemSchema).min(2, 'القيد يحتاج سطرين على الأقل'),
}).passthrough();

// ============================================================
// 8. HR - EMPLOYEES
// ============================================================

export const CreateEmployeeSchema = z.object({
  name: requiredString('اسم الموظف'),
  jobTitle: optionalString(),
  departmentId: optionalString(),
  workPhone: optionalString(),
  workEmail: z.string().email('البريد الإلكتروني غير صحيح').optional().nullable().or(z.literal('')),
  salary: positiveOptional('الراتب'),
}).passthrough();

// ============================================================
// 9. UOM (Units of Measure)
// ============================================================

export const CreateUomSchema = z.object({
  name: requiredString('اسم الوحدة'),
  categoryId: requiredString('فئة الوحدة'),
  factor: numericField('معامل التحويل').positive('المعامل يجب أن يكون أكبر من صفر').optional().default(1),
  rounding: positiveOptional('التقريب'),
  uomType: z.enum(['reference', 'bigger', 'smaller']).optional().default('reference'),
}).passthrough();

// ============================================================
// 10. INVENTORY (PICKINGS)
// ============================================================

export const ValidatePickingSchema = z.object({
  pickingId: requiredString('معرف الإذن'),
  backorderAction: z.enum(['create', 'cancel', 'none']).optional().default('none'),
}).passthrough();

// ============================================================
// 11. PAYMENTS
// ============================================================

export const RegisterPaymentSchema = z.object({
  invoiceId: requiredString('معرف الفاتورة'),
  amount: positiveOptional('المبلغ'),
  journalId: optionalString(),
}).passthrough();

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validates data against a Zod schema. Returns parsed data on success,
 * or throws a formatted error message suitable for Arabic UI display.
 */
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    throw new Error(firstError.message);
  }
  return result.data;
}

/**
 * Validates data and returns { success, data, error } instead of throwing.
 */
export function validateSafe<T>(schema: z.ZodType<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }
  return { success: true, data: result.data };
}
