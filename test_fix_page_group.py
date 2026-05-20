import re
with open("app/[locale]/inventory/products/page.tsx", "r") as f:
    content = f.read()

# Add groupSummaries={groupSummaries}
content = content.replace("<ProductListClient products={productsWithStock} locale={locale} typeLabels={typeLabels} searchQuery={q} groupBy={groupBy} totalCount={totalCount} pagination={{", "<ProductListClient groupSummaries={groupSummaries} products={productsWithStock} locale={locale} typeLabels={typeLabels} searchQuery={q} groupBy={groupBy} totalCount={totalCount} pagination={{")

with open("app/[locale]/inventory/products/page.tsx", "w") as f:
    f.write(content)

print("Fixed page.tsx rendering")
