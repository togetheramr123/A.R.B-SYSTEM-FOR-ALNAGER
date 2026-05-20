with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

start = content.find('{/* Column Picker */}')
end = content.find('</div>', content.find('</div>', start) + 5) + 6
print(content[start:end+100])
