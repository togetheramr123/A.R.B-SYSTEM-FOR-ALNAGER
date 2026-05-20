import { confirmInvoice } from './app/actions/accounting/index';
// mock getSession
const auth = require('./lib/auth');
auth.getSession = async () => ({ userId: "fc75f1ed-28fc-4173-bfe6-01b701d962b9", role: "ADMIN", companyId: "c3ba5918-3793-47fe-bda3-4f1703548b4b" });

const access = require('./lib/access');
access.ensureAccess = async () => true;

async function run() {
  try {
    const res = await confirmInvoice('9d0c5153-9ef0-447a-9f32-e9b98726582a');
    console.log("Success:", res);
  } catch(e: any) {
    console.error("Failed:", e.message);
    console.error(e.stack);
  }
}
run();
