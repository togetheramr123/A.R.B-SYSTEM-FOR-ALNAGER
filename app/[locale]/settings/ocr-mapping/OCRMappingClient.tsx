'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Search, Save, X, BookOpen } from 'lucide-react';
import { createOCRRule, updateOCRRule, deleteOCRRule } from '@/app/actions/ocrMapping';
import { toast } from 'sonner';

export default function OCRMappingClient({ initialRules, products }: { initialRules: any[], products: any[] }) {
  const [rules, setRules] = useState(initialRules);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Form State
  const [keyword, setKeyword] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [defaultUom, setDefaultUom] = useState('Units');

  const filteredRules = rules.filter(r => r.keyword.includes(search));

  const resetForm = () => {
    setKeyword('');
    setSelectedProductIds([]);
    setDefaultUom('Units');
    setIsEditing(null);
  };

  const handleSave = async () => {
    if (!keyword.trim() || selectedProductIds.length === 0) {
      toast.error('يرجى إدخال الكلمة المفتاحية واختيار منتج واحد على الأقل');
      return;
    }

    const data = {
      keyword,
      productIds: selectedProductIds.join(','),
      defaultUom
    };

    if (isEditing) {
      const res = await updateOCRRule(isEditing, data);
      if (res.success) {
        setRules(rules.map(r => r.id === isEditing ? res.rule : r));
        toast.success('تم التعديل بنجاح');
        resetForm();
      } else {
        toast.error(res.error);
      }
    } else {
      const res = await createOCRRule(data);
      if (res.success) {
        setRules([res.rule, ...rules]);
        toast.success('تمت الإضافة بنجاح');
        resetForm();
      } else {
        toast.error(res.error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      const res = await deleteOCRRule(id);
      if (res.success) {
        setRules(rules.filter(r => r.id !== id));
        toast.success('تم الحذف');
      } else {
        toast.error(res.error);
      }
    }
  };

  const handleEdit = (rule: any) => {
    setIsEditing(rule.id);
    setKeyword(rule.keyword);
    setSelectedProductIds(rule.productIds.split(',').filter(Boolean));
    setDefaultUom(rule.defaultUom || 'Units');
  };

  const toggleProductSelection = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Section */}
      <div className="lg:col-span-1 bg-white p-5 border border-slate-200 rounded-sm shadow-sm h-fit sticky top-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          {isEditing ? 'تعديل قاعدة' : 'إضافة قاعدة جديدة'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الكلمة المكتوبة في الصورة (Keyword)</label>
            <input autoComplete="off" autoCorrect="off" spellCheck={false} 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="مثال: كوع لحام، شحم، ك ..."
              className="w-full border-slate-200 rounded-sm text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">وحدة القياس الافتراضية (اختياري)</label>
            <input autoComplete="off" autoCorrect="off" spellCheck={false} 
              type="text" 
              value={defaultUom}
              onChange={(e) => setDefaultUom(e.target.value)}
              placeholder="مثال: كرتونة"
              className="w-full border-slate-200 rounded-sm text-sm"
            />
            <p className="text-[10px] text-slate-400 mt-1">يُستخدم إذا كانت الكلمة تعبر عن وحدة (مثل "ك" تعني "كرتونة").</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">المنتجات المقترحة (اختر واحد أو أكثر)</label>
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-sm p-2 space-y-1">
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                    type="checkbox" 
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProductSelection(p.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm line-clamp-1">{p.name}</span>
                </label>
              ))}
            </div>
            {selectedProductIds.length > 0 && (
              <p className="text-xs text-emerald-600 mt-2 font-bold">تم تحديد {selectedProductIds.length} منتجات</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button 
              onClick={handleSave}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-sm text-sm font-bold hover:bg-indigo-700 flex justify-center items-center gap-2"
            >
              <Save className="w-4 h-4" /> {isEditing ? 'حفظ التعديلات' : 'إضافة للقائمة'}
            </button>
            {isEditing && (
              <button 
                onClick={resetForm}
                className="bg-slate-100 text-slate-700 py-2 px-4 rounded-sm text-sm font-bold hover:bg-slate-200 flex justify-center items-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold">القاموس الحالي</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input autoComplete="off" autoCorrect="off" spellCheck={false} 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في القاموس..."
              className="w-64 pl-3 pr-9 py-1.5 text-sm border-slate-200 rounded-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 p-0 overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">الكلمة في الصورة</th>
                <th className="py-3 px-4 font-bold">الوحدة المفترضة</th>
                <th className="py-3 px-4 font-bold">عدد المنتجات المرتبطة</th>
                <th className="py-3 px-4 font-bold w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">لا توجد قواعد مسجلة</td>
                </tr>
              ) : (
                filteredRules.map(rule => (
                  <tr key={rule.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-700">{rule.keyword}</td>
                    <td className="py-3 px-4">{rule.defaultUom}</td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">
                        {rule.productIds.split(',').filter(Boolean).length} منتجات
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(rule)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(rule.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
