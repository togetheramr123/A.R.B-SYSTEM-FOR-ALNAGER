import re

# 1. Fix getProductsForExport in inventory.ts
with open("app/actions/inventory.ts", "r") as f:
    action_content = f.read()

action_content = action_content.replace(
    "export async function getProductsForExport(selectedIds: string[], filter: string | null, companyId: string) {",
    "export async function getProductsForExport(selectedIds: string[], filter: string | null) {\n  const session = await getSession();\n  const companyId = session?.companyId;\n  if (!companyId) return [];"
)
with open("app/actions/inventory.ts", "w") as f:
    f.write(action_content)

# 2. Fix ProductListClient.tsx
with open("components/inventory/ProductListClient.tsx", "r") as f:
    client_content = f.read()

# Fix XLSX import
if 'import * as XLSX from "xlsx";' not in client_content:
    client_content = client_content.replace('import { useState, useCallback, useRef, useEffect, Fragment } from "react";', 'import { useState, useCallback, useRef, useEffect, Fragment } from "react";\nimport * as XLSX from "xlsx";')

# Remove session?.user?.companyId
client_content = client_content.replace(
    "await getProductsForExport(idsToExport, currentFilter, session?.user?.companyId as string);",
    "await getProductsForExport(idsToExport, currentFilter);"
)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(client_content)

print("Fixed exports logic")
