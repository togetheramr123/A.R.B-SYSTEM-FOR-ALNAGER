import re

with open("app/[locale]/inventory/products/page.tsx", "r") as f:
    content = f.read()

type_labels_regex = r'  const typeLabels: Record<string, \{.*?\};'
match = re.search(type_labels_regex, content, re.DOTALL)
if match:
    type_labels_code = match.group(0)
    content = content.replace(type_labels_code, "")
    
    # insert before `let groupSummaries`
    content = content.replace("  let groupSummaries = undefined;", f"{type_labels_code}\n  let groupSummaries = undefined;")
    
    with open("app/[locale]/inventory/products/page.tsx", "w") as f:
        f.write(content)
    print("Fixed typeLabels position")
else:
    print("Could not find typeLabels")
