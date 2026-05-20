with open("task.md", "r") as f:
    content = f.read()

content = content.replace("- [/] Create `components/common/ExportDialog.tsx` component", "- [x] Create `components/common/ExportDialog.tsx` component")
content = content.replace("- [ ] Implement UI for Available vs Selected Fields (with add/remove buttons)", "- [x] Implement UI for Available vs Selected Fields (with add/remove buttons)")
content = content.replace("- [ ] Implement actual export logic using `xlsx` library", "- [x] Implement actual export logic using `xlsx` library")
content = content.replace("- [ ] Remove floating action bar in `components/inventory/ProductListClient.tsx`", "- [x] Remove floating action bar in `components/inventory/ProductListClient.tsx`")
content = content.replace("- [ ] Create Odoo-style \"إجراء\" (Action) top bar dropdown", "- [x] Create Odoo-style \"إجراء\" (Action) top bar dropdown")
content = content.replace("- [ ] Wire up \"تصدير\" to open Export Dialog", "- [x] Wire up \"تصدير\" to open Export Dialog")
content = content.replace("- [ ] Test Export functionality", "- [x] Test Export functionality")

with open("task.md", "w") as f:
    f.write(content)
