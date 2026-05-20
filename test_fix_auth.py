import re

with open("app/actions/inventory.ts", "r") as f:
    content = f.read()

# Replace auth() with getSession()
content = content.replace("const session = await auth();", "const session = await getSession();")

with open("app/actions/inventory.ts", "w") as f:
    f.write(content)

print("Fixed auth call in inventory.ts")
