import { getHRStats, getAllDepartments } from "@/app/actions/hr";
import { Users, Building2, FileSignature, Receipt, Banknote, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
export default async function HRDashboard(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const stats = await getHRStats();
  const departments = await getAllDepartments();
  const statCards = [{
    label: "إجمالي الموظفين",
    value: stats.employeeCount,
    icon: Users,
    color: " ",
    bg: "bg-blue-50",
    text: "text-blue-600",
    link: `/${locale}/hr/employees`
  }, {
    label: "الأقسام",
    value: stats.departmentCount,
    icon: Building2,
    color: " ",
    bg: "bg-emerald-50",
    text: "text-teal-700",
    link: `/${locale}/hr/departments`
  }, {
    label: "العقود النشطة",
    value: stats.activeContractsCount,
    icon: FileSignature,
    color: " ",
    bg: "bg-amber-50",
    text: "text-amber-600",
    link: `/${locale}/hr/contracts`
  }, {
    label: "كشوف المرتبات",
    value: stats.payslipCount,
    icon: Receipt,
    color: " ",
    bg: "bg-slate-50",
    text: "text-slate-600",
    link: `/${locale}/hr/payslips`
  }];
  const formatAmount = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (val >= 1000) return (val / 1000).toFixed(0) + "K";
    return val.toLocaleString("en-US");
  };
  return <div className="p-6 space-y-8 pb-20">
      {" "}
      {/* Page Header */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-gray-900">
            الموارد البشرية
          </h1>{" "}
          <p className="text-sm text-gray-500 mt-1">
            إدارة الموظفين والعقود وكشوف المرتبات
          </p>{" "}
        </div>{" "}
        <div className="flex gap-3">
          {" "}
          <Link href={`/${locale}/hr/employees/new`} className="bg-gray-800 text-white px-5 py-2.5 rounded-sm text-sm font-bold hover:bg-gray-900 transition-all flex items-center gap-2 shadow-sm">
            {" "}
            <Plus className="w-4 h-4" /> موظف جديد{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
      {/* Stat Cards */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {" "}
        {statCards.map((card, idx) => {
        const Icon = card.icon;
        return <Link key={idx} href={card.link} className="group">
              {" "}
              <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all hover:border-gray-200">
                {" "}
                <div className="flex items-center justify-between mb-4">
                  {" "}
                  <div className={cn("p-3 rounded-sm", card.bg)}>
                    {" "}
                    <Icon className={cn("w-5 h-5", card.text)} />{" "}
                  </div>{" "}
                  <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />{" "}
                </div>{" "}
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>{" "}
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">
                  {card.label}
                </p>{" "}
              </div>{" "}
            </Link>;
      })}{" "}
      </div>{" "}
      {/* Total Wages Card */}{" "}
      <div className="bg-gray-50 rounded-sm p-8 text-white shadow-sm relative overflow-hidden">
        {" "}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          {" "}
          <div className="absolute top-4 left-8 w-40 h-40 bg-white rounded-full blur-3xl" />{" "}
          <div className="absolute bottom-4 right-8 w-60 h-60 bg-blue-500 rounded-full blur-3xl" />{" "}
        </div>{" "}
        <div className="relative flex items-center justify-between">
          {" "}
          <div>
            {" "}
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              إجمالي الرواتب الشهرية (العقود النشطة)
            </p>{" "}
            <p className="text-4xl font-bold">
              {formatAmount(stats.totalWages)}{" "}
              <span className="text-lg text-gray-400">EGP</span>
            </p>{" "}
          </div>{" "}
          <div className="bg-white/10 p-5 rounded-sm backdrop-blur-xl">
            {" "}
            <Banknote className="w-8 h-8 text-emerald-400" />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Departments Overview */}{" "}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {" "}
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
          {" "}
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            {" "}
            <div>
              {" "}
              <h3 className="text-lg font-bold text-gray-900">الأقسام</h3>{" "}
              <p className="text-xs text-gray-400 mt-0.5">
                توزيع الموظفين حسب الأقسام
              </p>{" "}
            </div>{" "}
            <Link href={`/${locale}/hr/departments`} className="bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 hover:text-white transition-all">
              {" "}
              عرض الكل{" "}
            </Link>{" "}
          </div>{" "}
          <div className="p-6 space-y-4">
            {" "}
            {departments.length > 0 ? departments.map((dept: any) => {
            const count = dept._count.employees;
            const maxCount = Math.max(...departments.map((d: any) => d._count.employees), 1);
            const percentage = count / maxCount * 100;
            return <div key={dept.id} className="space-y-2">
                    {" "}
                    <div className="flex items-center justify-between">
                      {" "}
                      <span className="text-sm font-bold text-gray-700">
                        {dept.name}
                      </span>{" "}
                      <span className="text-sm font-bold text-gray-900">
                        {count}{" "}
                        <span className="text-xs text-gray-400 font-medium">
                          موظف
                        </span>
                      </span>{" "}
                    </div>{" "}
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      {" "}
                      <div className="bg-[#714B67] h-2 rounded-full transition-all duration-500" style={{
                  width: `${percentage}%`
                }} />{" "}
                    </div>{" "}
                  </div>;
          }) : <div className="text-center py-8 text-gray-400">
                {" "}
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />{" "}
                <p className="text-sm font-medium">لا توجد أقسام بعد</p>{" "}
              </div>}{" "}
          </div>{" "}
        </div>{" "}
        {/* Quick Actions */}{" "}
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
          {" "}
          <div className="p-6 border-b border-gray-50">
            {" "}
            <h3 className="text-lg font-bold text-gray-900">
              إجراءات سريعة
            </h3>{" "}
            <p className="text-xs text-gray-400 mt-0.5">
              الوصول السريع للعمليات الشائعة
            </p>{" "}
          </div>{" "}
          <div className="p-6 grid grid-cols-2 gap-4">
            {" "}
            {[{
            href: `/${locale}/hr/employees/new`,
            icon: Users,
            label: "إضافة موظف",
            desc: "تسجيل موظف جديد",
            color: "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
          }, {
            href: `/${locale}/hr/departments`,
            icon: Building2,
            label: "إدارة الأقسام",
            desc: "إضافة وتعديل الأقسام",
            color: "bg-emerald-50 text-teal-700 group-hover:bg-teal-50"
          }, {
            href: `/${locale}/hr/contracts`,
            icon: FileSignature,
            label: "العقود",
            desc: "إدارة عقود العمل",
            color: "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
          }, {
            href: `/${locale}/hr/payslips`,
            icon: Receipt,
            label: "كشوف المرتبات",
            desc: "إنشاء كشف راتب",
            color: "bg-slate-50 text-slate-600 group-hover:bg-slate-100"
          }].map((action, i) => {
            const Icon = action.icon;
            return <Link key={i} href={action.href} className="group p-5 rounded-sm border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  {" "}
                  <div className={cn("p-3 rounded-sm w-fit mb-3 transition-colors", action.color)}>
                    {" "}
                    <Icon className="w-5 h-5" />{" "}
                  </div>{" "}
                  <p className="text-sm font-bold text-gray-800">
                    {action.label}
                  </p>{" "}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {action.desc}
                  </p>{" "}
                </Link>;
          })}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}