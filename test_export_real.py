import re

with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# Make sure getProductsForExport is imported
if 'getProductsForExport' not in content:
    content = content.replace('import { getProductIdsByFilter, fetchProductsForGroup } from "@/app/actions/inventory";', 'import { getProductIdsByFilter, fetchProductsForGroup, getProductsForExport } from "@/app/actions/inventory";')

# Import XLSX
if 'import * as XLSX from "xlsx";' not in content:
    content = content.replace('import { useSession } from "next-auth/react";', 'import { useSession } from "next-auth/react";\nimport * as XLSX from "xlsx";')

real_export_logic = """
  const handleExport = async (format: "csv" | "xlsx", selectedFields: string[]) => {
    setIsExporting(true);
    try {
      // 1. Fetch data from server
      let idsToExport = Array.from(selectedIds);
      if (allPageSelected) {
          // If they clicked select all, fetch based on filter instead of ids
          idsToExport = []; 
      }
      const dataToExport = await getProductsForExport(idsToExport, currentFilter, session?.user?.companyId as string);
      
      // 2. Map data to selected columns only
      const fieldLabels = AVAILABLE_COLUMNS.reduce((acc: any, col) => ({...acc, [col.id]: col.label}), {});
      
      const mappedData = dataToExport.map((row: any) => {
        const newRow: any = {};
        selectedFields.forEach(fieldId => {
          newRow[fieldLabels[fieldId] || fieldId] = row[fieldId] ?? "";
        });
        return newRow;
      });

      // 3. Generate file
      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      
      if (format === "csv") {
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob(["\\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        XLSX.writeFile(workbook, `products_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
      
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };
"""

# Replace the dummy logic with real logic
old_logic_regex = r'const handleExport = async \(format: "csv" \| "xlsx", selectedFields: string\[\]\) => \{.*?\};\n'
content = re.sub(old_logic_regex, real_export_logic, content, flags=re.DOTALL)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Added real export logic")
