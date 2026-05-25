"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Download, Users, User, CreditCard, Building, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { OdooTable, OdooColumn } from "@/components/common/OdooTable";

interface PartnerListClientProps {
  partners: any[];
  locale: string;
  receivableMap: Record<string, number>;
  payableMap: Record<string, number>;
  stats: {
    totalPartners: number;
    customerCount: number;
    vendorCount: number;
    companyCount: number;
  };
  q?: string;
  filter?: string;
  typeFilter?: string;
}

export function PartnerListClient({
  partners,
  locale,
  receivableMap,
  payableMap,
  stats,
  q,
  filter,
  typeFilter
}: PartnerListClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const columns: OdooColumn[] = [
    {
      id: "name",
      label: "الاسم",
      render: (row) => (
        <Link href={`/${locale}/contacts/${row.id}`} className="font-bold text-[#714B67] hover:underline">
          {row.name}
        </Link>
      )
    },
    {
      id: "type",
      label: "النوع",
      render: (row) => (row.type === "company" ? "شركة" : "فرد")
    },
    {
      id: "phone",
      label: "الهاتف",
      render: (row) => row.phone || row.mobile || "—"
    },
    {
      id: "email",
      label: "البريد الإلكتروني",
      render: (row) => row.email || "—"
    },
    {
      id: "receivable",
      label: "مدين (ج.م)",
      render: (row) => {
        const val = receivableMap[row.id] || 0;
        return val > 0 ? (
          <span className="font-bold text-teal-700">{val.toLocaleString("en-US")}</span>
        ) : "0";
      }
    },
    {
      id: "payable",
      label: "دائن (ج.م)",
      render: (row) => {
        const val = payableMap[row.id] || 0;
        return val > 0 ? (
          <span className="font-bold text-red-500">{val.toLocaleString("en-US")}</span>
        ) : "0";
      }
    }
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-arabic">جهات الاتصال</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-arabic">
            إدارة العملاء والموردين والشركاء
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded transition-colors", viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800")}
              title="عرض كروت"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded transition-colors", viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800")}
              title="عرض قائمة"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs font-medium border border-gray-200 font-arabic">
            <Download className="w-3.5 h-3.5" /> تصدير
          </button>
          <Link href={`/${locale}/contacts/create`} className="bg-[#714B67] hover:bg-[#5e3e56] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold shadow-sm font-arabic">
            <Plus className="w-4 h-4" /> جديد
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الشركاء", value: stats.totalPartners, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "العملاء", value: stats.customerCount, icon: User, color: "bg-emerald-50 text-teal-700" },
          { label: "الموردين", value: stats.vendorCount, icon: CreditCard, color: "bg-amber-50 text-amber-600" },
          { label: "الشركات", value: stats.companyCount, icon: Building, color: "bg-slate-50 text-slate-600" }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm hover-lift font-arabic">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg", stat.color)}>
                <stat.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex gap-2 flex-wrap items-center">
        <Link href={`/${locale}/contacts`} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors font-arabic", !filter && !typeFilter ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          الكل ({stats.totalPartners})
        </Link>
        <Link href={`/${locale}/contacts?filter=customer`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors font-arabic", filter === "customer" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          العملاء
        </Link>
        <Link href={`/${locale}/contacts?filter=vendor`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors font-arabic", filter === "vendor" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          الموردين
        </Link>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <Link href={`/${locale}/contacts?type=company`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors font-arabic", typeFilter === "company" ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          <Building className="w-3 h-3 inline ml-1" /> شركات
        </Link>
        <Link href={`/${locale}/contacts?type=person`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors font-arabic", typeFilter === "person" ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          <User className="w-3 h-3 inline ml-1" /> أفراد
        </Link>
        <div className="mr-auto">
          <form className="relative">
            <input type="text" name="q" defaultValue={q} placeholder="بحث بالاسم، البريد أو الهاتف..." className="pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-gray-50/50 w-72 font-arabic" />
          </form>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
          <OdooTable
            title="قائمة جهات الاتصال"
            columns={columns}
            data={partners}
            modelName="partner"
            currentPage={1}
            pageSize={100}
            totalCount={partners.length}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {partners.map((partner: any) => {
            const receivable = receivableMap[partner.id] || 0;
            const payable = payableMap[partner.id] || 0;
            const hasBalance = receivable > 0 || payable > 0;
            return (
              <Link href={`/${locale}/contacts/${partner.id}`} key={partner.id} className="block group">
                <div className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all hover-lift">
                  <div className="flex items-start gap-3 font-arabic">
                    <div className={cn("w-11 h-11 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors", partner.type === "company" ? "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600" : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600")}>
                      {partner.image ? <img src={partner.image} alt={partner.name} className="w-full h-full object-cover rounded-sm" /> : partner.type === "company" ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold text-gray-900 truncate text-sm" title={partner.name}>
                        {partner.name}
                      </h3>
                      {partner.function && <p className="text-[10px] text-gray-400 truncate">{partner.function}</p>}
                      <div className="text-xs text-gray-500 space-y-1 mt-1.5">
                        {partner.email && <div className="flex items-center gap-1.5 truncate"><span>{partner.email}</span></div>}
                        {partner.phone && <div className="flex items-center gap-1.5 truncate"><span>{partner.phone}</span></div>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between font-arabic">
                    <div className="flex gap-1 flex-wrap">
                      {partner.isCustomer && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 font-bold">عميل</span>}
                      {partner.isVendor && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100 font-bold">مورد</span>}
                      {partner.type === "company" && <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 font-bold">شركة</span>}
                    </div>
                    {hasBalance && (
                      <div className="text-left">
                        {receivable > 0 && <p className="text-[10px] font-bold text-teal-700">{receivable.toLocaleString("en-US")} <span className="text-gray-400">مدين</span></p>}
                        {payable > 0 && <p className="text-[10px] font-bold text-red-500">{payable.toLocaleString("en-US")} <span className="text-gray-400">دائن</span></p>}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {partners.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 font-arabic">
              <User className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="font-bold text-lg">لا توجد جهات اتصال</p>
              <p className="text-sm mt-1">أضف جهات اتصال جديدة للبدء</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
