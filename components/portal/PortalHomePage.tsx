"use client";

import { ShoppingBag, Package, FileText, CreditCard, LogOut, Heart, Building2, Phone, User, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { portalLogout } from "@/app/actions/portalAuth";
import Link from "next/link";
import { useState, useEffect } from "react";
const menuItems = [{
  icon: <Package className="w-6 h-6" />,
  label: "المنتجات",
  description: "تصفح الكتالوج وأضف للسلة",
  href: "/portal/products",
  color: " ",
  shadow: ""
}, {
  icon: <ShoppingBag className="w-6 h-6" />,
  label: "طلباتي",
  description: "متابعة حالة طلباتك",
  href: "/portal/orders",
  color: " ",
  shadow: ""
}, {
  icon: <Heart className="w-6 h-6" />,
  label: "المفضلة",
  description: "المنتجات المحفوظة",
  href: "/portal/favorites",
  color: " ",
  shadow: ""
}, {
  icon: <FileText className="w-6 h-6" />,
  label: "كشف الحساب",
  description: "طلب كشف حساب من المحاسب",
  href: "/portal/account",
  color: " ",
  shadow: ""
}, {
  icon: <CreditCard className="w-6 h-6" />,
  label: "طرق الدفع",
  description: "حسابات الشركة البنكية",
  href: "/portal/payment-info",
  color: " ",
  shadow: ""
}, {
  icon: <Building2 className="w-6 h-6" />,
  label: "عن الشركة",
  description: "معلومات وفروع الشركة",
  href: "/portal/about",
  color: " ",
  shadow: ""
}];
export function PortalHomePage({
  user,
  banners = []
}: {
  user: any;
  banners?: any[];
}) {
  const [currentBanner, setCurrentBanner] = useState(0);
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);
  return <div className="min-h-screen bg-gray-50 pb-20">
      {" "}
      {/* Header */}{" "}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        {" "}
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="w-9 h-9 rounded-sm bg-[#714B67] flex items-center justify-center shadow-sm">
              {" "}
              <ShoppingBag className="w-5 h-5 text-white" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h1 className="text-sm font-bold text-slate-800 leading-tight">
                {" "}
                {user.company?.name || "بوابة التجّار"}{" "}
              </h1>{" "}
              <p className="text-[10px] text-slate-400 leading-tight">
                بوابة التجّار
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <Link href="/portal/settings" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              {" "}
              <User className="w-4 h-4" />{" "}
            </Link>{" "}
            <form action={portalLogout}>
              {" "}
              <button type="submit" className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-500 transition-colors" title="تسجيل الخروج">
                {" "}
                <LogOut className="w-4 h-4" />{" "}
              </button>{" "}
            </form>{" "}
          </div>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {" "}
        {/* Welcome Card */}{" "}
        <div className="bg-[#714B67] rounded-sm p-5 mb-6 text-white shadow-sm ">
          {" "}
          <p className="text-emerald-100 text-xs mb-1">مرحباً بك</p>{" "}
          <h2 className="text-xl font-bold mb-1">{user.name}</h2>{" "}
          <p className="text-emerald-100 text-xs flex items-center gap-1">
            {" "}
            <Phone className="w-3 h-3" />{" "}
            {user.partner?.phone || user.username}{" "}
          </p>{" "}
        </div>{" "}
        {/* Banners Carousel */}{" "}
        {banners && banners.length > 0 && <div className="relative bg-white rounded-sm overflow-hidden mb-6 shadow-sm group">
            {" "}
            <div className="h-36 relative w-full">
              {" "}
              {banners.map((banner: any, index: number) => <Link key={banner.id} href={banner.linkUrl || "#"} className={`absolute inset-0 transition-opacity duration-500 ${index === currentBanner ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                  {" "}
                  <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" />{" "}
                  {banner.title && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      {" "}
                      <p className="text-white text-xs font-bold">
                        {banner.title}
                      </p>{" "}
                    </div>}{" "}
                </Link>)}{" "}
            </div>{" "}
            {banners.length > 1 && <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                {" "}
                {banners.map((_: any, idx: number) => <button key={idx} onClick={() => setCurrentBanner(idx)} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentBanner ? "bg-white w-4" : "bg-white/50"}`} />)}{" "}
              </div>}{" "}
          </div>}{" "}
        {/* Menu Grid */}{" "}
        <div className="grid grid-cols-2 gap-3">
          {" "}
          {menuItems.map(item => <Link key={item.href} href={item.href} className="bg-white rounded-sm border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              {" "}
              <div className={`w-11 h-11 rounded-sm bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-3 shadow-md ${item.shadow} group-hover:scale-105 transition-transform`}>
                {" "}
                {item.icon}{" "}
              </div>{" "}
              <h3 className="text-sm font-bold text-slate-800 mb-0.5">
                {item.label}
              </h3>{" "}
              <p className="text-[11px] text-slate-400 leading-tight">
                {item.description}
              </p>{" "}
            </Link>)}{" "}
        </div>{" "}
        {/* Footer */}{" "}
        <div className="mt-8 text-center pb-6">
          {" "}
          <p className="text-[10px] text-slate-400">
            {" "}
            © 2026 {user.company?.name} — بوابة التجّار{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}