"use client";

import { useState, useTransition } from "react";
import { requestPartnerChange } from "@/app/actions/accounting";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Search } from "lucide-react";
interface PartnerChangeModalProps {
  resourceId: string;
  resourceModel: "SaleOrder" | "Invoice";
  currentPartnerId: string;
  currentPartnerName: string;
  partners: {
    id: string;
    name: string;
  }[];
  onClose: () => void;
}
export default function PartnerChangeModal({
  resourceId,
  resourceModel,
  currentPartnerId,
  currentPartnerName,
  partners,
  onClose
}: PartnerChangeModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<"confirm" | "select">("confirm");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [search, setSearch] = useState("");
  const filteredPartners = partners.filter(p => p.id !== currentPartnerId && p.name.toLowerCase().includes(search.toLowerCase()));
  const handleConfirmMistake = () => {
    setStep("select");
  };
  const handleSubmitRequest = () => {
    if (!selectedPartnerId) {
      toast.warning("يرجى اختيار العميل الصحيح");
      return;
    }
    startTransition(async () => {
      try {
        const result = await requestPartnerChange({
          resourceId,
          resourceModel,
          oldPartnerId: currentPartnerId,
          newPartnerId: selectedPartnerId
        });
        if (result.success) {
          toast.success("تم إرسال طلب تعديل العميل للمدير. سيتم تعديل الاسم تلقائياً عند الموافقة.");
          onClose();
          router.refresh();
        }
      } catch (e: any) {
        toast.error(e.message || "حدث خطأ");
      }
    });
  };
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      {" "}
      <div className="bg-white rounded-sm shadow-sm w-[500px] max-w-[95vw]" onClick={e => e.stopPropagation()}>
        {" "}
        {/* Header */}{" "}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              {" "}
              <AlertTriangle className="w-5 h-5 text-amber-600" />{" "}
            </div>{" "}
            <h2 className="text-lg font-bold text-slate-800">
              {" "}
              {step === "confirm" ? "تعديل اسم العميل" : "اختيار العميل الصحيح"}{" "}
            </h2>{" "}
          </div>{" "}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            {" "}
            <X className="w-5 h-5" />{" "}
          </button>{" "}
        </div>{" "}
        {/* Body */}{" "}
        <div className="p-6">
          {" "}
          {step === "confirm" ? <div className="space-y-4">
              {" "}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                {" "}
                <p className="text-sm text-amber-800 font-bold mb-2">
                  {" "}
                  العميل الحالي:{" "}
                  <span className="text-amber-900">
                    {currentPartnerName}
                  </span>{" "}
                </p>{" "}
                <p className="text-sm text-amber-700">
                  {" "}
                  هل أخطأت في كتابة اسم العميل الصحيح وترغب بتعديله؟{" "}
                </p>{" "}
                <p className="text-xs text-amber-600 mt-2">
                  {" "}
                  ⚠️ سيتم إرسال طلب موافقة للمدير قبل تعديل الاسم. وعند
                  الموافقة، سيتم تغيير الاسم تلقائياً في عرض السعر والمخزن
                  والفاتورة.{" "}
                </p>{" "}
              </div>{" "}
            </div> : <div className="space-y-4">
              {" "}
              {/* Search */}{" "}
              <div className="relative">
                {" "}
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن العميل الصحيح..." className="w-full border border-slate-300 rounded-lg py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-500 transition" autoFocus />{" "}
              </div>{" "}
              {/* Partner List */}{" "}
              <div className="max-h-[250px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {" "}
                {filteredPartners.length === 0 ? <div className="p-4 text-center text-sm text-slate-400">
                    {" "}
                    لا يوجد عملاء مطابقون{" "}
                  </div> : filteredPartners.slice(0, 20).map(p => <button key={p.id} type="button" onClick={() => setSelectedPartnerId(p.id)} className={`w-full text-right px-4 py-3 text-sm hover:bg-blue-50 transition ${selectedPartnerId === p.id ? "bg-blue-50 border-r-4 border-blue-600 font-bold text-blue-800" : "text-slate-700"}`}>
                      {" "}
                      {p.name}{" "}
                    </button>)}{" "}
              </div>{" "}
              {selectedPartnerId && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  {" "}
                  <span className="text-blue-700">التعديل المطلوب: </span>{" "}
                  <span className="text-red-600 line-through">
                    {currentPartnerName}
                  </span>{" "}
                  <span className="text-blue-700"> → </span>{" "}
                  <span className="text-green-700 font-bold">
                    {" "}
                    {partners.find(p => p.id === selectedPartnerId)?.name}{" "}
                  </span>{" "}
                </div>}{" "}
            </div>}{" "}
        </div>{" "}
        {/* Footer */}{" "}
        <div className="flex items-center gap-3 p-5 border-t border-slate-200">
          {" "}
          {step === "confirm" ? <>
              {" "}
              <button onClick={handleConfirmMistake} className="px-5 py-2.5 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-sm font-bold transition">
                {" "}
                نعم، أريد تعديل العميل{" "}
              </button>{" "}
              <button onClick={onClose} className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium">
                {" "}
                لا، العميل صحيح{" "}
              </button>{" "}
            </> : <>
              {" "}
              <button onClick={handleSubmitRequest} disabled={isPending || !selectedPartnerId} className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold disabled:opacity-50 transition">
                {" "}
                {isPending ? "جاري الإرسال..." : "إرسال طلب التعديل للمدير"}{" "}
              </button>{" "}
              <button onClick={() => setStep("confirm")} className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium">
                {" "}
                رجوع{" "}
              </button>{" "}
            </>}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}