import { getPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, User, Phone, MapPin, Hash, ShieldCheck } from "lucide-react";
export default async function PortalSettingsPage() {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect("/portal/login");
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
            إعدادات الحساب
          </h1>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {" "}
        <div className="bg-white rounded-sm p-6 border border-slate-200 shadow-sm text-center">
          {" "}
          <div className="w-20 h-20 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4">
            {" "}
            <User className="w-10 h-10" />{" "}
          </div>{" "}
          <h2 className="text-xl font-bold text-slate-800">
            {portalUser.name}
          </h2>{" "}
          <p className="text-sm text-slate-500 mt-1">
            {portalUser.partner?.name}
          </p>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          {" "}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            {" "}
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {" "}
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> بيانات
              الاتصال{" "}
            </h3>{" "}
          </div>{" "}
          <div className="p-4 space-y-4">
            {" "}
            <div className="flex items-center gap-3">
              {" "}
              <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400">
                {" "}
                <Phone className="w-5 h-5" />{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-xs text-slate-400 mb-0.5">
                  رقم الهاتف الأساسي
                </p>{" "}
                <p className="text-sm font-bold text-slate-800 font-numbers">
                  {portalUser.partner?.phone || portalUser.username}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            {portalUser.partner?.email && <div className="flex items-center gap-3">
                {" "}
                <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400">
                  {" "}
                  <Hash className="w-5 h-5" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <p className="text-xs text-slate-400 mb-0.5">
                    البريد الإلكتروني
                  </p>{" "}
                  <p className="text-sm font-bold text-slate-800">
                    {portalUser.partner.email}
                  </p>{" "}
                </div>{" "}
              </div>}{" "}
            <div className="flex items-center gap-3">
              {" "}
              <div className="w-10 h-10 rounded-sm bg-slate-50 flex items-center justify-center text-slate-400">
                {" "}
                <MapPin className="w-5 h-5" />{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-xs text-slate-400 mb-0.5">
                  العنوان المسجل
                </p>{" "}
                <p className="text-sm font-bold text-slate-800">
                  {portalUser.partner?.street || "غير مسجل"}
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="text-center pt-8">
          {" "}
          <p className="text-xs text-slate-400">
            {" "}
            لتعديل أي من هذه البيانات، يرجى التواصل مع الدعم الفني أو المندوب
            الخاص بك.{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}