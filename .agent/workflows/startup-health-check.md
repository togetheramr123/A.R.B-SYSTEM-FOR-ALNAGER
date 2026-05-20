---
description: MANDATORY FIRST STEP - At the start of every new conversation, run a health check on the ERP system to detect and fix any damage from interrupted sessions.
---

# ⚠️ MANDATORY FIRST STEP: System Health Check

> **This workflow MUST be executed at the START of every new conversation/session, BEFORE doing any new work.**
> **A previous session may have been interrupted mid-edit (internet drop, crash, etc.) leaving files in a broken state.**

## Why This Exists

The user's internet connection may drop at any time during development. If a file edit was in progress when the connection was lost, the code could be:
- Half-written (syntax errors)
- Missing closing brackets/tags
- Partially applied refactors
- Broken imports

This workflow detects and fixes such issues automatically.

## Steps

// turbo
1. Check if the dev server is running and healthy:
   ```bash
   cd /Users/zezoorasher/.gemini/antigravity/scratch/erp-system-2026 && lsof -i :3000 2>/dev/null | head -3
   ```

// turbo
2. If the dev server is NOT running, start it:
   ```bash
   cd /Users/zezoorasher/.gemini/antigravity/scratch/erp-system-2026 && npm run dev
   ```
   Wait for it to compile successfully. If there are compilation errors, fix them first.

// turbo
3. Run the full automated test suite:
   ```bash
   cd /Users/zezoorasher/.gemini/antigravity/scratch/erp-system-2026 && npx playwright test 2>&1
   ```

4. Analyze results:
   - **All pass** → The system is healthy. Report "✅ النظام سليم — X/X اختبار نجح" and proceed with the user's request.
   - **Any fail** → 
     a. A previous session likely left broken code.
     b. Investigate the failing tests, find the broken files, and fix them.
     c. Re-run tests until 100% pass.
     d. Report what was broken and what you fixed.
     e. THEN proceed with the user's new request.

5. Check for any partially written files (look for syntax errors in recently modified files):
   ```bash
   cd /Users/zezoorasher/.gemini/antigravity/scratch/erp-system-2026 && git diff --name-only 2>/dev/null | head -20
   ```

## Rules

1. **ALWAYS** run this health check before starting any new work.
2. **NEVER** start coding on a broken system — fix it first.
3. Report the health check results to the user at the start of the conversation.
4. If the user asks "what happened?" or "is the system OK?", run this workflow immediately.
