---
description: MANDATORY - After ANY code changes to the ERP system, automatically run the Playwright test suite. This is a NON-NEGOTIABLE rule.
---

# ⚠️ MANDATORY: Run Tests After Every Code Change

> **This workflow is MANDATORY and applies to ALL agents, models, and sessions working on this project.**
> **Do NOT skip this step. Do NOT ask the user if they want to run tests. Just run them.**

## Context

This ERP system has a comprehensive Playwright E2E test suite with 50+ tests covering:
- Navigation (all pages load without errors)
- Product CRUD (create, edit, archive, delete)
- Data preservation (dialogs don't lose form data)
- Save/Discard buttons behavior
- Category & UoM dialog workflows
- Purchases, Sales, Accounting, Contacts, HR modules

## Steps

1. After completing **ALL** code edits for the current task, ensure the dev server is running on port 3000.
   - Check with: `lsof -i :3000`
   - If not running: `cd /Users/zezoorasher/.gemini/antigravity/scratch/erp-system-2026 && npm run dev`

// turbo
2. Run the full test suite:
   ```bash
   cd /Users/zezoorasher/.gemini/antigravity/scratch/erp-system-2026 && npx playwright test 2>&1
   ```

3. Analyze results:
   - **All pass** → Report "✅ X/X اختبار نجح" to the user.
   - **Any fail** →
     a. Determine if the failure is caused by your code changes (real bug) or by a stale test selector.
     b. Fix the issue (code bug → fix the code; stale test → update the test).
     c. Re-run until 100% pass.
     d. Only then report to the user.

4. If you added **new features or pages**, you MUST also add corresponding test cases in `tests/` before running.

## Test File Structure

```
tests/
├── helpers/auth.ts              ← Navigation helpers
├── navigation.spec.ts           ← All pages load check
├── inventory/
│   ├── products.spec.ts         ← Product lifecycle
│   └── categories.spec.ts       ← Category dialog
├── purchases/orders.spec.ts     ← Purchase orders
├── sales/orders.spec.ts         ← Sales orders
├── accounting/pages.spec.ts     ← Accounting pages
├── contacts/partners.spec.ts    ← Contacts
├── hr/employees.spec.ts         ← HR pages
└── uom_ui.spec.ts               ← UoM dialog
```

## Rules

1. **NEVER** deliver code changes without running tests first.
2. **NEVER** ask the user "should I run tests?" — the answer is always YES.
3. **ALWAYS** include test results in your final summary.
4. If adding a new page/route, add it to `navigation.spec.ts`.
5. If adding a new form/dialog, add data-preservation tests.
