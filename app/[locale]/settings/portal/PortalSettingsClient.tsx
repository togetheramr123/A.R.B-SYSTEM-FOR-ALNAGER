"use client";
import React from "react";

import { useState } from "react";
import { createAdminBanner, updateAdminBanner, deleteAdminBanner } from "@/app/actions/portalSettings";
import { Plus, Trash2, Edit2, Loader2, GripVertical, Image as ImageIcon } from "lucide-react";
export default function PortalSettingsClient({
  initialBanners
}: {
  initialBanners: any[];
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* Form states */
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const openModal = (banner?: any) => {
    if (banner) {
      setEditingBanner(banner);
      setTitle(banner.title || "");
      setImageUrl(banner.imageUrl || "");
      setLinkUrl(banner.linkUrl || "");
      setSortOrder(banner.sortOrder || 0);
    } else {
      setEditingBanner(null);
      setTitle("");
      setImageUrl("");
      setLinkUrl("");
      setSortOrder(banners.length * 10);
    }
    setIsModalOpen(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = {
      title,
      imageUrl,
      linkUrl,
      sortOrder
    };
    let res;
    if (editingBanner) {
      res = await updateAdminBanner(editingBanner.id, data);
    } else {
      res = await createAdminBanner(data);
    }
    setIsSubmitting(false);
    if (res.success) {
      window.location.reload(); /* Simple reload to get updated list */
    } else {
      alert(res.error || "حدث خطأ");
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا البنر؟")) return;
    const res = await deleteAdminBanner(id);
    if (res.success) {
      setBanners(banners.filter(b => b.id !== id));
    } else {
      alert(res.error || "حدث خطأ");
    }
  };
  const toggleActive = async (banner: any) => {
    const res = await updateAdminBanner(banner.id, {
      active: !banner.active
    });
    if (res.success) {
      setBanners(banners.map(b => b.id === banner.id ? {
        ...b,
        active: !banner.active
      } : b));
    }
  };
  return <div className="bg-white rounded-sm shadow-sm border border-gray-200">
      {" "}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {" "}
        <h2 className="font-bold text-gray-800">البنرات الإعلانية</h2>{" "}
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-[#714B67] text-white text-sm font-bold rounded-lg hover:bg-[#5e3e55] transition-colors">
          {" "}
          <Plus className="w-4 h-4" /> إضافة بنر جديد{" "}
        </button>{" "}
      </div>{" "}
      <div className="p-4">
        {" "}
        {banners.length > 0 ? <div className="space-y-3">
            {" "}
            {banners.map((banner, index) => <div key={banner.id} className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-sm hover:bg-gray-100 transition-colors">
                {" "}
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />{" "}
                <div className="w-32 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center border border-gray-300">
                  {" "}
                  {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}{" "}
                </div>{" "}
                <div className="flex-1">
                  {" "}
                  <h3 className="font-bold text-gray-800 text-sm">
                    {banner.title || "(بدون عنوان)"}
                  </h3>{" "}
                  <p className="text-xs text-gray-500 truncate max-w-xs">
                    {banner.linkUrl || "بدون رابط تصفح"}
                  </p>{" "}
                </div>{" "}
                <div className="flex items-center gap-3">
                  {" "}
                  <label className="flex items-center gap-2 cursor-pointer">
                    {" "}
                    <span className="text-xs text-gray-600 font-bold">
                      {banner.active ? "مفعل" : "معطل"}
                    </span>{" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={banner.active} onChange={() => toggleActive(banner)} className="w-4 h-4 text-[#714B67] rounded focus:ring-[#714B67]" />{" "}
                  </label>{" "}
                  <div className="w-px h-6 bg-gray-300 mx-2"></div>{" "}
                  <button onClick={() => openModal(banner)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="تعديل">
                    {" "}
                    <Edit2 className="w-4 h-4" />{" "}
                  </button>{" "}
                  <button onClick={() => handleDelete(banner.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="حذف">
                    {" "}
                    <Trash2 className="w-4 h-4" />{" "}
                  </button>{" "}
                </div>{" "}
              </div>)}{" "}
          </div> : <div className="text-center py-12">
            {" "}
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />{" "}
            <p className="text-gray-500 text-sm">
              لا توجد بنرات إعلانية مضافة بعد.
            </p>{" "}
          </div>}{" "}
      </div>{" "}
      {/* Modal */}{" "}
      {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          {" "}
          <div className="bg-white rounded-sm shadow-sm w-full max-w-md overflow-hidden">
            {" "}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              {" "}
              <h3 className="text-lg font-bold text-gray-900">
                {editingBanner ? "تعديل بنر" : "إضافة بنر"}
              </h3>{" "}
            </div>{" "}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عنوان البنر (اختياري)
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#714B67] outline-none" value={title} onChange={e => setTitle(e.target.value)} />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رابط الصورة (URL) <span className="text-red-500">*</span>
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" required placeholder="https://example.com/banner.jpg" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#714B67] outline-none" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />{" "}
                {imageUrl && <div className="mt-2 w-full h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    {" "}
                    <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain" onError={e => e.currentTarget.style.display = "none"} />{" "}
                  </div>}{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رابط توجيه عند الضغط (اختياري)
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" placeholder="/portal/products?categoryId=123" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#714B67] outline-none" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الترتيب
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#714B67] outline-none" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />{" "}
              </div>{" "}
              <div className="pt-4 flex gap-3">
                {" "}
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200">
                  {" "}
                  إلغاء{" "}
                </button>{" "}
                <button type="submit" disabled={isSubmitting || !imageUrl} className="flex-1 px-4 py-2 bg-[#714B67] text-white text-sm font-bold rounded-lg hover:bg-[#5e3e55] disabled:opacity-50 flex items-center justify-center gap-2">
                  {" "}
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                  حفظ البنر{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}