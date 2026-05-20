import { confirmInvoice } from './app/actions/accounting/index';
// mock getSession globally
jest = require('jest-mock');
require('./lib/auth').getSession = jest.fn().mockResolvedValue({ userId: 'fc75f1ed-28fc-4173-bfe6-01b701d962b9', role: 'ADMIN', companyId: 'c3ba5918-3793-47fe-bda3-4f1703548b4b' });
require('./lib/access').ensureAccess = jest.fn().mockResolvedValue(true);

async function run() {
  try {
    const res = await confirmInvoice('9d0c5153-9ef0-447a-9f32-e9b98726582a');
    console.log("Success:", res);
  } catch(e) {
    console.error("Failed:", e.message);
  }
}
run();
