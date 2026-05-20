import { getAllContracts } from "@/app/actions/hr";
import { serializeDecimal } from "@/lib/serialize";
import { FileSignature, User, Building2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
export default async function ContractsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const rawContracts = await getAllContracts();
  const contracts = serializeDecimal(rawContracts);
  return <div className="p-6 space-y-6 pb-20">
      {" "}
      {/* Page Header */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العقود</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contracts.length} عقد مسجل
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/hr/contracts/templates`} className="btn-secondary">
            <FileSignature className="w-4 h-4" /> قوالب العقود
          </Link>
        </div>
      </div>
      {/* Contracts Table */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        {" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/50">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-4 text-right">اسم العقد</th>{" "}
                <th className="px-6 py-4 text-right">الموظف</th>{" "}
                <th className="px-6 py-4 text-right">القسم</th>{" "}
                <th className="px-6 py-4 text-right">الراتب</th>{" "}
                <th className="px-6 py-4 text-right">تاريخ البداية</th>{" "}
                <th className="px-6 py-4 text-right">تاريخ النهاية</th>{" "}
                <th className="px-6 py-4 text-right">الحالة</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {contracts.map((contract: any) => <tr key={contract.id} className="hover:bg-gray-50/50 transition-all">
                  {" "}
                  <td className="px-6 py-4">
                    <Link href={`/${locale}/hr/contracts/${contract.id}/editor`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                      <FileSignature className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-gray-900 text-sm hover:underline">
                        {contract.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                        {" "}
                        <User className="w-3.5 h-3.5 text-indigo-600" />{" "}
                      </div>{" "}
                      <span className="text-sm font-medium text-gray-700">
                        {contract.employee?.name || "-"}
                      </span>{" "}
                    </div>{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                    {" "}
                    {contract.employee?.department?.name || "-"}{" "}
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
              {contracts.length === 0 && <tr>
                  {" "}
                  <td colSpan={7} className="px-6 py-16 text-center">
                    {" "}
                    <div className="w-14 h-14 bg-gray-100 rounded-sm mx-auto mb-3 flex items-center justify-center">
                      {" "}
                      <FileSignature className="w-7 h-7 text-gray-300" />{" "}
                    </div>{" "}
                    <h3 className="text-base font-bold text-gray-700 mb-1">
                      لا توجد عقود
                    </h3>{" "}
                    <p className="text-sm text-gray-400">
                      يتم إنشاء العقود تلقائياً عند إضافة موظف مع راتب
                    </p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}