"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Hash, Plus, Search, Trash2, Edit2, Package, Calendar, X, ChevronDown } from "lucide-react";
import { getLots, createLot, deleteLot, getProductsWithTracking } from "@/app/actions/inventory";
import { TopPortal } from "@/components/common/TopPortal";
export default function LotsPage() {
  const [lots, setLots] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  /* Create Form */
  const [newLot, setNewLot] = useState({
    name: "",
    productId: "",
    ref: "",
    expirationDate: "",
    note: ""
  });
  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsData, productsData] = await Promise.all([getLots({
        search: search || undefined,
        productId: filterProductId || undefined
      }), getProductsWithTracking()]);
      setLots(lotsData);
      setProducts(productsData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  useEffect(() => {
    loadData();
  }, [search, filterProductId]);
  const handleCreate = async () => {
    if (!newLot.name || !newLot.productId) {
      toast.warning("يرجى ملء اسم اللوت واختيار المنتج");
      return;
    }
    try {
      await createLot(newLot);
      setNewLot({
        name: "",
        productId: "",
        ref: "",
        expirationDate: "",
        note: ""
      });
      setShowCreate(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء الإنشاء");
    }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف اللوت "${name}"؟`)) return;
    try {
      await deleteLot(id);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء الحذف");
    }
  };
  return <div className="p-4" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors">
          {" "}
          <Plus className="w-3.5 h-3.5" /> جديد{" "}
        </button>{" "}
      </TopPortal>{" "}
      <div className="space-y-6">
        {" "}
        {/* Filters */}{" "}
        <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-sm">
          {" "}
          <div className="flex gap-4 flex-wrap">
            {" "}
            <div className="flex-1 min-w-[200px] relative">
              {" "}
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />{" "}
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالرقم أو المرجع..." className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" />{" "}
            </div>{" "}
            <div className="min-w-[200px] relative">
              {" "}
              <select value={filterProductId} onChange={e => setFilterProductId(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none appearance-none bg-white">
                {" "}
                <option value="">كل المنتجات</option>{" "}
                {products.map((p: any) => <option key={p.value} value={p.value}>
                    {" "}
                    {p.label} ({p.tracking === "lot" ? "لوت" : "سيريال"}){" "}
                  </option>)}{" "}
              </select>{" "}
              <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Create Dialog */}{" "}
        {showCreate && <div className="bg-white rounded-sm border-2 border-teal-200 p-6 shadow-sm animate-in slide-in-">
            {" "}
            <div className="flex items-center justify-between mb-4">
              {" "}
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {" "}
                <Plus className="w-5 h-5 text-teal-600" /> إنشاء لوت / رقم
                تسلسلي جديد{" "}
              </h3>{" "}
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                {" "}
                <X className="w-5 h-5" />{" "}
              </button>{" "}
            </div>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {" "}
              <div>
                {" "}
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  رقم اللوت / السيريال <span className="text-red-500">*</span>
                </label>{" "}
                <input value={newLot.name} onChange={e => setNewLot({
              ...newLot,
              name: e.target.value
            })} placeholder="مثال: LOT-2026-001" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  المنتج <span className="text-red-500">*</span>
                </label>{" "}
                <select value={newLot.productId} onChange={e => setNewLot({
              ...newLot,
              productId: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                  {" "}
                  <option value="">اختر منتج...</option>{" "}
                  {products.map((p: any) => <option key={p.value} value={p.value}>
                      {p.label}
                    </option>)}{" "}
                </select>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  المرجع الداخلي
                </label>{" "}
                <input value={newLot.ref} onChange={e => setNewLot({
              ...newLot,
              ref: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  تاريخ الانتهاء
                </label>{" "}
                <input type="date" value={newLot.expirationDate} onChange={e => setNewLot({
              ...newLot,
              expirationDate: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />{" "}
              </div>{" "}
              <div className="md:col-span-2">
                {" "}
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  ملاحظات
                </label>{" "}
                <textarea value={newLot.note} onChange={e => setNewLot({
              ...newLot,
              note: e.target.value
            })} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" />{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex gap-2 mt-4 justify-end">
              {" "}
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                {" "}
                إلغاء{" "}
              </button>{" "}
              <button onClick={handleCreate} className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                {" "}
                حفظ{" "}
              </button>{" "}
            </div>{" "}
          </div>}{" "}
        {/* Table */}{" "}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          {" "}
          {loading ? <div className="p-12 text-center text-slate-400">
              {" "}
              <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />{" "}
              جاري التحميل...{" "}
            </div> : lots.length === 0 ? <div className="p-12 text-center">
              {" "}
              <Hash className="w-12 h-12 text-slate-300 mx-auto mb-3" />{" "}
              <p className="text-slate-500 font-medium">
                لا توجد لوتات/أرقام تسلسلية
              </p>{" "}
              <p className="text-slate-400 text-sm mt-1">
                أنشئ لوت جديد أو فعّل التتبع على منتج من تاب المخزون
              </p>{" "}
            </div> : <table className="w-full text-sm">
              {" "}
              <thead>
                {" "}
                <tr className="bg-slate-50 border-b border-slate-200">
                  {" "}
                  <th className="text-right px-4 py-3 font-bold text-slate-600">
                    رقم اللوت/السيريال
                  </th>{" "}
                  <th className="text-right px-4 py-3 font-bold text-slate-600">
                    المنتج
                  </th>{" "}
                  <th className="text-right px-4 py-3 font-bold text-slate-600">
                    المرجع
                  </th>{" "}
                  <th className="text-center px-4 py-3 font-bold text-slate-600">
                    الكمية المتوفرة
                  </th>{" "}
                  <th className="text-right px-4 py-3 font-bold text-slate-600">
                    تاريخ الانتهاء
                  </th>{" "}
                  <th className="text-right px-4 py-3 font-bold text-slate-600">
                    المواقع
                  </th>{" "}
                  <th className="text-center px-4 py-3 font-bold text-slate-600">
                    إجراءات
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-slate-100">
                {" "}
                {lots.map((lot: any) => <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                    {" "}
                    <td className="px-4 py-3">
                      {" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <div className="w-8 h-8 bg-lime-100 rounded-lg flex items-center justify-center">
                          {" "}
                          <Hash className="w-4 h-4 text-lime-600" />{" "}
                        </div>{" "}
                        <span className="font-bold text-slate-800">
                          {lot.name}
                        </span>{" "}
                      </div>{" "}
                    </td>{" "}
                    <td className="px-4 py-3">
                      {" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <Package className="w-4 h-4 text-slate-400" />{" "}
                        <span className="text-slate-700">
                          {lot.productName}
                        </span>{" "}
                      </div>{" "}
                    </td>{" "}
                    <td className="px-4 py-3 text-slate-500">
                      {lot.ref || "—"}
                    </td>{" "}
                    <td className="px-4 py-3 text-center">
                      {" "}
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${lot.totalQuantity > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {" "}
                        {lot.totalQuantity}{" "}
                      </span>{" "}
                    </td>{" "}
                    <td className="px-4 py-3 text-slate-500">
                      {" "}
                      {lot.expirationDate ? <div className="flex items-center gap-1">
                          {" "}
                          <Calendar className="w-3 h-3" />{" "}
                          {new Date(lot.expirationDate).toLocaleDateString("en-CA")}{" "}
                        </div> : "—"}{" "}
                    </td>{" "}
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {" "}
                      {lot.locations?.length > 0 ? lot.locations.map((l: any, i: number) => <span key={i} className="inline-block bg-slate-100 px-2 py-0.5 rounded mr-1 mb-1">
                              {" "}
                              {l.locationName}: {l.quantity}{" "}
                            </span>) : "—"}{" "}
                    </td>{" "}
                    <td className="px-4 py-3 text-center">
                      {" "}
                      <button onClick={() => handleDelete(lot.id, lot.name)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="حذف">
                        {" "}
                        <Trash2 className="w-4 h-4" />{" "}
                      </button>{" "}
                    </td>{" "}
                  </tr>)}{" "}
              </tbody>{" "}
            </table>}{" "}
        </div>{" "}
        {/* Stats */}{" "}
        {lots.length > 0 && <div className="grid grid-cols-3 gap-4">
            {" "}
            <div className="bg-white rounded-sm border border-slate-200 p-4 text-center shadow-sm">
              {" "}
              <p className="text-2xl font-bold text-slate-800">
                {lots.length}
              </p>{" "}
              <p className="text-xs text-slate-500 mt-1">إجمالي اللوتات</p>{" "}
            </div>{" "}
            <div className="bg-white rounded-sm border border-slate-200 p-4 text-center shadow-sm">
              {" "}
              <p className="text-2xl font-bold text-green-600">
                {lots.filter((l: any) => l.totalQuantity > 0).length}
              </p>{" "}
              <p className="text-xs text-slate-500 mt-1">لوتات بمخزون</p>{" "}
            </div>{" "}
            <div className="bg-white rounded-sm border border-slate-200 p-4 text-center shadow-sm">
              {" "}
              <p className="text-2xl font-bold text-slate-400">
                {lots.filter((l: any) => l.totalQuantity === 0).length}
              </p>{" "}
              <p className="text-xs text-slate-500 mt-1">لوتات فارغة</p>{" "}
            </div>{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}