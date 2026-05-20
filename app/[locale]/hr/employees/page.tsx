import { getAllEmployees } from "@/app/actions/hr";
import Link from "next/link";
import { Plus, User, Mail, Phone, Building2, Briefcase, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { serializeDecimal } from "@/lib/serialize";
export default async function EmployeesPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const rawEmployees = await getAllEmployees();
  const employees = serializeDecimal(rawEmployees);
  const colors = [" ", " ", " ", " ", " ", " "];
  return <div className="p-6 space-y-6 pb-20">
      {" "}
      {/* Page Header */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-gray-900">الموظفين</h1>{" "}
          <p className="text-sm text-gray-500 mt-1">
            {employees.length} موظف مسجل
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
      {/* Employee Cards Grid */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {" "}
        {employees.map((emp: any, idx: number) => {
        const initials = emp.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?";
        const colorClass = colors[idx % colors.length];
        const wage = emp.contracts?.[0]?.wage;
        return <Link key={emp.id} href={`/${locale}/hr/employees/${emp.id}`} className="group">
              {" "}
              <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
                {" "}
                {/* Color Header */}{" "}
                <div className={cn("h-20 bg-gradient-to-br relative", colorClass)}>
                  {" "}
                  <div className="absolute -bottom-6 right-5">
                    {" "}
                    <div className="w-14 h-14 bg-white rounded-sm shadow-sm flex items-center justify-center border-2 border-white">
                      {" "}
                      <span className={cn("text-lg font-bold bg-gradient-to-br bg-clip-text text-transparent", colorClass)}>
                        {" "}
                        {initials}{" "}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Card Content */}{" "}
                <div className="p-5 pt-10">
                  {" "}
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {emp.name}
                  </h3>{" "}
                  {emp.jobTitle && <div className="flex items-center gap-1.5 mt-2 text-gray-500">
                      {" "}
                      <Briefcase className="w-3.5 h-3.5" />{" "}
                      <span className="text-xs font-medium">
                        {emp.jobTitle}
                      </span>{" "}
                    </div>}{" "}
                  {emp.department && <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                      {" "}
                      <Building2 className="w-3.5 h-3.5" />{" "}
                      <span className="text-xs font-medium">
                        {emp.department.name}
                      </span>{" "}
                    </div>}{" "}
                  {emp.email && <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                      {" "}
                      <Mail className="w-3.5 h-3.5" />{" "}
                      <span className="text-xs font-medium truncate">
                        {emp.email}
                      </span>{" "}
                    </div>}{" "}
                  {/* Footer */}{" "}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                    {" "}
                    {wage ? <span className="text-sm font-bold text-gray-900">
                        {" "}
                        {Number(wage).toLocaleString("en-US")}{" "}
                        <span className="text-[10px] text-gray-400 font-bold">
                          EGP
                        </span>{" "}
                      </span> : <span className="text-xs text-gray-400 font-medium">
                        بدون عقد
                      </span>}{" "}
                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md", wage ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-50 text-gray-500 border border-gray-100")}>
                      {" "}
                      {wage ? "نشط" : "غير متعاقد"}{" "}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </Link>;
      })}{" "}
        {employees.length === 0 && <div className="col-span-full text-center py-16">
            {" "}
            <div className="w-16 h-16 bg-gray-100 rounded-sm mx-auto mb-4 flex items-center justify-center">
              {" "}
              <User className="w-8 h-8 text-gray-300" />{" "}
            </div>{" "}
            <h3 className="text-lg font-bold text-gray-700 mb-1">
              لا يوجد موظفين
            </h3>{" "}
            <p className="text-sm text-gray-400 mb-4">أضف أول موظف للبدء</p>{" "}
            <Link href={`/${locale}/hr/employees/new`} className="inline-flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-sm text-sm font-bold hover:bg-gray-900 transition-all">
              {" "}
              <Plus className="w-4 h-4" /> إضافة موظف{" "}
            </Link>{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}