import { confirmInvoice } from './app/actions/accounting/index';

// We need to bypass the session check.
// Let's monkey-patch getSession at runtime if possible, or just edit the compiled js?
