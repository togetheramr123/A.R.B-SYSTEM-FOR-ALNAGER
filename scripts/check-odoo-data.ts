/**
 * Quick script to check what data exists in Odoo for sync planning
 */
import xmlrpc from 'xmlrpc';

const ODOO_CONFIG = {
    url: 'http://161.97.141.100:10016',
    db: 'hosien_alnagar',
    username: 'togetheramr123@mail.com',
    password: '1993'
};

function getOdooClient() {
    const urlParts = new URL(ODOO_CONFIG.url);
    const clientOptions = {
        host: urlParts.hostname,
        port: parseInt(urlParts.port) || 80,
        path: '/xmlrpc/2/common',
        headers: { 'User-Agent': 'NodeJS XML-RPC Client' }
    };
    const createClient = urlParts.protocol === 'https:' ? xmlrpc.createSecureClient : xmlrpc.createClient;
    return { createClient, clientOptions };
}

async function authenticate(): Promise<{ object: any; uid: number }> {
    const { createClient, clientOptions } = getOdooClient();
    const common = createClient(clientOptions);

    const uid = await new Promise<number>((resolve, reject) => {
        common.methodCall('authenticate', [
            ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}
        ], (error: any, value: any) => {
            if (error) reject(error);
            else if (typeof value !== 'number') reject(new Error("Auth failed"));
            else resolve(value);
        });
    });

    const objectClientOptions = { ...clientOptions, path: '/xmlrpc/2/object' };
    const object = createClient(objectClientOptions);
    return { object, uid };
}

function executeKW(object: any, uid: number, model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        object.methodCall('execute_kw', [
            ODOO_CONFIG.db, uid, ODOO_CONFIG.password,
            model, method, args, kwargs
        ], (error: any, value: any) => {
            if (error) reject(error);
            else resolve(value);
        });
    });
}

async function main() {
    const { object, uid } = await authenticate();
    console.log('Authenticated!\n');

    // Count all relevant models
    const models = [
        'res.partner',
        'account.move',       // Invoices/Bills in Odoo 14+
        'account.invoice',    // Invoices in older Odoo
        'sale.order',
        'purchase.order',
    ];

    for (const model of models) {
        try {
            const count = await executeKW(object, uid, model, 'search_count', [[]]);
            console.log(`${model}: ${count} records`);
        } catch (e: any) {
            console.log(`${model}: ERROR - ${e.message?.substring(0, 80)}`);
        }
    }

    // Get sample data for each model
    console.log('\n--- Sample Sale Orders ---');
    try {
        const sales = await executeKW(object, uid, 'sale.order', 'search_read',
            [[]],
            { fields: ['name', 'partner_id', 'state', 'amount_total', 'date_order', 'invoice_status'], limit: 3 }
        );
        console.log(JSON.stringify(sales, null, 2));
    } catch (e: any) {
        console.log('Error:', e.message?.substring(0, 100));
    }

    console.log('\n--- Sample Purchase Orders ---');
    try {
        const purchases = await executeKW(object, uid, 'purchase.order', 'search_read',
            [[]],
            { fields: ['name', 'partner_id', 'state', 'amount_total', 'date_order', 'invoice_status'], limit: 3 }
        );
        console.log(JSON.stringify(purchases, null, 2));
    } catch (e: any) {
        console.log('Error:', e.message?.substring(0, 100));
    }

    console.log('\n--- Sample Invoices (account.move) ---');
    try {
        const invoices = await executeKW(object, uid, 'account.move', 'search_read',
            [[['move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']]]],
            { fields: ['name', 'partner_id', 'move_type', 'state', 'amount_total', 'amount_residual', 'invoice_date', 'invoice_origin'], limit: 3 }
        );
        console.log(JSON.stringify(invoices, null, 2));
    } catch (e: any) {
        console.log('Error:', e.message?.substring(0, 100));
    }

    console.log('\n--- Partners sample ---');
    try {
        const partners = await executeKW(object, uid, 'res.partner', 'search_read',
            [[['is_company', '=', true]]],
            { fields: ['name', 'email', 'phone', 'mobile', 'street', 'city', 'customer_rank', 'supplier_rank'], limit: 5 }
        );
        console.log(JSON.stringify(partners, null, 2));
    } catch (e: any) {
        console.log('Error:', e.message?.substring(0, 100));
    }
}

main().catch(console.error);
