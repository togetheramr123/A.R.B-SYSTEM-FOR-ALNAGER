import { confirmInvoice } from './app/actions/accounting/index';
async function run() {
  try {
    const res = await confirmInvoice('9d0c5153-9ef0-447a-9f32-e9b98726582a');
    console.log("SUCCESS:", res);
  } catch(e: any) {
    console.error("FAILED:", e.message);
    console.error(e.stack);
  }
}
run();
