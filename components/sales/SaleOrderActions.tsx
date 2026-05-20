"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmSaleOrder, createInvoiceFromOrder, requestNegativeStockApproval, approveNegativeStock, cancelSaleOrder } from "@/app/actions/sales";
import { StatusBar } from "@/components/common/StatusBar";
import { CreateInvoiceModal } from "@/components/sales/CreateInvoiceModal";
import { AlertTriangle, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
export function SaleOrderActions({
  order
}: {
  order: any;
}) {
  const t = useTranslations("Sales");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [approvalRequestOpen, setApprovalRequestOpen] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const handleConfirm = async () => {
    if (!confirmSaleOrder) return;
    setLoading(true);
    try {
      await confirmSaleOrder(order.id);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes("NEGATIVE_STOCK")) {
        try {
          const itemsFn = error.message.split("NEGATIVE_STOCK:")[1];
          if (itemsFn) {
            const items = JSON.parse(itemsFn);
            setOutOfStockItems(items);
            setApprovalRequestOpen(true);
          }
        } catch (parseError) {
          console.error("Failed to parse negative stock items", parseError);
          toast.error("تم إيقاف الأمر: تم اكتشاف مخزون سالب.");
        }
      } else {
        toast.error("خطأ في تأكيد الأمر: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleRequestApproval = async () => {
    setLoading(true);
    /* Don't block UI but show loading state */
    try {
      await requestNegativeStockApproval(order.id);
      setApprovalRequestOpen(false);
      router.refresh();
    } catch (e) {
      toast.error("فشل في طلب الموافقة");
    } finally {
      setLoading(false);
    }
  };
  const handleApprove = async () => {
    // Removed native confirm() to prevent browser blocking
    setLoading(true);
    try {
      await approveNegativeStock(order.id);
      router.refresh();
    } catch (e) {
      toast.error("فشل في الموافقة");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateInvoice = () => {
    setInvoiceModalOpen(true);
  };
  const handleCancel = async () => {
    // Removed native confirm() to prevent browser blocking
    setLoading(true);
    try {
      await cancelSaleOrder(order.id);
      router.refresh();
    } catch (e) {
      toast.error("فشل في إلغاء الأمر");
    } finally {
      setLoading(false);
    }
  };
  const statusSteps = [{
    key: "draft",
    label: t("status.draft")
  }, {
    key: "sent",
    label: t("status.sent")
  }, {
    key: "sale",
    label: t("status.sale")
  }, {
    key: "done",
    label: t("status.done")
  }];
  return <>
      {" "}
      {/* Approval Banner */}{" "}
      {order.approvalStatus === "pending_approval" && <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex justify-between items-center text-amber-800 text-sm">
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <AlertTriangle className="w-4 h-4" />{" "}
            <span className="font-medium">موافقة المخزون السالب معلّقة</span>{" "}
            <span>- بانتظار موافقة المدير لإصدار الأصناف.</span>{" "}
          </div>{" "}
          {/* Mock Manager Check: In real app, check permissions */}{" "}
          <button onClick={handleApprove} disabled={loading} className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 text-xs font-bold">
            {" "}
            موافقة الإصدار (المدير){" "}
          </button>{" "}
        </div>}{" "}
      <div className="border-b border-slate-200 p-3 flex justify-between items-center bg-white sticky top-0 z-10">
        {" "}
        <div className="flex gap-1.5">
          {" "}
          {(order.status === "draft" || order.status === "sent") && <button onClick={handleConfirm} disabled={loading || order.approvalStatus === "pending_approval"} className="bg-sky-600 text-white px-3 py-1.5 rounded-sm hover:bg-sky-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {" "}
              {loading ? t("processing") : t("action_confirm")}{" "}
            </button>}{" "}
          {order.status === "sale" && <button onClick={handleCreateInvoice} disabled={loading} className="bg-[#017E84] text-white px-3 py-1.5 rounded-sm hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
              {" "}
              {loading ? t("processing") : t("action_create_invoice")}{" "}
            </button>}{" "}
          {/* Email button */}{" "}
          {(order.status === "draft" || order.status === "sent" || order.status === "sale") && <button type="button" onClick={() => toast.info("سيتم إرسال البريد قريباً")} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium flex items-center gap-1">
              {" "}
              <Mail className="w-3.5 h-3.5" /> الإرسال عبر البريد
              الإلكتروني{" "}
            </button>}{" "}
          {order.status !== "done" && order.status !== "cancel" && <button onClick={handleCancel} disabled={loading} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium disabled:opacity-50">
              {" "}
              {t("action_cancel")}{" "}
            </button>}{" "}
          {/* Lock button for confirmed orders */}{" "}
          {order.status === "sale" && <button type="button" onClick={() => setLocked(true)} disabled={locked} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium disabled:opacity-50 flex items-center gap-1">
              {" "}
              <Lock className="w-3.5 h-3.5" /> {locked ? "مقفل" : "قفل"}{" "}
            </button>}{" "}
        </div>{" "}
        <StatusBar steps={statusSteps} currentStatus={order.status} />{" "}
      </div>{" "}
      {/* Negative Stock Warning Modal */}{" "}
      {approvalRequestOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          {" "}
          <div className="bg-white rounded-lg shadow-sm w-full max-w-lg border border-slate-200">
            {" "}
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 text-red-600">
              {" "}
              <AlertTriangle className="w-5 h-5" />{" "}
              <h3 className="font-bold">مخزون غير كافي</h3>{" "}
            </div>{" "}
            <div className="p-4 space-y-4">
              {" "}
              <p className="text-sm text-slate-600">
                {" "}
                الأصناف التالية لا تحتوي على مخزون كافٍ لإتمام هذا الأمر. يمكنك
                طلب موافقة المدير لإصدار المخزون السالب.{" "}
              </p>{" "}
              <div className="bg-slate-50 rounded border border-slate-200 p-3 text-sm">
                {" "}
                <ul className="space-y-2">
                  {" "}
                  {outOfStockItems.map((item: any, idx) => <li key={idx} className="flex justify-between items-center text-slate-700">
                      {" "}
                      <span className="font-medium">{item.name}</span>{" "}
                      <span className="text-red-600 font-mono text-xs">
                        {" "}
                        متاح: {item.qtyAvailable} / مطلوب:{" "}
                        {item.qtyRequested}{" "}
                      </span>{" "}
                    </li>)}{" "}
                </ul>{" "}
              </div>{" "}
            </div>{" "}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-lg">
              {" "}
              <button onClick={() => setApprovalRequestOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                {" "}
                إلغاء{" "}
              </button>{" "}
              <button onClick={handleRequestApproval} className="px-4 py-2 text-sm font-bold text-white bg-sky-600 rounded hover:bg-sky-700">
                {" "}
                طلب الموافقة{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>}{" "}
      {/* Invoice Creation Modal */}{" "}
      {invoiceModalOpen && <CreateInvoiceModal orderId={order.id} onClose={() => setInvoiceModalOpen(false)} />}{" "}
    </>;
}