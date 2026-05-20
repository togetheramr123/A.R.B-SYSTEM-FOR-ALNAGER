import { getPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CreditCard, Building2, Smartphone, Landmark } from "lucide-react";
import prisma from "@/lib/prisma";
export default async function PaymentInfoPage() {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect("/portal/login");
  const methods = await prisma.companyPaymentMethod.findMany({
    where: {
      companyId: portalUser.companyId,
      active: true
    },
    orderBy: {
      sortOrder: "asc"
    }
  });
  const getIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Landmark className="w-5 h-5" />;
      case "vodafone_cash":
        return <Smartphone className="w-5 h-5" />;
      case "instapay":
        return <CreditCard className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };
  const getColor = (type: string) => {
    switch (type) {
      case "bank":
        return " ";
      case "vodafone_cash":
        return " ";
      case "instapay":
        return " ";
      default:
        return " ";
    }
  };
  return <div className="min-h-screen bg-gray-50" dir="rtl">
      {" "}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        {" "}
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          {" "}
          <Link href="/portal" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            {" "}
            <ArrowRight className="w-4 h-4" />{" "}
          </Link>{" "}
          <h1 className="text-sm font-bold text-slate-800 flex-1">
            طرق الدفع
          </h1>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {" "}
        <p className="text-xs text-slate-400 mb-4">
          يمكنك التحويل على أي من الحسابات التالية
        </p>{" "}
        {methods.length > 0 ? <div className="space-y-3">
            {" "}
            {methods.map(method => <div key={method.id} className="bg-white rounded-sm border border-slate-200 p-4 shadow-sm">
                {" "}
                <div className="flex items-center gap-3 mb-3">
                  {" "}
                  <div className={`w-10 h-10 rounded-sm bg-gradient-to-br ${getColor(method.type)} flex items-center justify-center text-white shadow-sm`}>
                    {" "}
                    {getIcon(method.type)}{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold text-slate-800">
                      {method.label}
                    </h3>{" "}
                    <p className="text-[10px] text-slate-400 capitalize">
                      {method.type.replace("_", " ")}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="bg-slate-50 rounded-lg p-3 font-mono text-sm text-slate-700 text-center tracking-wider select-all">
                  {" "}
                  {method.accountInfo}{" "}
                </div>{" "}
              </div>)}{" "}
          </div> : <div className="flex flex-col items-center justify-center py-16 text-center">
            {" "}
            <CreditCard className="w-16 h-16 text-slate-200 mb-4" />{" "}
            <p className="text-sm text-slate-500">
              لم يتم إضافة طرق دفع بعد
            </p>{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}