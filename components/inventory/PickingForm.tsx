'use client';
import React from "react";
import { toast } from 'sonner';
import { validatePicking } from '@/app/actions/inventory';
import { createReturnPicking } from '@/app/actions/returns';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Save, Printer, Undo2, Ban, Lock, Unlock, MoreHorizontal, Send, Paperclip, Clock, Calendar, MapPin, FileText, User, Truck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { EditableDynamicTable, Column } from '../common/EditableDynamicTable';
import { SmartButton } from '../common/SmartButton';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
import { parsePrismaError } from '@/lib/utils/errorHandler';
import { Chatter } from '@/components/chatter/Chatter';
import { AttachmentPanel } from '@/components/common/AttachmentPanel';
import { useRouter } from 'next/navigation';
import { TopPortal } from '@/components/common/TopPortal';
import { ActionMenu, PrintMenu } from '@/components/common/ActionMenu';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import OdooFormShell from '../common/OdooFormShell';

type Props = {
  picking: any;
  locations: any[];
  readOnly?: boolean;
};

export default function PickingForm({ picking, locations, readOnly = false }: Props) {
  const t = useTranslations('Inventory');
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState(picking.status || 'draft');
  const [isPending, startTransition] = useTransition();
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(picking.status === 'done');
  const [backorderData, setBackorderData] = useState<any>(null);
  const [immediateTransferData, setImmediateTransferData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'operations' | 'info' | 'notes'>('operations');

  const { register, control, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      partnerId: picking.partnerId || '',
      pickingType: picking.pickingType || 'INCOMING',
      locationDestId: picking.locationDestId || '',
      locationId: picking.locationId || '',
      scheduledDate: picking.scheduledDate ? new Date(picking.scheduledDate).toISOString().split('T')[0] : '',
      origin: picking.origin || '',
      moves: (picking.moves || []).map((move: any) => ({
        id: move.id,
        productId: move.productId,
        description: move.product?.name || '',
        lotName: move.lotName || '',
        qty: Number(move.quantity) || 0,
        qtyDone: Number(move.quantityDone) || 0,
        uom: move.product?.uom || 'Units',
        secQty: Number(move.secQty) || 0,
        secQtyDone: Number(move.secQtyDone) || 0,
        secUnit: move.product?.secUom || ''
      }))
    }
  });

  const { fields } = useFieldArray({ control, name: "moves" });

  const handleReturn = async () => {
    // Removed native confirm() to prevent browser blocking
    setPageError(null);
    try {
      startTransition(async () => {
        const result = await createReturnPicking(picking.id);
        if (result?.success) {
          router.push(`/${locale}/inventory/transfers/${result.id}`);
        } else {
          setPageError(`خطأ في الإرجاع: ${parsePrismaError(result?.error)}`);
        }
      });
    } catch (e) {
      console.error(e);
      setPageError(parsePrismaError(e) || "فشل في إنشاء المرتجع");
    }
  };

  const executeValidation = async (data: any, backorderAction: 'create' | 'cancel' | 'none' = 'none') => {
    setPageError(null);
    try {
      startTransition(async () => {
        const hasProvidedQuantities = data.moves.some((m: any) => m.qtyDone > 0);
        const isEditingDone = status === 'done';
        const finalMoves = (!isEditingDone && !hasProvidedQuantities) ? data.moves.map((m: any) => ({ ...m, qtyDone: m.qty })) : data.moves;
        
        const result = await validatePicking(picking.id, finalMoves, backorderAction);
        
        if (result?.error) {
          if (result.error === 'CONCURRENCY_ERROR') {
            setPageError("تنبيه: تم تحديث البيانات من قبل مستخدم آخر. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
          } else if (result.error.includes('INSUFFICIENT_STOCK')) {
            setPageError(`خطأ: رصيد غير كافٍ!\n${result.error}`);
          } else {
            setPageError(`حدث خطأ: ${parsePrismaError(result.error)}`);
          }
          setBackorderData(null);
          setImmediateTransferData(null);
          return;
        }
        
        if (result?.success) {
          setStatus('done');
          setIsLocked(true);
          reset({ ...data, moves: finalMoves });
          setImmediateTransferData(null);
          router.refresh();
        }
      });
    } catch (e) {
      console.error(e);
      setPageError(parsePrismaError(e) || "حدث خطأ غير متوقع أثناء التحقق");
      setBackorderData(null);
      setImmediateTransferData(null);
    }
  };

  const onSubmit = async (data: any) => {
    if (status !== 'done') {
      const hasMissingQty = data.moves.some((m: any) => (m.qtyDone || 0) < m.qty && (m.qtyDone || 0) > 0);
      const allZeros = data.moves.every((m: any) => !m.qtyDone || m.qtyDone === 0);
      
      if (hasMissingQty || (data.moves.some((m: any) => (m.qtyDone || 0) === 0) && !allZeros)) {
        setBackorderData(data);
        return;
      }
      
      if (allZeros && !isLocked && data.moves.length > 0) {
        setImmediateTransferData(data);
        return;
      }
    }
    await executeValidation(data, 'none');
  };

  const handleSetQuantities = () => {
    const moves = watch('moves');
    moves.forEach((move: any, index: number) => {
      setValue(`moves.${index}.qtyDone`, move.qty, { shouldDirty: true });
    });
  };

  const columns: Column[] = [
    {
      id: 'product', label: 'المنتج', minWidth: '200px',
      renderCell: (field: any, index: number, register: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-800">{field.description}</span>
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="hidden" {...register(`moves.${index}.productId`)} />
        </div>
      )
    },
    {
      id: 'lot', label: 'اللوت/السيريال', width: '130px',
      renderCell: (field: any) => (
        <span className={`text-sm block text-center ${field.lotName ? 'font-medium text-lime-700 bg-lime-50 px-2 py-0.5 rounded' : 'text-slate-400'}`}>
          {field.lotName || '—'}
        </span>
      )
    },
    {
      id: 'qty', label: 'الطلب',
      renderCell: (field: any) => (
        <span className="text-sm text-slate-600 block text-center">{field.qty}</span>
      )
    },
    {
      id: 'qtyDone', label: 'تم الانتهاء',
      renderCell: (field: any, index: number) => (
        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" step="0.01" disabled={readOnly || (status === 'done' && isLocked)}
          {...register(`moves.${index}.qtyDone`, {
            valueAsNumber: true,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              const val = convertArabicToEnglishNumbers(e.target.value);
              control?._setValue(`moves.${index}.qtyDone`, val ? parseFloat(val) : 0, { shouldValidate: true, shouldDirty: true });
            }
          })}
          className={`w-full p-1 border-b border-slate-300 focus:border-teal-600 outline-none text-center font-bold ${(watch(`moves.${index}.qtyDone`) === field.qty) ? 'text-green-600' : (watch(`moves.${index}.qtyDone`) > field.qty) ? 'text-orange-600' : 'text-slate-900'}`}
        />
      )
    },
    { id: 'uom', label: 'وحدة القياس', width: '100px', renderCell: (field: any) => <span className="text-xs text-slate-500 block text-center">{field.uom}</span> },
    {
      id: 'secQtyDone', label: 'الثانوي القيام به',
      renderCell: (field: any, index: number) => (
        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" step="0.01" disabled={readOnly || (status === 'done' && isLocked)}
          {...register(`moves.${index}.secQtyDone`, {
            valueAsNumber: true,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              const val = convertArabicToEnglishNumbers(e.target.value);
              control?._setValue(`moves.${index}.secQtyDone`, val ? parseFloat(val) : 0, { shouldValidate: true, shouldDirty: true });
            }
          })}
          className="w-full p-1 bg-slate-50 border-b border-transparent focus:border-teal-600 outline-none text-center text-xs"
        />
      )
    },
    { id: 'secQty', label: 'الكمية الثانوية', renderCell: (field: any) => <span className="text-xs text-slate-500 block text-center">{field.secQty}</span> },
    { id: 'secUnit', label: 'الثانوية UOM', width: '100px', renderCell: (field: any) => <span className="text-xs text-slate-500 block text-center">{field.secUnit}</span> },
  ];

  const statusSteps = [
    { value: 'draft', label: 'مسودة' },
    { value: 'waiting', label: 'قيد الانتظار' },
    { value: 'assigned', label: 'جاهز' },
    { value: 'done', label: 'تم الانتهاء' }
  ];

  const actions = [];
  if (status !== 'done') {
    actions.push({
      label: isPending ? 'جاري التحقق...' : 'تأكيد (Validate)',
      onClick: handleSubmit(onSubmit),
      style: 'primary' as const,
      disabled: isPending || readOnly
    });
    actions.push({
      label: 'تحديد الكميات',
      onClick: handleSetQuantities,
      style: 'secondary' as const,
    });
  } else if (status === 'done') {
    actions.push({
      label: 'مرتجع',
      onClick: handleReturn,
      style: 'secondary' as const,
      icon: <Undo2 className="w-4 h-4 ml-1" />
    });
  }



  if (status === 'done' && isLocked) {
    actions.push({
      label: 'إلغاء القفل',
      onClick: () => setIsLocked(false),
      style: 'secondary' as const,
      icon: <Unlock className="w-4 h-4 ml-1" />
    });
  } else if (status === 'done' && !isLocked) {
    actions.push({
      label: isPending ? 'جاري الحفظ...' : 'حفظ التعديلات',
      onClick: handleSubmit(onSubmit),
      style: 'primary' as const,
      icon: <Save className="w-4 h-4 ml-1" />
    });
    actions.push({
      label: 'قفل',
      onClick: () => setIsLocked(true),
      style: 'secondary' as const,
      icon: <Lock className="w-4 h-4 ml-1" />
    });
  }

  const smartButtons = (<></>);

  return (
    <OdooFormShell
      statusSteps={statusSteps}
      currentStatus={status}
      contextActions={actions}
      smartButtons={smartButtons}
      titleLabel={picking.pickingType === 'INCOMING' ? 'إيصال استلام' : 'أمر توصيل'}
      titleValue={picking.name}
      error={pageError}
      isLoading={isPending}
      chatterId={picking?.id}
      chatterModel="stockPicking"
    >
      <TopPortal>
        <div className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse" dir="rtl">
          <div className="flex items-center text-slate-500 font-numbers text-xs font-bold gap-2">
            <button className="p-1 rounded-sm text-slate-300 cursor-not-allowed" title="التالي" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 rounded-sm text-slate-300 cursor-not-allowed" title="السابق" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
            <span>1 / 1</span>
          </div>
          <button type="button" onClick={() => window.location.reload()} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-sm transition-colors ml-1" title="تحديث">
            <RotateCcw className="w-4 h-4" />
          </button>
          <PrintMenu options={[
            { label: 'تصميم 1 (مع هوية الشركة)', onClick: () => window.open(`/${locale}/inventory/operations/${picking.pickingType === 'INCOMING' ? 'receipts' : 'delivery'}/${picking.id}/print?design=1`, '_blank') },
            { label: 'تصميم 2 (بدون هوية)', onClick: () => window.open(`/${locale}/inventory/operations/${picking.pickingType === 'INCOMING' ? 'receipts' : 'delivery'}/${picking.id}/print?design=2`, '_blank') },
          ]} />
          <ActionMenu onDuplicate={() => toast.info('ميزة التكرار قيد التطوير')} onDelete={() => toast.error('الحذف غير مصرح به لهذه الوثيقة')} />
        </div>
      </TopPortal>

      <div className="o_group border-b border-gray-100 pb-6 mb-6">
        <div className="o_group_col_6">
          <div className="o_field_row">
            <label className="o_field_label">{picking.pickingType === 'INCOMING' ? 'الاستلام من' : 'التوصيل إلى'}</label>
            <div className="o_field_widget flex items-center gap-2 text-teal-700 font-bold hover:underline cursor-pointer">
              {picking.partner?.name || 'غير محدد'}
            </div>
          </div>
          <div className="o_field_row">
            <label className="o_field_label">الموقع الوجهة</label>
            <div className="o_field_widget">
              <select {...register('locationDestId')} disabled={readOnly} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 outline-none p-0 max-w-[200px] text-sm">
                {locations.map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="o_group_col_6">
          <div className="o_field_row">
            <label className="o_field_label">التاريخ المجدول</label>
            <div className="o_field_widget">
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" {...register('scheduledDate')} disabled={readOnly} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 outline-none max-w-[200px] text-sm" />
            </div>
          </div>
          <div className="o_field_row">
            <label className="o_field_label">تاريخ التوصيل الفعلي</label>
            <div className="o_field_widget text-sm">
              {status === 'done' ? (picking.dateDone ? new Date(picking.dateDone).toLocaleDateString() : new Date().toLocaleDateString()) : '—'}
            </div>
          </div>
          <div className="o_field_row">
            <label className="o_field_label">المستند المصدر</label>
            <div className="o_field_widget">
              {picking.saleOrderId ? (
                <button type="button" onClick={() => router.push(`/${locale}/sales/${picking.saleOrderId}`)} className="text-blue-600 hover:underline font-bold text-sm">
                  {picking.origin}
                </button>
              ) : picking.purchaseOrderId ? (
                <button type="button" onClick={() => router.push(`/${locale}/purchases/${picking.purchaseOrderId}`)} className="text-blue-600 hover:underline font-bold text-sm">
                  {picking.origin}
                </button>
              ) : (
                <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('origin')} disabled={readOnly} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 outline-none max-w-[200px] text-sm" placeholder="مثال: PO0032" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="o_notebook mt-4">
        <div className="flex gap-6 border-b border-gray-200">
          <button type="button" onClick={() => setActiveTab('operations')} className={`pb-2 text-sm font-bold -mb-px ${activeTab === 'operations' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent'}`}>العمليات</button>
          <button type="button" onClick={() => setActiveTab('info')} className={`pb-2 text-sm font-bold -mb-px ${activeTab === 'info' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent'}`}>معلومات إضافية</button>
          <button type="button" onClick={() => setActiveTab('notes')} className={`pb-2 text-sm font-bold -mb-px ${activeTab === 'notes' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent'}`}>ملاحظة</button>
        </div>
        {activeTab === 'operations' && (
        <div className="pt-4">
          <EditableDynamicTable
            tableId="picking_operations"
            columns={columns}
            fields={fields}
            register={register}
            readOnly={status === 'done' || readOnly}
            control={control}
            onRemove={(id) => toast.info('ميزة الحذف قيد التطوير')}
          />
        </div>
        )}
        {activeTab === 'info' && (
        <div className="pt-4 text-sm text-slate-500">
          <p>لا توجد معلومات إضافية حالياً.</p>
        </div>
        )}
        {activeTab === 'notes' && (
        <div className="pt-4 text-sm text-slate-500">
          <p>لا توجد ملاحظات حالياً.</p>
        </div>
        )}
      </div>

      {/* Attachments */}
      {picking?.id && (
        <div className="mt-6">
          <AttachmentPanel model="stockMove" recordId={picking.id} readOnly={readOnly} />
        </div>
      )}

      {backorderData && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-start justify-center pt-[10vh]">
          <div className="bg-white rounded-sm shadow-xl w-[600px] max-w-[95vw] flex flex-col" dir="rtl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
              <h3 className="text-[17px] font-medium text-slate-800">
                إنشاء أمر مخزني متبقي؟ (Backorder)
              </h3>
            </div>
            <div className="p-4 text-[13px] text-slate-700 leading-relaxed bg-white">
              لقد قمت بإدخال كميات استلام أقل من الطلب الأصلي. بناءً على قواعد المخازن المعتمدة، هل تود إنشاء أمر مخزني منفصل (Backorder) للكميات المتبقية؟
              <br /><br />
              - <strong>استلام على مرحلتين:</strong> يقفل هذا المستند وتُرسل الكميات المتبقية إلى إذن جديد.
              <br />
              - <strong>استلام المحدد فقط:</strong> يقفل هذا المستند وتُلغى الكميات المتبقية نهائياً.
            </div>
            <div className="p-4 border-t border-slate-200 flex items-center gap-2 bg-white rounded-b-sm">
              <button type="button" disabled={isPending} onClick={() => executeValidation(backorderData, 'create')} className="px-4 py-2 bg-[#017E84] text-white hover:bg-[#01656a] rounded-sm text-sm font-medium transition-colors disabled:opacity-50">
                استلام على مرحلتين
              </button>
              <button type="button" disabled={isPending} onClick={() => executeValidation(backorderData, 'cancel')} className="px-4 py-2 bg-white border border-[#017E84] text-[#017E84] hover:bg-teal-50 rounded-sm text-sm font-medium transition-colors disabled:opacity-50">
                استلام المحدد فقط
              </button>
              <button type="button" disabled={isPending} onClick={() => setBackorderData(null)} className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-transparent rounded-sm text-sm font-medium mr-auto">
                إلغاء التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {immediateTransferData && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-start justify-center pt-[10vh]">
          <div className="bg-white rounded-sm shadow-xl w-[500px] max-w-[95vw] flex flex-col" dir="rtl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
              <h3 className="text-[17px] font-medium text-slate-800">
                تأكيد استلام الكميات بالكامل؟
              </h3>
            </div>
            <div className="p-4 text-[13px] text-slate-700 leading-relaxed bg-white">
              لم تقم بتسجيل أي كميات منتهية (Done Quantities).
              <br /><br />
              حسب قواعد المخازن المتبعة، عند النقر على <strong>تطبيق</strong>، سيقوم النظام تلقائياً بمعالجة <strong>كافة الكميات المطلوبة بالكامل</strong> كإجراء تسهيلي.
              <br /><br />
              هل تريد استلام وتطبيق الكميات بالكامل الآن؟
            </div>
            <div className="p-4 border-t border-slate-200 flex items-center gap-2 bg-white rounded-b-sm">
              <button type="button" disabled={isPending} onClick={() => executeValidation(immediateTransferData, 'none')} className="px-5 py-2 bg-[#017E84] text-white hover:bg-[#01656a] rounded-sm text-sm font-medium transition-colors disabled:opacity-50">
                تطبيق (Apply)
              </button>
              <button type="button" disabled={isPending} onClick={() => setImmediateTransferData(null)} className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-transparent rounded-sm text-sm font-medium">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </OdooFormShell>
  );
}
