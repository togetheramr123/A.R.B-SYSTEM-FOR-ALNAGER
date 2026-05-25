'use client';

import { useState } from 'react';
import { AlertTriangle, Tag, FileText, Check, X, Percent, Plus } from 'lucide-react';
import type { PricingOption, PartnerPricingOptions } from '@/app/actions/pricing';

type Props = {
  options: PartnerPricingOptions;
  onSelect: (source: 'agreement' | 'pricelist', option: PricingOption) => void;
  onDismiss: () => void;
};

export function PriceAgreementChooser({ options, onSelect, onDismiss }: Props) {
  const [selected, setSelected] = useState<'agreement' | 'pricelist' | null>(null);

  if (!options.hasConflict) return null;
  if (!options.agreement || !options.pricelist) return null;

  const formatDiscounts = (opt: PricingOption) => {
    const parts: string[] = [];
    if (opt.discount1 > 0) parts.push(`خصم1: ${opt.discount1}%`);
    if (opt.discount2 > 0) parts.push(`خصم2: ${opt.discount2}%`);
    if (opt.discount3 > 0) parts.push(`خصم3: ${opt.discount3}%`);
    if (opt.addition > 0) parts.push(`إضافة: ${opt.addition}%`);
    return parts.join('  ·  ');
  };

  const handleConfirm = () => {
    if (!selected) return;
    const opt = selected === 'agreement' ? options.agreement! : options.pricelist!;
    onSelect(selected, opt);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-3 shadow-sm" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-amber-900">تنبيه: يوجد خصمان لهذا العميل</h4>
          <p className="text-[11px] text-amber-700">يُرجى اختيار مصدر الخصم المطلوب تطبيقه — سيُلغى الآخر تلقائياً</p>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Agreement Option */}
        <button
          type="button"
          onClick={() => setSelected('agreement')}
          className={`relative text-right rounded-lg border-2 p-4 transition-all ${
            selected === 'agreement' 
              ? 'border-[#017E84] bg-teal-50 shadow-md ring-2 ring-teal-200'
              : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
          }`}
        >
          {selected === 'agreement' && (
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#017E84] flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <FileText className={`w-5 h-5 ${selected === 'agreement' ? 'text-[#017E84]' : 'text-gray-400'}`} />
            <span className="text-[13px] font-bold text-gray-900">اتفاقية العميل</span>
          </div>
          <p className="text-[12px] font-medium text-gray-600 mb-2">{options.agreement.name}</p>
          <div className="flex flex-wrap gap-2">
            {options.agreement.discount1 > 0 && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded-full">
                <Percent className="w-3 h-3" /> خصم1: {options.agreement.discount1}%
              </span>
            )}
            {options.agreement.discount2 > 0 && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-1 rounded-full">
                <Percent className="w-3 h-3" /> خصم2: {options.agreement.discount2}%
              </span>
            )}
            {options.agreement.discount3 > 0 && (
              <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-800 text-[11px] font-bold px-2 py-1 rounded-full">
                <Percent className="w-3 h-3" /> خصم3: {options.agreement.discount3}%
              </span>
            )}
            {options.agreement.addition > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-1 rounded-full">
                <Plus className="w-3 h-3" /> إضافة: {options.agreement.addition}%
              </span>
            )}
          </div>
        </button>

        {/* Pricelist Option */}
        <button
          type="button"
          onClick={() => setSelected('pricelist')}
          className={`relative text-right rounded-lg border-2 p-4 transition-all ${
            selected === 'pricelist'
              ? 'border-[#017E84] bg-teal-50 shadow-md ring-2 ring-teal-200'
              : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
          }`}
        >
          {selected === 'pricelist' && (
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#017E84] flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <Tag className={`w-5 h-5 ${selected === 'pricelist' ? 'text-[#017E84]' : 'text-gray-400'}`} />
            <span className="text-[13px] font-bold text-gray-900">قائمة الأسعار</span>
          </div>
          <p className="text-[12px] font-medium text-gray-600 mb-2">{options.pricelist.name}</p>
          <div className="flex flex-wrap gap-2">
            {options.pricelist.discount1 > 0 && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded-full">
                <Percent className="w-3 h-3" /> خصم1: {options.pricelist.discount1}%
              </span>
            )}
            {options.pricelist.discount2 > 0 && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-1 rounded-full">
                <Percent className="w-3 h-3" /> خصم2: {options.pricelist.discount2}%
              </span>
            )}
            {options.pricelist.discount3 > 0 && (
              <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-800 text-[11px] font-bold px-2 py-1 rounded-full">
                <Percent className="w-3 h-3" /> خصم3: {options.pricelist.discount3}%
              </span>
            )}
            {options.pricelist.addition > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-1 rounded-full">
                <Plus className="w-3 h-3" /> إضافة: {options.pricelist.addition}%
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-bold transition-all ${
            selected 
              ? 'bg-[#017E84] hover:bg-[#01656a] text-white shadow-sm active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          تأكيد الاختيار وتطبيق الخصم
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex items-center gap-1 px-3 py-2 rounded-md text-[12px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          تجاهل
        </button>
      </div>
    </div>
  );
}
