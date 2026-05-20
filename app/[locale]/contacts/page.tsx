import prisma from "@/lib/prisma";
import { Mail, Phone, MapPin, User, Plus, Search, Filter, Download, Building, Users, CreditCard, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { serializeDecimal } from "@/lib/serialize";
export default async function ContactsPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    filter?: string;
    type?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const q = searchParams?.q;
  const filter = searchParams?.filter;
  const typeFilter = searchParams?.type;
  const where: any = {};
  if (q) {
    where.OR = [{
      name: {
        contains: q
      }
    }, {
      email: {
        contains: q
      }
    }, {
      phone: {
        contains: q
      }
    }];
  }
  if (filter === "customer") where.isCustomer = true;
  if (filter === "vendor") where.isVendor = true;
  if (typeFilter === "company") where.type = "company";
  if (typeFilter === "person") where.type = "person";
  const partners = await prisma.partner.findMany({
    where,
    orderBy: {
      name: "asc"
    },
    take: 80,
    include: {
      _count: {
        select: {
          invoices: true,
          saleOrders: true
        }
      }
    }
  });
  /* Calculate total receivable for each partner */
  const partnerIds = partners.map((p: any) => p.id);
  const receivables = await prisma.invoice.groupBy({
    by: ["partnerId"],
    _sum: {
      amountResidual: true
    },
    where: {
      partnerId: {
        in: partnerIds
      },
      state: "posted",
      type: "out_invoice"
    }
  });
  const payables = await prisma.invoice.groupBy({
    by: ["partnerId"],
    _sum: {
      amountResidual: true
    },
    where: {
      partnerId: {
        in: partnerIds
      },
      state: "posted",
      type: "in_invoice"
    }
  });
  const receivableMap: Record<string, number> = {};
  const payableMap: Record<string, number> = {};
  receivables.forEach((r: any) => {
    receivableMap[r.partnerId] = Number(r._sum.amountResidual || 0);
  });
  payables.forEach((p: any) => {
    payableMap[p.partnerId] = Number(p._sum.amountResidual || 0);
  });
  /* Stats */
  const totalPartners = partners.length;
  const customerCount = partners.filter((p: any) => p.isCustomer).length;
  const vendorCount = partners.filter((p: any) => p.isVendor).length;
  const companyCount = partners.filter((p: any) => p.type === "company").length;
  return <div className="p-6 space-y-5">
      {" "}
      {/* Header */}{" "}
      <div className="flex justify-between items-center">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-bold text-gray-900">جهات الاتصال</h1>{" "}
          <p className="text-xs text-gray-400 mt-0.5">
            إدارة العملاء والموردين والشركاء
          </p>{" "}
        </div>{" "}
        <div className="flex gap-3 items-center">
          {" "}
          <button className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs font-medium border border-gray-200">
            {" "}
            <Download className="w-3.5 h-3.5" /> تصدير{" "}
          </button>{" "}
          <Link href={`/${locale}/contacts/create`} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold shadow-sm">
            {" "}
            <Plus className="w-4 h-4" /> جديد{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
      {/* Stats Cards */}{" "}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {" "}
        {[{
        label: "إجمالي الشركاء",
        value: totalPartners,
        icon: Users,
        color: "bg-blue-50 text-blue-600"
      }, {
        label: "العملاء",
        value: customerCount,
        icon: User,
        color: "bg-emerald-50 text-teal-700"
      }, {
        label: "الموردين",
        value: vendorCount,
        icon: CreditCard,
        color: "bg-amber-50 text-amber-600"
      }, {
        label: "الشركات",
        value: companyCount,
        icon: Building,
        color: "bg-slate-50 text-slate-600"
      }].map((stat, i) => <div key={i} className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm hover-lift">
            {" "}
            <div className="flex items-center gap-2 mb-2">
              {" "}
              <div className={cn("p-1.5 rounded-lg", stat.color)}>
                {" "}
                <stat.icon className="w-3.5 h-3.5" />{" "}
              </div>{" "}
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {stat.label}
              </span>{" "}
            </div>{" "}
            <p className="text-2xl font-bold text-gray-900">
              {stat.value}
            </p>{" "}
          </div>)}{" "}
      </div>{" "}
      {/* Filters */}{" "}
      <div className="flex gap-2 flex-wrap items-center">
        {" "}
        <Filter className="w-4 h-4 text-gray-400" />{" "}
        <Link href={`/${locale}/contacts`} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors", !filter && !typeFilter ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          {" "}
          الكل ({totalPartners}){" "}
        </Link>{" "}
        <Link href={`/${locale}/contacts?filter=customer`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors", filter === "customer" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          {" "}
          العملاء{" "}
        </Link>{" "}
        <Link href={`/${locale}/contacts?filter=vendor`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors", filter === "vendor" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          {" "}
          الموردين{" "}
        </Link>{" "}
        <div className="w-px h-5 bg-gray-200 mx-1" />{" "}
        <Link href={`/${locale}/contacts?type=company`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors", typeFilter === "company" ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          {" "}
          <Building className="w-3 h-3 inline ml-1" /> شركات{" "}
        </Link>{" "}
        <Link href={`/${locale}/contacts?type=person`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors", typeFilter === "person" ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          {" "}
          <User className="w-3 h-3 inline ml-1" /> أفراد{" "}
        </Link>{" "}
        <div className="mr-auto">
          {" "}
          <form className="relative">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />{" "}
            <input type="text" name="q" defaultValue={q} placeholder="بحث بالاسم، البريد أو الهاتف..." className="pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-gray-50/50 w-72" />{" "}
          </form>{" "}
        </div>{" "}
      </div>{" "}
      {/* Kanban Cards */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {" "}
        {partners.map((partner: any) => {
        const receivable = receivableMap[partner.id] || 0;
        const payable = payableMap[partner.id] || 0;
        const hasBalance = receivable > 0 || payable > 0;
        return <Link href={`/${locale}/contacts/${partner.id}`} key={partner.id} className="block group">
              {" "}
              <div className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all hover-lift">
                {" "}
                <div className="flex items-start gap-3">
                  {" "}
                  {/* Avatar */}{" "}
                  <div className={cn("w-11 h-11 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors", partner.type === "company" ? "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600" : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600")}>
                    {" "}
                    {partner.image ? <img src={partner.image} alt={partner.name} className="w-full h-full object-cover rounded-sm" /> : partner.type === "company" ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}{" "}
                  </div>{" "}
                  <div className="flex-1 overflow-hidden">
                    {" "}
                    <h3 className="font-bold text-gray-900 truncate text-sm" title={partner.name}>
                      {partner.name}
                    </h3>{" "}
                    {partner.function && <p className="text-[10px] text-gray-400 truncate">
                        {partner.function}
                      </p>}{" "}
                    <div className="text-xs text-gray-500 space-y-1 mt-1.5">
                      {" "}
                      {partner.email && <div className="flex items-center gap-1.5 truncate">
                          {" "}
                          <Mail className="w-3 h-3 min-w-[12px] text-gray-300" />{" "}
                          <span className="truncate">{partner.email}</span>{" "}
                        </div>}{" "}
                      {partner.phone && <div className="flex items-center gap-1.5 truncate">
                          {" "}
                          <Phone className="w-3 h-3 min-w-[12px] text-gray-300" />{" "}
                          <span>{partner.phone}</span>{" "}
                        </div>}{" "}
                      {(partner.city || partner.country) && <div className="flex items-center gap-1.5 truncate">
                          {" "}
                          <MapPin className="w-3 h-3 min-w-[12px] text-gray-300" />{" "}
                          <span className="truncate">
                            {[partner.city, partner.country].filter(Boolean).join("، ")}
                          </span>{" "}
                        </div>}{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Tags & Balance */}{" "}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  {" "}
                  <div className="flex gap-1 flex-wrap">
                    {" "}
                    {partner.isCustomer && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 font-bold">
                        عميل
                      </span>}{" "}
                    {partner.isVendor && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100 font-bold">
                        مورد
                      </span>}{" "}
                    {partner.type === "company" && <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                        شركة
                      </span>}{" "}
                    {partner.customerType === "commercial" && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-200 font-bold">
                        تجاري
                      </span>}{" "}
                    {partner.customerType === "cash" && <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md border border-teal-200 font-bold">
                        نقدي
                      </span>}{" "}
                  </div>{" "}
                  {hasBalance && <div className="text-left">
                      {" "}
                      {receivable > 0 && <p className="text-[10px] font-bold text-teal-700">
                          {receivable.toLocaleString("en-US")}{" "}
                          <span className="text-gray-400">مدين</span>
                        </p>}{" "}
                      {payable > 0 && <p className="text-[10px] font-bold text-red-500">
                          {payable.toLocaleString("en-US")}{" "}
                          <span className="text-gray-400">دائن</span>
                        </p>}{" "}
                    </div>}{" "}
                </div>{" "}
                {/* Activity indicators */}{" "}
                {(partner._count.invoices > 0 || partner._count.saleOrders > 0) && <div className="mt-2 flex gap-3 text-[10px] text-gray-400">
                    {" "}
                    {partner._count.invoices > 0 && <span>{partner._count.invoices} فاتورة</span>}{" "}
                    {partner._count.saleOrders > 0 && <span>{partner._count.saleOrders} طلب بيع</span>}{" "}
                  </div>}{" "}
              </div>{" "}
            </Link>;
      })}{" "}
        {partners.length === 0 && <div className="col-span-full text-center py-16 text-gray-400">
            {" "}
            <User className="w-14 h-14 mx-auto mb-3 opacity-20" />{" "}
            <p className="font-bold text-lg">لا توجد جهات اتصال</p>{" "}
            <p className="text-sm mt-1">أضف جهات اتصال جديدة للبدء</p>{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}