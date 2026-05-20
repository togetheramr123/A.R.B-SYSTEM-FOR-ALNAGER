import re

with open("app/actions/inventory.ts", "r") as f:
    content = f.read()

# Fix session?.user?.companyId -> session?.companyId
content = content.replace("const companyId = session?.user?.companyId;", "const companyId = session?.companyId;")

with open("app/actions/inventory.ts", "w") as f:
    f.write(content)

print("Fixed companyId access in inventory.ts")
