"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContractTemplate, updateContractTemplate } from "@/app/actions/contracts";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Edit, Save, X, GripVertical, Printer } from "lucide-react";

export function TemplatesManager({ templates, companies }: { templates: any[], companies: any[] }) {
  const router = useRouter();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const startNew = () => {
    setEditingTemplate({
      name: "قالب جديد",
      companyId: companies[0]?.id || "",
      clauses: [
        { title: "المادة الأولى: الوظيفة", content: "يعمل الطرف الثاني بمهنة {{jobTitle}}", sequence: 10 },
        { title: "المادة الثانية: الراتب", content: "يتقاضى الطرف الثاني راتباً قدره {{wage}}", sequence: 20 },
      ]
    });
  };

  const saveTemplate = async () => {
    setLoading(true);
    try {
      if (editingTemplate.id) {
        await updateContractTemplate(editingTemplate.id, editingTemplate);
        toast.success("تم تحديث القالب");
      } else {
        await createContractTemplate(editingTemplate);
        toast.success("تم إنشاء القالب");
      }
      setEditingTemplate(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const addClause = () => {
    setEditingTemplate((prev: any) => ({
      ...prev,
      clauses: [...prev.clauses, { title: "مادة جديدة", content: "", sequence: (prev.clauses.length + 1) * 10 }]
    }));
  };

  const removeClause = (index: number) => {
    setEditingTemplate((prev: any) => {
      const newClauses = [...prev.clauses];
      newClauses.splice(index, 1);
      return { ...prev, clauses: newClauses };
    });
  };

  const updateClause = (index: number, field: string, value: string) => {
    setEditingTemplate((prev: any) => {
      const newClauses = [...prev.clauses];
      newClauses[index] = { ...newClauses[index], [field]: value };
      return { ...prev, clauses: newClauses };
    });
  };

  const printTemplate = async (templateId: string) => {
    try {
      const element = document.getElementById('template-print-view');
      if (!element) {
        window.print();
        return;
      }
      
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       0,
        filename:     `template-${templateId || 'draft'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      element.classList.remove('hidden');
      
      await html2pdf().set(opt).from(element).save();
      
      element.classList.add('hidden');
    } catch (e) {
      console.error("PDF Generation failed, falling back to print", e);
      window.print();
    }
  };

  if (editingTemplate) {
    const activeCompany = companies.find(c => c.id === editingTemplate.companyId);
    const companyName = activeCompany?.name || "الشركة";

    return (
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6 print:p-0 print:border-none print:shadow-none">
        <div className="flex justify-between items-center mb-6 border-b pb-4 print:hidden">
          <h2 className="text-xl font-bold">تعديل قالب العقد</h2>
          <div className="flex gap-2">
            <button onClick={() => printTemplate(editingTemplate.id)} className="btn-secondary text-gray-600 bg-gray-50 hover:bg-gray-100">
              <Printer className="w-4 h-4" /> حفظ PDF / طباعة
            </button>
            <button onClick={() => setEditingTemplate(null)} className="btn-secondary">
              <X className="w-4 h-4" /> إلغاء
            </button>
            <button onClick={saveTemplate} disabled={loading} className="btn-primary">
              <Save className="w-4 h-4" /> حفظ القالب
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 print:hidden">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">اسم القالب</label>
            <input autoComplete="off" autoCorrect="off" spellCheck={false} 
              value={editingTemplate.name} 
              onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} 
              className="w-full border rounded-sm px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">الفرع / الشركة المرتبطة</label>
            <select 
              value={editingTemplate.companyId} 
              onChange={e => setEditingTemplate({...editingTemplate, companyId: e.target.value})} 
              className="w-full border rounded-sm px-3 py-2 text-sm"
            >
              <option value="">-- اختياري --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 print:hidden">
          <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-sm border border-indigo-100 print:hidden">
            <span className="text-sm font-bold text-indigo-800">مواد وبنود العقد</span>
            <button onClick={addClause} className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 font-bold">
              <Plus className="w-3.5 h-3.5" /> إضافة مادة
            </button>
          </div>

          {editingTemplate.clauses.map((clause: any, i: number) => (
            <div key={i} className="flex gap-3 items-start border border-gray-200 p-4 rounded-sm bg-gray-50 relative group print:border-none print:p-0 print:bg-white">
              <div className="pt-2 text-gray-400 cursor-grab print:hidden">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-3 print:space-y-1">
                <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                  value={clause.title} 
                  onChange={e => updateClause(i, "title", e.target.value)} 
                  placeholder="عنوان المادة (مثل: المادة الأولى)"
                  className="w-full border rounded-sm px-3 py-2 font-bold text-sm bg-white print:border-none print:p-0 print:text-lg"
                />
                <textarea 
                  value={clause.content} 
                  onChange={e => updateClause(i, "content", e.target.value)} 
                  placeholder="نص المادة..."
                  className="w-full border rounded-sm px-3 py-2 text-sm bg-white min-h-[80px] print:border-none print:p-0 print:resize-none print:overflow-hidden"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />
                <div className="text-[10px] text-gray-400 print:hidden">
                  يمكنك استخدام المتغيرات: {'{{employee.name}}'}, {'{{wage}}'}, {'{{jobTitle}}'}
                </div>
              </div>
              <button onClick={() => removeClause(i)} className="text-gray-400 hover:text-red-500 mt-2 print:hidden">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* A4 Print View (Hidden on screen, visible on print or PDF generation) */}
        <div id="template-print-view" className="hidden print:block w-[210mm] min-h-[297mm] bg-white mx-auto shadow-none relative print:w-full print:h-auto print:min-h-0 print:p-0 mb-12">
          <div className="border-[8px] border-slate-800 p-1 w-full min-h-[285mm] print:border-[6px] print:min-h-0 print:h-auto">
            <div className="border-[3px] border-double border-slate-300 p-8 w-full min-h-[277mm] relative bg-white print:min-h-0 print:h-auto print:p-4 pb-12 print:pb-6">
              
              {/* Header with Logos */}
              <div className="flex justify-between items-center border-b-2 border-slate-800 pb-3 mb-4">
                <div className="w-24 h-12 bg-slate-50 rounded-sm flex items-center justify-center border border-slate-200 relative overflow-hidden">
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
                <div className="w-32 text-left text-[10px] font-bold text-slate-500 space-y-1 bg-slate-50 p-1.5 border border-slate-100">
                  <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                  <p>Ref: TEMPLATE</p>
                </div>
              </div>

              {/* Intro text */}
              <div className="mb-4 leading-snug text-justify text-[13px] md:text-sm">
                تم الاتفاق في هذا اليوم الموافق <strong>{new Date().toLocaleDateString('ar-EG')}</strong> بين كل من:
                <br/>
                <strong>الطرف الأول:</strong> {companyName}، ويمثلها قانونياً السيد / ____________________
                <br/>
                <strong>الطرف الثاني:</strong> السيد/ة <strong>____________________</strong>، ويحمل هوية رقم (____________________).
                <br/>
                اتفق الطرفان وهما بكامل أهليتهما القانونية للتعاقد على البنود التالية:
              </div>

              {/* Clauses */}
              <div className="space-y-3 mb-8">
                {editingTemplate.clauses.map((clause: any, i: number) => (
                  <div key={i} className="break-inside-avoid mb-4">
                    <h3 className="font-bold text-base mb-1">{clause.title}</h3>
                    <div className="text-gray-800 leading-snug text-justify whitespace-pre-wrap text-[13px] md:text-sm">
                      {clause.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Signatures & Footer Stamp */}
              <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-200 grid grid-cols-3 gap-8 break-inside-avoid">
                <div className="text-center">
                  <h4 className="font-bold mb-10 text-slate-800 text-sm md:text-base">الطرف الأول (صاحب العمل)</h4>
                  <div className="border-b-2 border-slate-300 w-4/5 mx-auto mb-2"></div>
                  <p className="text-xs font-bold text-slate-500">التوقيع</p>
                </div>
                
                <div className="text-center relative">
                  <h4 className="font-bold mb-4 text-slate-800 text-sm md:text-base">الختم المعتمد</h4>
                  {/* Professional Stamp */}
                  <div className="mx-auto w-24 h-24 border-4 border-slate-800/20 rounded-full flex flex-col items-center justify-center relative rotate-[-15deg]">
                    <div className="absolute inset-1.5 border-2 border-dashed border-slate-800/20 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-800/30 uppercase leading-none">{companyName.substring(0, 10)}</span>
                    <span className="text-[8px] font-bold text-slate-800/30">OFFICIAL SEAL</span>
                    <div className="text-slate-800/20 text-[8px] mt-0.5">★ ★ ★</div>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="font-bold mb-10 text-slate-800 text-sm md:text-base">الطرف الثاني (الموظف)</h4>
                  <div className="border-b-2 border-slate-300 w-4/5 mx-auto mb-2"></div>
                  <p className="text-xs font-bold text-slate-500">التوقيع / البصمة</p>
                </div>
              </div>

              <div className="mt-12 text-center text-[10px] text-slate-400 font-bold print:block">
                نموذج وثيقة معتمدة وموثقة من نظام الموارد البشرية - {companyName}
              </div>

            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">قوالب العقود</h1>
          <p className="text-sm text-gray-500">إدارة النماذج الجاهزة لعقود الموظفين</p>
        </div>
        <button onClick={startNew} className="btn-primary">
          <Plus className="w-4 h-4" /> قالب جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white border border-gray-200 rounded-sm p-5 hover:border-indigo-300 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-gray-900">{t.name}</h3>
              </div>
              <button onClick={() => setEditingTemplate(t)} className="text-gray-400 hover:text-indigo-600">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              عدد المواد: {t.clauses.length}
            </div>
            {t.company && (
              <div className="inline-block bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-sm">
                مخصص لـ: {t.company.name}
              </div>
            )}
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 border border-dashed rounded-sm">
            لا توجد قوالب عقود مسجلة. قم بإنشاء قالبك الأول.
          </div>
        )}
      </div>
    </div>
  );
}
