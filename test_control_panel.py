import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

start = content.find('{/* ════════ ODOO 17 CONTROL PANEL ════════ */}')
end = content.find('{/* ════════ LIST VIEW (Odoo Clean Style) ════════ */}')
print(content[start:end])
