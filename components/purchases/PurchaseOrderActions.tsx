"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { confirmPurchaseOrder, createBillFromOrder, cancelPurchaseOrder } from "@/app/actions/purchases";
import { StatusBar } from "@/components/common/StatusBar";
import { Package, Lock } from "lucide-react";
import { toast } from "sonner";
export function PurchaseOrderActions({
  order
}: {
  order: any;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const handleConfirm = async () => {
    if (!confirmPurchaseOrder) return;
    setLoading(true);
    try {
      await confirmPurchaseOrder(order.id);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("خطأ في تأكيد الأمر");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateBill = async () => {
    if (!createBillFromOrder) return;
    setLoading(true);
    try {
      const bill = await createBillFromOrder(order.id);
      if (bill && bill.id) {
        toast.success("تم إنشاء الفاتورة بنجاح"); // Navigate to the newly created bill
        router.push(`/${locale}/accounting/bills/${bill.id}`);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      const msg = error?.message || "خطأ في إنشاء الفاتورة";
      if (msg.includes("لا توجد كميات قابلة للفوترة")) {
        toast.warning("لا توجد كميات قابلة للفوترة. تأكد من استلام البضاعة أولاً من المخزن.");
      } else {
        console.error(error);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = async () => {
    // Removed native confirm() to prevent browser blocking
    setLoading(true);
    try {
      await cancelPurchaseOrder(order.id);
      router.refresh();
    } catch (e) {
      toast.error("فشل في إلغاء الأمر");
    } finally {
      setLoading(false);
    }
  };
  const handleLock = () => {
    setLocked(true); // In a real app this would call a server action to lock the PO
  };
  const statusSteps = [{
    key: "draft",
    label: "طلب عرض سعر"
  }, {
    key: "sent",
    label: "تم إرسال طلب عرض السعر"
  }, {
    key: "purchase",
    label: "أمر شراء"
  }, {
    key: "done",
    label: "مغلق"
  }];
  return <div className="border-b border-slate-200 p-3 flex justify-between items-center bg-white sticky top-0 z-10">
      {" "}
      <div className="flex gap-1.5">
        {" "}
        {/* Draft/Sent: Confirm + Send Email + Print + Cancel */}{" "}
        {(order.status === "draft" || order.status === "sent") && <>
            {" "}
            <button onClick={handleConfirm} disabled={loading} className="bg-slate-700 text-white px-3 py-1.5 rounded-sm hover:bg-slate-800 text-sm font-medium disabled:opacity-50">
              {" "}
              {loading ? "جاري التنفيذ..." : "تأكيد الطلب"}{" "}
            </button>{" "}
            <button type="button" onClick={() => toast.info("سيتم إرسال البريد قريباً")} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium">
              {" "}
              إرسال بالبريد الإلكتروني{" "}
            </button>{" "}
          </>}{" "}
        {/* Confirmed PO: Receive Products + Create Bill + Send + Lock + Cancel */}{" "}
        {order.status === "purchase" && <>
            {" "}
            <Link href={`/${locale}/inventory/operations/receipts?search=${order.name}`} className="bg-sky-600 text-white px-3 py-1.5 rounded-sm hover:bg-sky-700 text-sm font-medium flex items-center gap-1.5">
              {" "}
              <Package className="w-4 h-4" /> استلام المنتجات{" "}
            </Link>{" "}
            <button onClick={handleCreateBill} disabled={loading} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium disabled:opacity-50">
              {" "}
              {loading ? "جاري التنفيذ..." : "إنشاء فاتورة"}{" "}
            </button>{" "}
            <button type="button" onClick={() => toast.info("سيتم إرسال البريد قريباً")} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium">
              {" "}
              إرسال أمر الشراء عبر البريد{" "}
            </button>{" "}
            <button type="button" onClick={handleLock} disabled={locked} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium disabled:opacity-50 flex items-center gap-1">
              {" "}
              <Lock className="w-3.5 h-3.5" /> {locked ? "مقفل" : "قفل"}{" "}
            </button>{" "}
          </>}{" "}
        {/* Cancel button - always shown when not done/cancelled */}{" "}
        {order.status !== "done" && order.status !== "cancel" && <button type="button" onClick={handleCancel} disabled={loading} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium disabled:opacity-50">
            {" "}
            إلغاء{" "}
          </button>}{" "}
      </div>{" "}
      <StatusBar steps={statusSteps} currentStatus={order.status} />{" "}
    </div>;
}