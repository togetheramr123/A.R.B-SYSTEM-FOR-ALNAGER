import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { confirmInvoice } from './app/actions/accounting/index';

// Patch getSession in lib/auth since it's just a file
jest = { fn: () => {} } as any;

async function run() {
  try {
    const res = await confirmInvoice('9d0c5153-9ef0-447a-9f32-e9b98726582a');
    console.log("Success:", res);
  } catch(e) {
    console.error("Failed:", e.message);
  }
}
run();
