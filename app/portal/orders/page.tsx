import { getPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Clock, CheckCircle2, XCircle, RefreshCw, Printer, ExternalLink, ChevronDown } from "lucide-react";
import { getPortalOrders } from "@/app/actions/portalOrders";
import PortalOrdersClient from "@/components/portal/PortalOrdersClient";
export default async function OrdersPage() {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect("/portal/login");
  const orders = await getPortalOrders();
  return <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {" "}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        {" "}
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          {" "}
          <Link href="/portal" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            {" "}
            <ArrowRight className="w-4 h-4" />{" "}
          </Link>{" "}
          <h1 className="text-sm font-bold text-slate-800 flex-1">طلباتي</h1>{" "}
          <span className="text-xs font-bold text-teal-700 bg-emerald-50 px-2 py-1 rounded-md">
            {orders.length}
          </span>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {" "}
        {orders.length > 0 ? <PortalOrdersClient initialOrders={orders} /> : <div className="flex flex-col items-center justify-center py-20 text-center">
            {" "}
            <ShoppingBag className="w-16 h-16 text-slate-200 mb-4" />{" "}
            <p className="text-sm text-slate-500 font-medium">
              لا توجد طلبات بعد
            </p>{" "}
            <p className="text-xs text-slate-400 mt-1">
              ابدأ بتصفح المنتجات وإضافتها للسلة
            </p>{" "}
            <Link href="/portal/products" className="mt-4 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
              {" "}
              تصفح المنتجات{" "}
            </Link>{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}