import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

content = content.replace("  pagination: {\n    currentPage: number;\n    totalPages: number;\n    startRecord: number;\n    endRecord: number;\n    prevUrl?: string;\n    nextUrl?: string;\n  };\n}", "  pagination: {\n    currentPage: number;\n    totalPages: number;\n    startRecord: number;\n    endRecord: number;\n    prevUrl?: string;\n    nextUrl?: string;\n  };\n  groupSummaries?: any[];\n}")

content = content.replace("  pagination\n}: ProductListClientProps) {", "  pagination,\n  groupSummaries = []\n}: ProductListClientProps) {")

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Fixed")
