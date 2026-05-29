"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveContractClauses } from "@/app/actions/contracts";
import { toast } from "sonner";
import { Save, Printer, ArrowRight, Edit3, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function ContractEditor({ contract, templates, locale, isReadonly = false }: { contract: any, templates: any[], locale: string, isReadonly?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clauses, setClauses] = useState<any[]>(contract.clauses || []);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(contract.templateId || "");

  // Helper to replace placeholders
  const fillPlaceholders = (text: string) => {
    if (!text) return "";
    let res = text;
    res = res.replace(/\{\{employee\.name\}\}/g, contract.employee?.name || "");
    res = res.replace(/\{\{wage\}\}/g, contract.wage ? Number(contract.wage).toLocaleString() : "");
    res = res.replace(/\{\{jobTitle\}\}/g, contract.employee?.jobTitle || "غير محدد");
    return res;
  };

  const handleTemplateSelect = (e: any) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    if (tId) {
      const template = templates.find(t => t.id === tId);
      if (template) {
        // apply clauses and fill placeholders
        const newClauses = template.clauses.map((c: any) => ({
          title: fillPlaceholders(c.title),
          content: fillPlaceholders(c.content),
          sequence: c.sequence
        }));
        setClauses(newClauses);
      }
    } else {
      setClauses([]);
    }
  };

  const updateClause = (index: number, field: string, value: string) => {
    const newClauses = [...clauses];
    newClauses[index][field] = value;
    setClauses(newClauses);
  };

  const saveContract = async () => {
    setLoading(true);
    try {
      await saveContractClauses(contract.id, clauses, selectedTemplateId);
      toast.success("تم حفظ العقد بنجاح");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const printContract = async () => {
    // We try to use html2pdf for direct download if requested, else default print
    try {
      const element = document.getElementById('contract-print-view');
      if (!element) {
        window.print();
        return;
      }
      
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       0,
        filename:     `contract-${contract.id || 'draft'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Temporarily hide elements that shouldn't be in PDF
      const editableIcons = element.querySelectorAll('.print\\:hidden');
      editableIcons.forEach(el => (el as HTMLElement).style.display = 'none');
      
      await html2pdf().set(opt).from(element).save();
      
      // Restore elements
      editableIcons.forEach(el => (el as HTMLElement).style.display = '');
    } catch (e) {
      console.error("PDF Generation failed, falling back to print", e);
      window.print();
    }
  };

  const activeTemplate = templates.find(t => t.id === selectedTemplateId);
  const companyName = activeTemplate?.company?.name || "الشركة";

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 h-full print:p-0 print:bg-white bg-gray-50 min-h-screen">
      
      {/* Sidebar / Tools - Hidden on print and if readonly */}
      {!isReadonly && (
        <div className="w-full md:w-80 space-y-6 print:hidden flex-shrink-0">
          <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200">
            <Link href={`/${locale}/hr/contracts`} className="text-sm font-bold text-gray-500 hover:text-indigo-600 mb-6 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" /> العودة للعقود
            </Link>
          
          <h2 className="text-xl font-bold mb-4">إعدادات العقد</h2>
          
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500 block mb-1">الموظف</label>
            <div className="font-bold text-gray-900 bg-gray-50 p-2 rounded-sm border">
              {contract.employee?.name}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 block mb-1">اختيار القالب</label>
            <select 
              value={selectedTemplateId} 
              onChange={handleTemplateSelect}
              className="w-full border rounded-sm px-3 py-2 text-sm bg-white"
            >
              <option value="">-- اختر قالب العقد --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={saveContract} disabled={loading || clauses.length === 0} className="btn-primary w-full justify-center">
              <Save className="w-4 h-4" /> حفظ التعديلات
            </button>
            <button onClick={printContract} disabled={clauses.length === 0} className="btn-secondary w-full justify-center text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100">
              <Printer className="w-4 h-4" /> حفظ PDF / طباعة
            </button>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <label className="text-xs font-bold text-gray-500 block mb-3">إرفاق نسخة العقد الموقعة</label>
            <div className="border-2 border-dashed border-gray-300 rounded-sm p-4 text-center hover:bg-gray-50 cursor-pointer relative transition-colors">
              <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                type="file" 
                accept="application/pdf" 
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    toast.success("تم تحديد الملف: " + e.target.files[0].name + " (سيتم برمجة الرفع السحابي لاحقاً)");
                  }
                }}
              />
              <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-xs font-bold text-gray-600 mb-1">اضغط لرفع ملف PDF</div>
              <div className="text-[10px] text-gray-400">الحد الأقصى 5MB</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-sm border border-blue-100 text-sm text-blue-800">
          <strong>تلميح:</strong> لطباعة العقد بشكل مثالي، تأكد من تفعيل "Background graphics" وإلغاء "Headers and footers" في إعدادات الطباعة.
        </div>
      </div>
      )}

      {isReadonly && (
        <div className="print:hidden w-full md:w-48 flex-shrink-0">
          <button onClick={printContract} className="btn-primary w-full justify-center mb-4">
            <Printer className="w-4 h-4" /> حفظ PDF / طباعة
          </button>
          <div className="bg-blue-50 p-4 rounded-sm border border-blue-100 text-xs text-blue-800 leading-relaxed">
            للحصول على أفضل نتيجة، اختر طباعة على ورق A4 وتأكد من تفعيل "طباعة الخلفيات والألوان" (Background graphics).
          </div>
        </div>
      )}

      {/* A4 Paper View */}
      <div className="flex-1 overflow-auto print:overflow-visible">
        {/* A4 Wrapper */}
        <div id="contract-print-view" className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-xl print:shadow-none print:w-full print:h-auto print:min-h-0 relative p-4 print:p-0 mb-12">
          <div className="border-[12px] border-slate-800 p-1 w-full min-h-[285mm] print:border-[6px] print:min-h-0 print:h-auto">
            <div className="border-[3px] border-double border-slate-300 p-8 w-full min-h-[277mm] relative bg-white print:min-h-0 print:h-auto print:p-4 pb-12 print:pb-6">
              
              {/* Header with Logos */}
              <div className="flex justify-between items-center border-b-2 border-slate-800 pb-2 mb-2 print:pb-1 print:mb-2">
                <div className="w-24 h-12 print:h-10 print:w-20 bg-slate-50 rounded-sm flex items-center justify-center border border-slate-200 relative overflow-hidden">
                  {companyName.toLowerCase().includes("hon") ? (
                <div className="text-blue-800 font-black text-2xl tracking-tighter">H<span className="text-red-600">O</span>N</div>
              ) : companyName.toLowerCase().includes("nagar") ? (
                <div className="text-blue-900 font-black text-xl tracking-widest flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-blue-900 mb-1"></div>
                  EL NAGAR
                </div>
                  ) : (
                    <div className="text-slate-800 font-black text-xl tracking-widest flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center mb-1">C</div>
                      {companyName.substring(0, 10)}
                    </div>
                  )}
                </div>
                <div className="text-center flex-1 px-4">
                  <h1 className="text-3xl font-black font-serif mb-1 text-slate-900 tracking-wider">عـقــد عـمــل</h1>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Employment Contract</p>
                </div>
                <div className="w-32 print:w-24 text-left text-[10px] print:text-[8px] font-bold text-slate-500 space-y-0.5 bg-slate-50 p-1.5 print:p-1 border border-slate-100">
                  <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                  <p>Ref: {contract.id.split('-')[0].toUpperCase()}</p>
                </div>
              </div>

          {/* Intro text */}
          <div className="mb-4 print:mb-2 leading-snug print:leading-tight text-justify text-[13px] md:text-sm print:text-[11px]">
            تم الاتفاق في هذا اليوم الموافق <strong>{new Date().toLocaleDateString('ar-EG')}</strong> بين كل من:
            <br/>
            <strong>الطرف الأول:</strong> {companyName}، ويمثلها قانونياً السيد / ____________________
            <br/>
            <strong>الطرف الثاني:</strong> السيد/ة <strong>{contract.employee?.name}</strong>، ويحمل هوية رقم (____________________).
            <br/>
            اتفق الطرفان وهما بكامل أهليتهما القانونية للتعاقد على البنود التالية:
          </div>

          {/* Clauses */}
          <div className="space-y-3 print:space-y-1 mb-8 print:mb-4">
            {clauses.map((clause, i) => (
              <div key={i} className="group relative break-inside-avoid mb-4">
                {!isReadonly && (
                  <div className="absolute -right-8 top-0 print:hidden opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                    <Edit3 className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                
                <h3 className="font-bold text-base print:text-[12px] mb-1 print:mb-0.5">
                  {isReadonly ? (
                    <span>{clause.title}</span>
                  ) : (
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                      value={clause.title}
                      onChange={e => updateClause(i, "title", e.target.value)}
                      className="w-full bg-transparent border-none outline-none focus:bg-yellow-50 print:focus:bg-transparent print:p-0 print:m-0"
                    />
                  )}
                </h3>
                <div className="text-gray-800 leading-snug print:leading-tight text-justify whitespace-pre-wrap text-[13px] md:text-sm print:text-[10px]">
                  {isReadonly ? (
                    <div>{clause.content}</div>
                  ) : (
                    <textarea
                      value={clause.content}
                      onChange={e => updateClause(i, "content", e.target.value)}
                      className="w-full bg-transparent border-none outline-none focus:bg-yellow-50 print:focus:bg-transparent resize-none overflow-hidden"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                      }}
                      ref={el => {
                        if (el) {
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            {clauses.length === 0 && (
              <div className="text-center text-gray-400 py-12 border-2 border-dashed rounded-sm print:hidden">
                الرجاء اختيار قالب لبدء العقد
              </div>
            )}
          </div>

          {/* Signatures & Footer Stamp */}
          <div className="mt-8 print:mt-4 pt-4 print:pt-2 border-t-2 border-dashed border-slate-200 grid grid-cols-3 gap-8 print:gap-2 break-inside-avoid">
            <div className="text-center">
              <h4 className="font-bold mb-10 print:mb-6 text-slate-800 text-sm md:text-base print:text-[11px]">الطرف الأول (صاحب العمل)</h4>
              <div className="border-b-2 border-slate-300 w-4/5 mx-auto mb-2 print:mb-1"></div>
              <p className="text-xs print:text-[9px] font-bold text-slate-500">التوقيع</p>
            </div>
            
            <div className="text-center relative">
              <h4 className="font-bold mb-4 print:mb-2 text-slate-800 text-sm md:text-base print:text-[11px]">الختم المعتمد</h4>
              {/* Professional Stamp */}
              <div className="mx-auto w-24 h-24 print:w-16 print:h-16 border-4 print:border-2 border-slate-800/20 rounded-full flex flex-col items-center justify-center relative rotate-[-15deg]">
                <div className="absolute inset-1.5 print:inset-1 border-2 print:border border-dashed border-slate-800/20 rounded-full"></div>
                <span className="text-[10px] print:text-[7px] font-black text-slate-800/30 uppercase leading-none">{companyName.substring(0, 10)}</span>
                <span className="text-[8px] print:text-[5px] font-bold text-slate-800/30">OFFICIAL SEAL</span>
                <div className="text-slate-800/20 text-[8px] print:text-[5px] mt-0.5">★ ★ ★</div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-bold mb-10 print:mb-6 text-slate-800 text-sm md:text-base print:text-[11px]">الطرف الثاني (الموظف)</h4>
              <div className="border-b-2 border-slate-300 w-4/5 mx-auto mb-2 print:mb-1"></div>
              <p className="text-xs print:text-[9px] font-bold text-slate-500">التوقيع / البصمة</p>
            </div>
          </div>

          <div className="mt-12 text-center text-[10px] text-slate-400 font-bold print:block">
            وثيقة معتمدة وموثقة من نظام الموارد البشرية - {companyName}
          </div>

            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
