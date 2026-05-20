import { getPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Phone, Mail, Globe } from "lucide-react";
export default async function PortalAboutPage() {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect("/portal/login");
  const company = portalUser.company;
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
            عن الشركة
          </h1>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {" "}
        <div className="bg-gray-50 rounded-sm p-8 text-center shadow-sm relative overflow-hidden">
          {" "}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>{" "}
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10"></div>{" "}
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-sm flex items-center justify-center mx-auto mb-4 border border-white/20">
            {" "}
            <Building2 className="w-10 h-10 text-white" />{" "}
          </div>{" "}
          <h2 className="text-2xl font-bold text-white mb-2">
            {company?.name || "الشركة"}
          </h2>{" "}
          <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            {" "}
            نحن سعداء بانضمامك لشبكة شركائنا التجاريين. نسعى دائماً لتقديم أفضل
            المنتجات والخدمات التي تلبي تطلعاتك.{" "}
          </p>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          {" "}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            {" "}
            <h3 className="text-sm font-bold text-slate-800">
              معلومات التواصل المباشر
            </h3>{" "}
          </div>{" "}
          <div className="p-4 space-y-4">
            {" "}
            <div className="flex items-start gap-3">
              {" "}
              <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                {" "}
                <Phone className="w-5 h-5" />{" "}
              </div>{" "}
              <div className="pt-1">
                {" "}
                <p className="text-xs text-slate-400 mb-0.5">
                  خدمة العملاء والمبيعات
                </p>{" "}
                <p className="text-sm font-bold text-slate-800 font-numbers" dir="ltr">
                  {company?.phone || "غير متوفر"}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-start gap-3">
              {" "}
              <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                {" "}
                <Mail className="w-5 h-5" />{" "}
              </div>{" "}
              <div className="pt-1">
                {" "}
                <p className="text-xs text-slate-400 mb-0.5">
                  البريد الإلكتروني
                </p>{" "}
                <p className="text-sm font-bold text-slate-800">
                  {company?.email || "غير متوفر"}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-start gap-3">
              {" "}
              <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                {" "}
                <Globe className="w-5 h-5" />{" "}
              </div>{" "}
              <div className="pt-1">
                {" "}
                <p className="text-xs text-slate-400 mb-0.5">العنوان</p>{" "}
                <p className="text-sm font-bold text-slate-800">
                  {company?.address || "غير متوفر"}
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}