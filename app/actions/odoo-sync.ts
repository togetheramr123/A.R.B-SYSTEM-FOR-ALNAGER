"use server";
import { ensureAccess } from '@/lib/access';
import xmlrpc from 'xmlrpc';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

type OdooConfig = { url: string; db: string; username: string; password: string; };
type OdooProduct = { id: number; name: string; list_price: number; standard_price: number; default_code: string; uom_id: [number, string] | boolean; };
type OdooPartner = { id: number; name: string; email?: string; phone?: string; vat?: string; street?: string; };
type OdooInvoice = { id: number; name: string; invoice_date: string; state: string; partner_id: [number, string]; amount_total: number; amount_untaxed: number; amount_tax: number; invoice_line_ids: number[]; };
type OdooInvoiceLine = { id: number; name: string; product_id: [number, string] | boolean; quantity: number; price_unit: number; price_subtotal: number; discount: number; };

async function getOdooClient(config: OdooConfig) {
  const urlParts = new URL(config.url);
  const clientOptions = { host: urlParts.hostname, port: urlParts.port ? parseInt(urlParts.port) : (urlParts.protocol === 'https:' ? 443 : 80), path: '/xmlrpc/2/common', headers: { 'User-Agent': 'NodeJS XML-RPC Client' } };
  const createClient = urlParts.protocol === 'https:' ? xmlrpc.createSecureClient : xmlrpc.createClient;
  const common = createClient(clientOptions);
  const uid = await new Promise<number>((resolve, reject) => {
    common.methodCall('authenticate', [config.db, config.username, config.password, {}], (error: any, value: any) => {
      if (error) reject(error);
      else if (typeof value !== 'number') reject(new Error("Authentication failed"));
      else resolve(value);
    });
  });
  const objectClientOptions = { ...clientOptions, path: '/xmlrpc/2/object' };
  const object = createClient(objectClientOptions);
  return { object, uid };
}

export async function syncOdooProducts(config: OdooConfig) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const { object, uid } = await getOdooClient(config);
    const products = await new Promise<OdooProduct[]>((resolve, reject) => {
      object.methodCall('execute_kw', [
        config.db, uid, config.password,
        'product.product', 'search_read',
        [[['active', '=', true]]],
        { fields: ['id', 'name', 'list_price', 'standard_price', 'default_code', 'uom_id'] }
      ], (error: any, value: any) => {
        if (error) reject(error); else resolve(value);
      });
    });
    let updatedCount = 0;
    let createdCount = 0;
    for (const p of products) {
      let existing = await prisma.product.findUnique({ where: { odooId: p.id } });
      if (!existing && p.default_code) {
        existing = await prisma.product.findUnique({ where: { sku: p.default_code } });
      }
      const data = { name: p.name, salePrice: p.list_price, costPrice: p.standard_price, sku: p.default_code || undefined, odooId: p.id, companyId: session.companyId, uom: p.uom_id ? String((p.uom_id as [number, string])[1]) : 'Units' };
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data: { salePrice: p.list_price, costPrice: p.standard_price, odooId: p.id } });
        updatedCount++;
      } else {
        await prisma.product.create({ data: { ...data, type: 'storable', description: `Imported from Odoo [ID: ${p.id}]` } });
        createdCount++;
      }
    }
    return { success: true, message: `Synced ${products.length} products. Created: ${createdCount}, Updated: ${updatedCount}` };
  } catch (error: any) {
    console.error("Odoo Sync Error:", error);
    return { success: false, message: error.message };
  }
}

export async function syncOdooInvoices(config: OdooConfig) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const { object, uid } = await getOdooClient(config);
    const invoices = await new Promise<OdooInvoice[]>((resolve, reject) => {
      object.methodCall('execute_kw', [
        config.db, uid, config.password,
        'account.move', 'search_read',
        [[['move_type', '=', 'out_invoice'], ['state', '=', 'posted']]],
        { fields: ['id', 'name', 'invoice_date', 'partner_id', 'amount_total', 'amount_untaxed', 'amount_tax', 'invoice_line_ids'], limit: 50 }
      ], (error: any, value: any) => {
        if (error) reject(error); else resolve(value);
      });
    });
    let syncedCount = 0;
    for (const inv of invoices) {
      const existing = await prisma.invoice.findUnique({ where: { odooId: inv.id } });
      if (existing) continue;
      const partnerOdooId = inv.partner_id[0];
      const partnerName = inv.partner_id[1];
      let partner = await prisma.partner.findFirst({ where: { odooId: partnerOdooId } });
      if (!partner) {
        partner = await prisma.partner.findFirst({ where: { name: partnerName } });
        if (partner) {
          await prisma.partner.update({ where: { id: partner.id }, data: { odooId: partnerOdooId } });
        } else {
          partner = await prisma.partner.create({ data: { name: partnerName, odooId: partnerOdooId, companyId: session.companyId, isCustomer: true } });
        }
      }
      const lineIds = inv.invoice_line_ids;
      let linesData: any[] = [];
      if (lineIds.length > 0) {
        const lines = await new Promise<OdooInvoiceLine[]>((resolve, reject) => {
          object.methodCall('execute_kw', [
            config.db, uid, config.password,
            'account.move.line', 'read',
            [lineIds],
            { fields: ['product_id', 'name', 'quantity', 'price_unit', 'price_subtotal', 'discount'] }
          ], (error: any, value: any) => {
            if (error) reject(error); else resolve(value);
          });
        });
        for (const line of lines) {
          let productId = null;
          if (Array.isArray(line.product_id)) {
            const pOdooId = line.product_id[0];
            const p = await prisma.product.findUnique({ where: { odooId: pOdooId } });
            if (p) productId = p.id;
          }
          linesData.push({ productId, name: line.name, quantity: line.quantity, priceUnit: line.price_unit, priceSubtotal: line.price_subtotal, discount1: line.discount });
        }
      }
      await prisma.invoice.create({ data: { odooId: inv.id, name: inv.name, type: 'out_invoice', state: 'posted', lines: { create: linesData } } });
      syncedCount++;
    }
    return { success: true, message: `Synced ${syncedCount} new invoices.` };
  } catch (error: any) {
    console.error("Odoo Sync Error:", error);
    return { success: false, message: error.message };
  }
}