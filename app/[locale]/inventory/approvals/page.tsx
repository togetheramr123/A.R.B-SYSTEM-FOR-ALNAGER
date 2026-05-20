import { getTranslations } from "next-intl/server";
import { getApprovalRequests } from "@/app/actions/approvals";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { ApprovalActions } from "@/components/inventory/ApprovalActions";
/* Assuming we'll create this client component */
export default async function ApprovalsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const t = await getTranslations("Inventory");
  const requests = await getApprovalRequests();
  const pendingRequests = requests.filter(r => r.status === "pending");
  const pastRequests = requests.filter(r => r.status !== "pending");
  return <div className="p-6 max-w-5xl mx-auto space-y-6">
      {" "}
      <div className="flex justify-between items-center">
        {" "}
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          {" "}
          <AlertTriangle className="w-6 h-6 text-amber-500" /> طلبات الإذن (صرف
          بالسالب){" "}
        </h1>{" "}
      </div>{" "}
      {/* Pending Requests */}{" "}
      <section className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
        {" "}
        <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
          {" "}
          <h2 className="font-bold text-amber-800 flex items-center gap-2">
            {" "}
            <Clock className="w-5 h-5" /> طلبات بانتظار الموافقة (
            {pendingRequests.length}){" "}
          </h2>{" "}
        </div>{" "}
        {pendingRequests.length === 0 ? <div className="p-8 text-center text-slate-400 font-medium">
            لا توجد طلبات معلقة
          </div> : <div className="divide-y divide-slate-100">
            {" "}
            {pendingRequests.map(req => <div key={req.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                {" "}
                <div className="space-y-1 w-full">
                  {" "}
                  <div className="flex items-center gap-2">
                    {" "}
                    <span className="font-bold text-slate-700">
                      طلب صرف للمنتج:
                    </span>{" "}
                    <span className="text-blue-600 font-bold bg-blue-50 px-2 rounded">
                      {req.parsedDetails?.productId}
                    </span>{" "}
                  </div>{" "}
                  <div className="text-sm text-slate-500">
                    {" "}
                    يطلب الإصدار من رصيد صفر (الكمية المطلوبة:{" "}
                    <span className="text-red-600 font-bold">
                      {req.parsedDetails?.requestedQty}
                    </span>
                    ){" "}
                  </div>{" "}
                  <div className="text-xs text-slate-400">
                    {" "}
                    <span>
                      بواسطة الموظف: {req.requester.name || req.requester.email}
                    </span>{" "}
                    <span className="mx-2">•</span>{" "}
                    <span>
                      مرجعية: {req.parsedDetails?.pickingName || "غير متوفر"}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="shrink-0 flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  {" "}
                  <ApprovalActions requestId={req.id} />{" "}
                </div>{" "}
              </div>)}{" "}
          </div>}{" "}
      </section>{" "}
      {/* Past Requests */}{" "}
      <section className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden opacity-80">
        {" "}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          {" "}
          <h2 className="font-bold text-slate-600 text-sm">
            أرشيف الطلبات
          </h2>{" "}
        </div>{" "}
        <div className="divide-y divide-slate-100">
          {" "}
          {pastRequests.map(req => <div key={req.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
              {" "}
              <div className="space-y-1">
                {" "}
                <span className="font-medium text-slate-700 text-sm">
                  {req.parsedDetails?.productId}
                </span>{" "}
                <div className="text-xs text-slate-500">
                  مطلوب: {req.parsedDetails?.requestedQty}
                </div>{" "}
              </div>{" "}
              <div className="flex items-center gap-2">
                {" "}
                {req.status === "approved" ? <span className="bg-emerald-50 text-teal-700 border border-emerald-200 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    {" "}
                    <CheckCircle className="w-3 h-3" /> تم الموافقة (
                    {req.approver?.name || "مدير"}){" "}
                  </span> : <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    {" "}
                    <XCircle className="w-3 h-3" /> تم الرفض{" "}
                  </span>}{" "}
              </div>{" "}
            </div>)}{" "}
          {pastRequests.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">
              لا يوجد سجل سابق
            </div>}{" "}
        </div>{" "}
      </section>{" "}
    </div>;
}