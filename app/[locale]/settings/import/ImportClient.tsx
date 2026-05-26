'use client';
import React from "react";

import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { importProductsData, ImportedProductRow } from '@/app/actions/importProducts';

export default function ImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const downloadExcelTemplate = () => {
    const headers = ['اسم المنتج', 'الكمية في اليد', 'بالكرتونة', 'متوسط التكلفة', 'وحدة القياس', 'الثانوية UOM', 'فئة المنتج'];
    const sampleData = [
      ['شاي ليبتون 250 جم', 150, 12, 25.5, 'قطعة', 'كرتونة', 'مشروبات'],
      ['نسكافيه كلاسيك 50 جم', 200, 24, 35.0, 'قطعة', 'كرتونة', 'مشروبات'],
      ['سكر أبيض 1 كجم', 500, 20, 18.0, 'كجم', 'شيكارة', 'مواد غذائية'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المنتجات");

    worksheet['!cols'] = [
      { wch: 25 }, // اسم المنتج
      { wch: 15 }, // الكمية في اليد
      { wch: 12 }, // بالكرتونة
      { wch: 15 }, // متوسط التكلفة
      { wch: 12 }, // وحدة القياس
      { wch: 15 }, // الثانوية UOM
      { wch: 15 }, // فئة المنتج
    ];

    XLSX.writeFile(workbook, "products_import_template.xlsx");
  };

  const processFile = async () => {
    if (!file) {
      toast.error("يرجى اختيار ملف أولاً");
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      setProgress(30);

      // The header is the first row. Find column indices.
      if (rows.length < 2) {
        throw new Error("الملف فارغ أو لا يحتوي على بيانات صحيحة.");
      }

      const headers: string[] = rows[0] as string[];
      
      const getColIndex = (keywords: string[]) => {
        // Try exact match first
        const exactMatch = headers.findIndex(h => {
          if (!h || typeof h !== 'string') return false;
          const lowerH = h.toLowerCase().trim();
          return keywords.some(kw => lowerH === kw);
        });
        if (exactMatch !== -1) return exactMatch;
        
        // Then try includes
        return headers.findIndex(h => {
          if (!h || typeof h !== 'string') return false;
          const lowerH = h.toLowerCase().trim();
          return keywords.some(kw => lowerH.includes(kw));
        });
      };

      const nameIdx = getColIndex(['اسم المنتج', 'اسم الصنف', 'الصنف', 'اسم', 'العرض', 'product', 'item', 'name']);
      const qtyIdx = getColIndex(['الكمية', 'الرصيد', 'كمية', 'رصيد', 'الكمية في اليد', 'qty', 'quantity', 'stock']);
      const cartonRatioIdx = getColIndex(['بالكرتونة', 'كرتونة', 'تعبئة', 'الكرتون', 'نسبة', 'ratio', 'carton']);
      const costIdx = getColIndex(['التكلفة', 'متوسط التكلفة', 'تكلفة', 'السعر', 'سعر', 'متوسط', 'cost', 'price']);
      const uomIdx = getColIndex(['وحدة القياس', 'الوحدة', 'وحدة', 'uom', 'unit']);
      const secUomIdx = getColIndex(['الثانوية', 'ثانوية', 'وحدة كبرى', 'sec', 'secondary']);
      const catIdx = getColIndex(['فئة المنتج', 'الفئة', 'المجموعة', 'التصنيف', 'القسم', 'فئة', 'مجموعة', 'قسم', 'تصنيف', 'category', 'group']);

      if (nameIdx === -1) {
        throw new Error("لم يتم العثور على عمود يحمل اسم 'اسم المنتج' أو 'اسم العرض'.");
      }

      const parsedRows: ImportedProductRow[] = [];

      const convertArabicToEnglishStr = (val: any) => {
        if (!val) return '';
        let str = String(val);
        const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
        for (let j = 0; j < 10; j++) {
          str = str.split(arabicDigits[j]).join(j.toString());
        }
        return str;
      };

      const parseNum = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        let str = convertArabicToEnglishStr(val).replace(/,/g, '');
        const match = str.match(/\d+(\.\d+)?/);
        return match ? Number(match[0]) : 0;
      };

      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        if (!rowData || !rowData[nameIdx]) continue; // Skip empty rows

        const name = convertArabicToEnglishStr(rowData[nameIdx]).trim();
        const qtyOnHand = qtyIdx !== -1 ? parseNum(rowData[qtyIdx]) : 0;
        let secondaryRatio = cartonRatioIdx !== -1 ? parseNum(rowData[cartonRatioIdx]) : 0;
        const cost = costIdx !== -1 ? parseNum(rowData[costIdx]) : 0;
        const uom = uomIdx !== -1 ? convertArabicToEnglishStr(rowData[uomIdx]).trim() : '';
        let secondaryUom = secUomIdx !== -1 ? convertArabicToEnglishStr(rowData[secUomIdx]).trim() : '';
        const category = catIdx !== -1 ? convertArabicToEnglishStr(rowData[catIdx]).trim() : '';

        // Removed the frontend stripping logic so we pass the full name (e.g. "كرتونه 80") to the backend where it handles it.

        parsedRows.push({
          name,
          qtyOnHand,
          secondaryRatio,
          cost,
          uom,
          secondaryUom,
          category
        });
      }

      setProgress(60);

      if (parsedRows.length === 0) {
        throw new Error("لم يتم استخراج أي بيانات صالحة من الملف.");
      }

      const res = await importProductsData(parsedRows);

      if (res.success) {
        setProgress(100);
        toast.success(`تم استيراد ${(res as any).count} منتج وتوليد جرد افتتاحي بنجاح!`);
        setTimeout(() => {
            window.location.href = '/ar/inventory/products';
        }, 2000);
      } else {
        throw new Error((res as any).error || "فشل غير معروف أثناء حفظ البيانات");
      }

    } catch (e: any) {
      console.error(e);
      toast.error(`خطأ: ${e.message}`);
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
      {/* Step 1: Download Template */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
          <div>
            <h3 className="text-lg font-medium">تجهيز القالب (Template)</h3>
            <p className="text-gray-500 text-sm mt-1 mb-3">
              قم بتحميل قالب Excel الفارغ واملأه ببيانات منتجاتك حسب الأعمدة المطلوبة. يمكنك إضافة منتجاتك والفئات ووحدات القياس ورصيد البداية.
            </p>
            <button 
              onClick={downloadExcelTemplate}
              className="inline-flex items-center gap-2 bg-green-50 border border-green-200 hover:bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              تحميل قالب Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 w-full" />

      {/* Step 2: Upload */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
          <div className="w-full">
            <h3 className="text-lg font-medium">رفع الملف (Upload)</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              ارفع الملف بعد تعبئته. يمكنك رفع ملف Excel (.xlsx, .xls) أو ملف CSV.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <input autoComplete="off" autoCorrect="off" spellCheck={false}
                type="file"
                id="file-upload"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-primary">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <span className="text-gray-600 font-medium hover:text-primary transition-colors">
                  {file ? file.name : 'اضغط هنا لاختيار ملف'}
                </span>
                <span className="text-gray-400 text-xs">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Excel أو CSV فقط'}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 w-full" />

      {/* Step 3: Process */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
          <div className="w-full">
            <h3 className="text-lg font-medium">معالجة البيانات واستيرادها</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              سيقوم النظام بإنشاء الفئات ووحدات القياس غير الموجودة، ومن ثم تسجيل الأصناف بالرصيد الافتتاحي في محضر جرد.
            </p>
            
            <button
              onClick={processFile}
              disabled={!file || isProcessing}
              className={`w-full md:w-auto px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                !file ? 'bg-gray-200 text-gray-500 cursor-not-allowed' :
                isProcessing ? 'bg-primary/80 text-white cursor-wait' :
                'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري معالجة البيانات... {progress}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  بدء الاستيراد
                </>
              )}
            </button>
            
            {progress === 100 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">تمت عملية الاستيراد بنجاح! سيتم تحويلك إلى صفحة المنتجات.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
