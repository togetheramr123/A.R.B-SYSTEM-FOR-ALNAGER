import { confirmInvoice } from './app/actions/accounting/index';
// disable ensureAccess
jest = require('jest-mock');
const access = require('./lib/access');
access.ensureAccess = jest.fn().mockResolvedValue(true);

async function run() {
  try {
    const res = await confirmInvoice('9d0c5153-9ef0-447a-9f32-e9b98726582a');
    console.log("Success:", res);
  } catch(e) {
    console.error("Failed:", e.message);
  }
}
run();
