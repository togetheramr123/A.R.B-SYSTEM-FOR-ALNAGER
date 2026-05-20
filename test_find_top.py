import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "جديد" in line or "New" in line:
        print(f"Line {i+1}: {line.strip()}")
