with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# Fix tags
content = content.replace('{product.tags?.length > 0 ? (', '{product.tags && product.tags.length > 0 ? (')
content = content.replace('{product.tags.map((t: any) => (', '{product.tags?.map((t: any) => (')

# Fix forecastedQty
old_fc = '{product.type === "storable" ? <span className={product.forecastedQty > 0 ? "text-gray-900" : product.forecastedQty < 0 ? "text-red-600" : "text-gray-400"}>'
new_fc = '{product.type === "storable" ? <span className={(product.forecastedQty || 0) > 0 ? "text-gray-900" : (product.forecastedQty || 0) < 0 ? "text-red-600" : "text-gray-400"}>'
content = content.replace(old_fc, new_fc)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Fixed TS errors")
