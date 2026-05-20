import re
with open("app/actions/inventory.ts", "r") as f:
    content = f.read()

# Change fetchProductsForGroup
content = content.replace("export async function fetchProductsForGroup(companyId: string, groupBy: string, groupKey: string) {", 
                          "export async function fetchProductsForGroup(groupBy: string, groupKey: string) {\n  const session = await auth();\n  const companyId = session?.user?.companyId;\n  if (!companyId) return [];")

with open("app/actions/inventory.ts", "w") as f:
    f.write(content)

print("Fixed action")
