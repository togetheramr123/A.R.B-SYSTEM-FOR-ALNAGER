import { getEmployee, getAllDepartments } from "@/app/actions/hr";
import { notFound } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Building2, Briefcase, FileSignature, Receipt, ArrowRight, Calendar, Banknote, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { serializeDecimal } from "@/lib/serialize";
import { Chatter } from "@/components/chatter/Chatter";
export default async function EmployeeDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const rawEmployee = await getEmployee(id);
  if (!rawEmployee) return notFound();
  const employee = serializeDecimal(rawEmployee);
  const activeContract = employee.contracts?.find((c: any) => c.state === "open");
  return <div className="p-6 space-y-6 pb-20">
      {" "}
      {/* Breadcrumb */}{" "}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {" "}
        <Link href={`/${locale}/hr/employees`} className="hover:text-indigo-600 transition-colors font-medium">
          الموظفين
        </Link>{" "}
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />{" "}
        <span className="font-bold text-gray-900">{employee.name}</span>{" "}
      </div>{" "}
      {/* Employee Header Card */}{" "}
      <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
        {" "}
        <div className="h-32 bg-[#714B67] relative">
          {" "}
          <div className="absolute -bottom-8 right-8">
            {" "}
            <div className="w-20 h-20 bg-white rounded-sm shadow-sm flex items-center justify-center border-4 border-white">
              {" "}
              <span className="text-2xl font-bold text-indigo-600">
                {" "}
                {employee.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="p-8 pt-14">
          {" "}
          <div className="flex items-start justify-between">
            {" "}
            <div>
              {" "}
              <h1 className="text-2xl font-bold text-gray-900">
                {employee.name}
              </h1>{" "}
              {employee.jobTitle && <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  {" "}
                  <Briefcase className="w-4 h-4" /> {employee.jobTitle}{" "}
                </p>}{" "}
            </div>{" "}
            <div className="flex gap-2">
              {" "}
              {activeContract ? <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  {" "}
                  <CheckCircle2 className="w-3.5 h-3.5" /> عقد نشط{" "}
                </span> : <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  {" "}
                  <AlertCircle className="w-3.5 h-3.5" /> بدون عقد{" "}
                </span>}{" "}
            </div>{" "}
          </div>{" "}
          {/* Info Grid */}{" "}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {" "}
            {[{
            label: "القسم",
            value: employee.department?.name || "غير محدد",
            icon: Building2
          }, {
            label: "البريد الإلكتروني",
            value: employee.email || "غير محدد",
            icon: Mail
          }, {
            label: "الهاتف",
            value: employee.phone || "غير محدد",
            icon: Phone
          }, {
            label: "الراتب الحالي",
            value: activeContract ? `${Number(activeContract.wage).toLocaleString("en-US")} EGP` : "لا يوجد عقد",
            icon: Banknote
          }].map((item, i) => {
            const Icon = item.icon;
            return <div key={i} className="bg-gray-50 rounded-sm p-4 border border-gray-100">
                  {" "}
                  <div className="flex items-center gap-2 mb-2">
                    {" "}
                    <Icon className="w-4 h-4 text-gray-400" />{" "}
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {item.label}
                    </span>{" "}
                  </div>{" "}
                  <p className="text-sm font-bold text-gray-800">
                    {item.value}
                  </p>{" "}
                </div>;
          })}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Smart Buttons */}{" "}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {" "}
        {[{
        label: "العقود",
        count: employee.contracts?.length || 0,
        icon: FileSignature,
        color: "text-amber-600 bg-amber-50",
        section: "contracts"
      }, {
        label: "كشوف المرتبات",
        count: employee.payslips?.length || 0,
        icon: Receipt,
        color: "text-slate-600 bg-slate-50",
        section: "payslips"
      }].map((btn, i) => {
        const Icon = btn.icon;
        return <a key={i} href={`#${btn.section}`} className="bg-white rounded-sm border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all flex items-center gap-3">
              {" "}
              <div className={cn("p-2.5 rounded-lg", btn.color)}>
                {" "}
                <Icon className="w-5 h-5" />{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-xl font-bold text-gray-900">
                  {btn.count}
                </p>{" "}
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {btn.label}
                </p>{" "}
              </div>{" "}
            </a>;
      })}{" "}
      </div>{" "}
      {/* Contracts Section */}{" "}
      <div id="contracts" className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        {" "}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="p-2 bg-amber-50 rounded-lg">
              {" "}
              <FileSignature className="w-5 h-5 text-amber-600" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h3 className="text-lg font-bold text-gray-900">العقود</h3>{" "}
              <p className="text-xs text-gray-400">
                {employee.contracts?.length || 0} عقد
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/50">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-4 text-right">اسم العقد</th>{" "}
                <th className="px-6 py-4 text-right">الراتب</th>{" "}
                <th className="px-6 py-4 text-right">تاريخ البداية</th>{" "}
                <th className="px-6 py-4 text-right">تاريخ النهاية</th>{" "}
                <th className="px-6 py-4 text-right">الحالة</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {employee.contracts?.map((contract: any) => <tr key={contract.id} className="hover:bg-gray-50/50 transition-all">
                  {" "}
                  <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                    {contract.name}
                  </td>{" "}
                  <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                    {" "}
                    {Number(contract.wage).toLocaleString("en-US")}{" "}
                    <span className="text-[10px] text-gray-400">EGP</span>{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {" "}
                    {new Date(contract.startDate).toLocaleDateString("en-CA")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {" "}
                    {contract.endDate ? new Date(contract.endDate).toLocaleDateString("en-CA") : "مفتوح"}{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-md border", contract.state === "open" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100")}>
                      {" "}
                      {contract.state === "open" ? "نشط" : "منتهي"}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
              {(!employee.contracts || employee.contracts.length === 0) && <tr>
                  {" "}
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                    لا توجد عقود
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
      {/* Payslips Section */}{" "}
      <div id="payslips" className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        {" "}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="p-2 bg-slate-50 rounded-lg">
              {" "}
              <Receipt className="w-5 h-5 text-slate-600" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h3 className="text-lg font-bold text-gray-900">
                كشوف المرتبات
              </h3>{" "}
              <p className="text-xs text-gray-400">
                {employee.payslips?.length || 0} كشف
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/50">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-4 text-right">المرجع</th>{" "}
                <th className="px-6 py-4 text-right">الفترة</th>{" "}
                <th className="px-6 py-4 text-right">الراتب الأساسي</th>{" "}
                <th className="px-6 py-4 text-right">الإجمالي</th>{" "}
                <th className="px-6 py-4 text-right">الصافي</th>{" "}
                <th className="px-6 py-4 text-right">الحالة</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {employee.payslips?.map((slip: any) => <tr key={slip.id} className="hover:bg-gray-50/50 transition-all">
                  {" "}
                  <td className="px-6 py-4 font-bold text-blue-600 text-sm">
                    {slip.name}
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {" "}
                    {new Date(slip.dateFrom).toLocaleDateString("en-CA")} —{" "}
                    {new Date(slip.dateTo).toLocaleDateString("en-CA")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-700 text-sm font-medium">
                    {" "}
                    {Number(slip.basicWage).toLocaleString("en-US")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-700 text-sm font-medium">
                    {" "}
                    {Number(slip.gross).toLocaleString("en-US")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                    {" "}
                    {Number(slip.net).toLocaleString("en-US")}{" "}
                    <span className="text-[10px] text-gray-400">EGP</span>{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-md border", slip.state === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100")}>
                      {" "}
                      {slip.state === "done" ? "مؤكد" : "مسودة"}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
              {(!employee.payslips || employee.payslips.length === 0) && <tr>
                  {" "}
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                    لا توجد كشوف مرتبات
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-6">
          <Chatter model="employee" id={employee.id} />
        </div>
      </div>
    </div>;
}