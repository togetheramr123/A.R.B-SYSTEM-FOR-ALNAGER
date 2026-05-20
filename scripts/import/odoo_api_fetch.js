const axios = require('axios');
const fs = require('fs');

const URL = 'http://161.97.141.100:10016';
const USER = 'togetheramr123@mail.com';
const PASS = '1993';
const DATABASES = ['hosien_alnagar', 'alnagar_test', 'odoooooo'];

async function fetchFromOdoo(db) {
    console.log(`--- Trying Database: ${db} ---`);
    try {
        // 1. Authenticate
        const authResponse = await axios.post(`${URL}/web/session/authenticate`, {
            jsonrpc: "2.0",
            params: {
                db: db,
                login: USER,
                password: PASS
            }
        });

        if (authResponse.data.error) {
            console.error(`Auth Error for ${db}:`, authResponse.data.error);
            return false;
        }

        const sessionId = authResponse.headers['set-cookie']?.[0]?.split(';')[0];
        console.log(`Authenticated! Session ID found.`);

        // 2. Fetch Partners (res.partner)
        const partnersResponse = await axios.post(`${URL}/web/dataset/call_kw`, {
            jsonrpc: "2.0",
            params: {
                model: "res.partner",
                method: "search_read",
                args: [[]],
                kwargs: {
                    fields: ["name", "email", "phone", "customer", "supplier"]
                }
            }
        }, {
            headers: { Cookie: sessionId }
        });

        if (partnersResponse.data.result) {
            const partners = partnersResponse.data.result;
            console.log(`Fetched ${partners.length} partners.`);
            fs.writeFileSync('./scripts/import/odoo_contacts.json', JSON.stringify(partners, null, 2));
            // Convert to dummy CSV for existing script logic
            const csvContent = 'name,email,phone,is_customer,is_vendor\n' +
                partners.map(p => `"${p.name}","${p.email || ''}","${p.phone || ''}",${p.customer},${p.supplier}`).join('\n');
            fs.writeFileSync('./scripts/import/odoo_contacts.csv', csvContent);
        }

        // 3. Fetch Products (product.template)
        const productsResponse = await axios.post(`${URL}/web/dataset/call_kw`, {
            jsonrpc: "2.0",
            params: {
                model: "product.template",
                method: "search_read",
                args: [[]],
                kwargs: {
                    fields: ["name", "list_price", "standard_price", "barcode", "default_code"]
                }
            }
        }, {
            headers: { Cookie: sessionId }
        });

        if (productsResponse.data.result) {
            const products = productsResponse.data.result;
            console.log(`Fetched ${products.length} products.`);
            fs.writeFileSync('./scripts/import/odoo_products.json', JSON.stringify(products, null, 2));
            const csvContent = 'name,list_price,standard_price,barcode\n' +
                products.map(p => `"${p.name}",${p.list_price},${p.standard_price},"${p.barcode || p.default_code || ''}"`).join('\n');
            fs.writeFileSync('./scripts/import/odoo_products.csv', csvContent);
        }

        return true;
    } catch (e) {
        console.error(`Error for ${db}:`, e.message);
        return false;
    }
}

async function run() {
    for (const db of DATABASES) {
        const success = await fetchFromOdoo(db);
        if (success) break;
    }
}

run();
