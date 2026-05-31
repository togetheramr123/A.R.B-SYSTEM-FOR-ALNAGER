'use client';
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { importPartnersData, PartnerImportData } from '@/app/actions/importPartners';

export default function ImportPartnersClient() {
  const [balanceFile, setBalanceFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const downloadTemplates = () => {
    // 1. Balance Template
    const wb1 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb1, XLSX.utils.aoa_to_sheet([['العميل', 'الرصيد', 'نوع']]), 'الأرصدة');
    XLSX.writeFile(wb1, 'template_balances_2025.xlsx');

    // 2. Invoice Template
    const wb2 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet([['العميل', 'رقم الفاتورة', 'التاريخ', 'الإجمالي']]), 'الفواتير');
    XLSX.writeFile(wb2, 'template_invoices_2026.xlsx');

    // 3. Payment Template
    const wb3 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb3, XLSX.utils.aoa_to_sheet([['العميل', 'رقم السند', 'التاريخ', 'المبلغ']]), 'المدفوعات');
    XLSX.writeFile(wb3, 'template_payments_2026.xlsx');
  };

  const processFiles = async () => {
    if (!balanceFile && !invoiceFile && !paymentFile) {
      toast.error("يرجى رفع ملف واحد على الأقل.");
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const partnersMap = new Map<string, PartnerImportData>();

      const getPartner = (name: string): PartnerImportData => {
        const cleanName = name.trim();
        if (!partnersMap.has(cleanName)) {
          partnersMap.set(cleanName, {
            name: cleanName,
            phone: '',
            email: '',
            type: 'customer', // Default, we can try to guess from vendor bill
            balance2025: 0,
            invoices: [],
            payments: []
          });
        }
        return partnersMap.get(cleanName)!;
      };

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
        return Number(str) || 0;
      };

      const getColIndex = (headers: string[], keywords: string[]) => {
        const exactMatch = headers.findIndex(h => {
          if (!h || typeof h !== 'string') return false;
          const lowerH = h.toLowerCase().trim();
          return keywords.some(kw => lowerH === kw);
        });
        if (exactMatch !== -1) return exactMatch;
        return headers.findIndex(h => {
          if (!h || typeof h !== 'string') return false;
          const lowerH = h.toLowerCase().trim();
          return keywords.some(kw => lowerH.includes(kw));
        });
      };

      // 1. Parse Balances
      if (balanceFile) {
        const data = await balanceFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const rows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        if (rows.length > 1) {
          const headers = rows[0];
          const nameIdx = getColIndex(headers, ['العميل', 'المورد', 'شريك', 'customer', 'partner', 'name']);
          const balIdx = getColIndex(headers, ['رصيد', 'مستحق', 'balance', 'due', 'مبلغ', 'amount', 'residual']);
          const typeIdx = getColIndex(headers, ['نوع', 'type']);
          
          if (nameIdx !== -1 && balIdx !== -1) {
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || !row[nameIdx]) continue;
              const p = getPartner(convertArabicToEnglishStr(row[nameIdx]));
              p.balance2025 += parseNum(row[balIdx]);
              if (typeIdx !== -1 && convertArabicToEnglishStr(row[typeIdx]).toLowerCase().includes('مورد')) {
                p.type = 'vendor';
              }
            }
          } else {
             toast.error("لم يتم العثور على عمود العميل أو الرصيد في ملف أرصدة 2025.");
          }
        }
      }

      setProgress(40);

      // 2. Parse Invoices
      if (invoiceFile) {
        const data = await invoiceFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const rows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        if (rows.length > 1) {
          const headers = rows[0];
          const nameIdx = getColIndex(headers, ['العميل', 'المورد', 'شريك', 'customer', 'partner']);
          const dateIdx = getColIndex(headers, ['تاريخ', 'date']);
          const numIdx = getColIndex(headers, ['رقم', 'number', 'فاتورة', 'invoice']);
          const totalIdx = getColIndex(headers, ['إجمالي', 'مبلغ', 'total', 'amount', 'tax']);
          const typeIdx = getColIndex(headers, ['نوع', 'type', 'bill', 'فاتورة مشتريات']);
          
          if (nameIdx !== -1 && totalIdx !== -1) {
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || !row[nameIdx]) continue;
              const p = getPartner(convertArabicToEnglishStr(row[nameIdx]));
              
              if (typeIdx !== -1 && (convertArabicToEnglishStr(row[typeIdx]).includes('مورد') || convertArabicToEnglishStr(row[typeIdx]).toLowerCase().includes('bill'))) {
                p.type = 'vendor';
              }

              let dateObj = new Date();
              if (dateIdx !== -1 && row[dateIdx]) {
                 if (typeof row[dateIdx] === 'number') {
                    // Excel serial date
                    dateObj = new Date((row[dateIdx] - (25567 + 2)) * 86400 * 1000);
                 } else {
                    dateObj = new Date(row[dateIdx]);
                    if (isNaN(dateObj.getTime())) dateObj = new Date();
                 }
              }

              p.invoices.push({
                number: numIdx !== -1 ? convertArabicToEnglishStr(row[numIdx]) : `INV-${Date.now()}-${i}`,
                date: dateObj,
                total: parseNum(row[totalIdx])
              });
            }
          } else {
             toast.error("لم يتم العثور على عمود العميل أو الإجمالي في ملف فواتير 2026.");
          }
        }
      }

      setProgress(70);

      // 3. Parse Payments
      if (paymentFile) {
        const data = await paymentFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const rows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        if (rows.length > 1) {
          const headers = rows[0];
          const nameIdx = getColIndex(headers, ['العميل', 'المورد', 'شريك', 'customer', 'partner']);
          const dateIdx = getColIndex(headers, ['تاريخ', 'date']);
          const memoIdx = getColIndex(headers, ['بيان', 'مرجع', 'رقم', 'memo', 'ref', 'name']);
          const amountIdx = getColIndex(headers, ['مبلغ', 'قيمة', 'amount', 'total']);
          
          if (nameIdx !== -1 && amountIdx !== -1) {
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || !row[nameIdx]) continue;
              const p = getPartner(convertArabicToEnglishStr(row[nameIdx]));
              
              let dateObj = new Date();
              if (dateIdx !== -1 && row[dateIdx]) {
                 if (typeof row[dateIdx] === 'number') {
                    dateObj = new Date((row[dateIdx] - (25567 + 2)) * 86400 * 1000);
                 } else {
                    dateObj = new Date(row[dateIdx]);
                    if (isNaN(dateObj.getTime())) dateObj = new Date();
                 }
              }

              p.payments.push({
                memo: memoIdx !== -1 ? convertArabicToEnglishStr(row[memoIdx]) : `PAY-${Date.now()}-${i}`,
                date: dateObj,
                amount: parseNum(row[amountIdx])
              });
            }
          } else {
             toast.error("لم يتم العثور على عمود العميل أو المبلغ في ملف مدفوعات 2026.");
          }
        }
      }

      const partnersList = Array.from(partnersMap.values());
      
      if (partnersList.length === 0) {
        throw new Error("لم يتم العثور على أي بيانات صحيحة للاستيراد.");
      }

      setProgress(85);

      const res = await importPartnersData(partnersList);

      if (res.success) {
        setProgress(100);
        toast.success(`تم استيراد ${(res as any).count} شريك، و ${(res as any).invoices} فاتورة، و ${(res as any).payments} دفعة بنجاح!`);
        setTimeout(() => {
            window.location.href = '/ar/accounting/customers';
        }, 3000);
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

  const FileUploader = ({ label, desc, file, setFile, accept = ".xlsx, .xls, .csv" }: any) => (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
      <h4 className="font-bold text-slate-800 mb-2">{label}</h4>
      <p className="text-slate-500 text-xs mb-4">{desc}</p>
      <input autoComplete="off" autoCorrect="off" spellCheck={false}
        type="file"
        id={`file-${label}`}
        accept={accept}
        className="hidden"
        onChange={(e) => handleFileUpload(e, setFile)}
        disabled={isProcessing}
      />
      <label 
        htmlFor={`file-${label}`} 
        className="cursor-pointer flex flex-col items-center justify-center gap-2"
      >
        <div className={`w-12 h-12 rounded-full shadow-sm border flex items-center justify-center transition-colors ${file ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-blue-600'}`}>
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <span className={`font-medium transition-colors ${file ? 'text-green-700' : 'text-slate-600 hover:text-blue-600'}`}>
          {file ? file.name : 'اضغط لاختيار ملف'}
        </span>
      </label>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800">
        <Users className="w-6 h-6 shrink-0 text-blue-600" />
        <div>
          <h3 className="font-bold text-blue-900">استيراد التاريخ المحاسبي للعملاء والموردين</h3>
          <p className="text-sm mt-1">هذه الأداة مخصصة لرفع الأرصدة الافتتاحية السابقة، مع فواتير الشهور الماضية (إن وُجدت) والمدفوعات لتكوين كشف حساب متصل ومطابق لنظامك السابق.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FileUploader 
          label="1. أرصدة نهاية 2025" 
          desc="ملف يحتوي على مديونية العملاء السابقة (اسم العميل، الرصيد الافتتاحي)."
          file={balanceFile} 
          setFile={setBalanceFile} 
        />
        <FileUploader 
          label="2. فواتير 2026 (إن وجد)" 
          desc="كافة فواتير المبيعات الصادرة هذا العام (العميل، رقم الفاتورة، التاريخ، الإجمالي)."
          file={invoiceFile} 
          setFile={setInvoiceFile} 
        />
        <FileUploader 
          label="3. مدفوعات 2026 (إن وجد)" 
          desc="كافة دفعات وسندات القبض المسددة هذا العام (العميل، التاريخ، السند، المبلغ)."
          file={paymentFile} 
          setFile={setPaymentFile} 
        />
      </div>

      <div className="h-px bg-slate-100 w-full" />

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 w-full justify-center">
          <button
            onClick={downloadTemplates}
            className="px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm"
          >
            تحميل القوالب (Excel)
          </button>
          
          <button
            onClick={processFiles}
            disabled={(!balanceFile && !invoiceFile && !paymentFile) || isProcessing}
            className={`px-10 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              (!balanceFile && !invoiceFile && !paymentFile) ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
              isProcessing ? 'bg-blue-600/80 text-white cursor-wait' :
              'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري المطابقة والمعالجة... {progress}%
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                بدء الاستيراد وتوليد القيود
              </>
            )}
          </button>
        </div>
        
        {progress === 100 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700 w-full max-w-2xl justify-center">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">عملية استيراد الشركاء ناجحة 100%! جاري تحويلك لحسابات العملاء...</span>
          </div>
        )}
      </div>
    </div>
  );
}
