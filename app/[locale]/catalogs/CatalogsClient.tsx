"use client";

import { useState, useRef, useEffect } from "react";
import { uploadCatalog, deleteCatalog } from "@/app/actions/catalogs";
import { toast } from "sonner";
import { FileText, Upload, Trash2, Download, Search, Loader2, BookOpen, X, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
interface Catalog {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  filePath: string;
  fileSize: number;
  category: string;
  sortOrder: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
const CATEGORIES = [{
  value: "general",
  label: "عام",
  icon: "📁"
}, {
  value: "custom",
  label: "مخصص",
  icon: "🔒"
}];
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
export default function CatalogsClient({
  initialCatalogs
}: {
  initialCatalogs: Catalog[];
}) {
  const [catalogs, setCatalogs] = useState(initialCatalogs);
  useEffect(() => {
    setCatalogs(initialCatalogs);
  }, [initialCatalogs]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error("العنوان والملف مطلوبان");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    try {
      const result = await uploadCatalog(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم رفع الكتالوج بنجاح 📄");
        setShowUpload(false);
        setTitle("");
        setDescription("");
        setSelectedFile(null);
        if (result.catalog) {
          setCatalogs(prev => [{
            ...result.catalog,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, ...prev]);
        }
        router.refresh();
      }
    } catch (e: any) {
      toast.error(e.message || "فشل في رفع الملف");
    } finally {
      setUploading(false);
    }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف كتالوج "${name}"?`)) return;
    try {
      const result = await deleteCatalog(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setCatalogs(prev => prev.filter(c => c.id !== id));
        toast.success("تم حذف الكتالوج");
      }
    } catch (e: any) {
      toast.error(e.message || "فشل الحذف");
    }
  }; // Filter
  const filtered = catalogs.filter(c => {
    const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || c.category === selectedCategory;
    return matchSearch && matchCategory;
  });
  return <div className="flex flex-col h-full bg-[#F9FAFB]" dir="rtl">
      {" "}
      {/* Header */}{" "}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div>
            {" "}
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
              {" "}
              <BookOpen className="w-7 h-7 text-teal-600" /> الكتالوجات{" "}
            </h1>{" "}
            <p className="text-sm text-slate-500 mt-1">
              {" "}
              سجل الكتالوجات المرفوعة — {catalogs.length} ملف{" "}
            </p>{" "}
          </div>{" "}
          <button onClick={() => setShowUpload(true)} className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-all shadow-sm flex items-center gap-2">
            {" "}
            <Upload className="w-4 h-4" /> رفع كتالوج{" "}
          </button>{" "}
        </div>{" "}
        {/* Search & Filters */}{" "}
        <div className="flex items-center gap-3 mt-4">
          {" "}
          <div className="relative flex-1 max-w-md">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث عن كتالوج..." className="w-full pr-10 pl-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none" />{" "}
          </div>{" "}
          <div className="flex items-center gap-1.5">
            {" "}
            <button onClick={() => setSelectedCategory("all")} className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${selectedCategory === "all" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {" "}
              الكل{" "}
            </button>{" "}
            {CATEGORIES.map(cat => <button key={cat.value} onClick={() => setSelectedCategory(cat.value)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${selectedCategory === cat.value ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {" "}
                <span>{cat.icon}</span> {cat.label}{" "}
              </button>)}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Content */}{" "}
      <div className="flex-1 overflow-auto p-6">
        {" "}
        {filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            {" "}
            <FolderOpen className="w-16 h-16 mb-4 opacity-30" />{" "}
            <p className="text-lg font-bold">لا توجد كتالوجات بعد</p>{" "}
            <p className="text-sm mt-1">
              اضغط "رفع كتالوج" لإضافة ملف PDF
            </p>{" "}
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {" "}
            {filtered.map(catalog => <div key={catalog.id} className="bg-white rounded-sm border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                {" "}
                {/* Card Header - PDF Icon */}{" "}
                <div className="bg-[#714B67] p-6 flex items-center justify-center relative">
                  {" "}
                  <FileText className="w-14 h-14 text-white/90" />{" "}
                  <span className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {" "}
                    PDF{" "}
                  </span>{" "}
                  <span className="absolute bottom-2 left-2 text-white/70 text-[10px]">
                    {" "}
                    {formatFileSize(catalog.fileSize)}{" "}
                  </span>{" "}
                  {/* Category badge */}{" "}
                  <span className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {" "}
                    {CATEGORIES.find(c => c.value === catalog.category)?.icon}{" "}
                    {CATEGORIES.find(c => c.value === catalog.category)?.label || catalog.category}{" "}
                  </span>{" "}
                </div>{" "}
                {/* Card Body */}{" "}
                <div className="p-4">
                  {" "}
                  <h3 className="font-bold text-slate-800 text-sm truncate" title={catalog.title}>
                    {" "}
                    {catalog.title}{" "}
                  </h3>{" "}
                  {catalog.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {catalog.description}
                    </p>}{" "}
                  <p className="text-[10px] text-slate-400 mt-2">
                    {" "}
                    🕐 {formatDate(catalog.createdAt)}{" "}
                  </p>{" "}
                </div>{" "}
                {/* Card Footer */}{" "}
                <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                  {" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <a href={catalog.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors">
                      {" "}
                      <FileText className="w-3.5 h-3.5" /> عرض{" "}
                    </a>{" "}
                    <a href={catalog.filePath} download={catalog.fileName} className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-xs font-bold transition-colors">
                      {" "}
                      <Download className="w-3.5 h-3.5" /> تحميل{" "}
                    </a>{" "}
                  </div>{" "}
                  <button onClick={() => handleDelete(catalog.id, catalog.title)} className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-all">
                    {" "}
                    <Trash2 className="w-3.5 h-3.5" /> حذف{" "}
                  </button>{" "}
                </div>{" "}
              </div>)}{" "}
          </div>}{" "}
      </div>{" "}
      {/* ===== Upload Modal ===== */}{" "}
      {showUpload && <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          {" "}
          <div className="bg-white rounded-sm shadow-sm w-full max-w-lg overflow-hidden" dir="rtl">
            {" "}
            {/* Header */}{" "}
            <div className="bg-[#714B67] p-5 flex items-center justify-between">
              {" "}
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {" "}
                <Upload className="w-5 h-5" /> رفع كتالوج جديد{" "}
              </h3>{" "}
              <button onClick={() => setShowUpload(false)} className="text-white/70 hover:text-white">
                {" "}
                <X className="w-5 h-5" />{" "}
              </button>{" "}
            </div>{" "}
            {/* Form */}{" "}
            <div className="p-6 space-y-4">
              {" "}
              {/* Title */}{" "}
              <div>
                {" "}
                <label className="text-sm font-bold text-slate-700 mb-1 block">
                  عنوان الكتالوج *
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: كتالوج منتجات الصيف 2026" className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none" autoFocus />{" "}
              </div>{" "}
              {/* Description */}{" "}
              <div>
                {" "}
                <label className="text-sm font-bold text-slate-700 mb-1 block">
                  وصف (اختياري)
                </label>{" "}
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف مختصر للكتالوج..." rows={2} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none" />{" "}
              </div>{" "}
              {/* Category */}{" "}
              <div>
                {" "}
                <label className="text-sm font-bold text-slate-700 mb-1 block">
                  التصنيف
                </label>{" "}
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer bg-white">
                  {" "}
                  {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>)}{" "}
                </select>{" "}
              </div>{" "}
              {/* File */}{" "}
              <div>
                {" "}
                <label className="text-sm font-bold text-slate-700 mb-1 block">
                  ملف *
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />{" "}
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition-colors">
                  {" "}
                  {selectedFile ? <div className="flex items-center justify-center gap-3">
                      {" "}
                      <FileText className="w-8 h-8 text-red-500" />{" "}
                      <div className="text-right">
                        {" "}
                        <p className="text-sm font-bold text-slate-800">
                          {selectedFile.name}
                        </p>{" "}
                        <p className="text-xs text-slate-500">
                          {formatFileSize(selectedFile.size)}
                        </p>{" "}
                      </div>{" "}
                    </div> : <>
                      {" "}
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />{" "}
                      <p className="text-sm text-slate-500">
                        اضغط لاختيار ملف (PDF, Word, Excel, صور...)
                      </p>{" "}
                      <p className="text-xs text-slate-400 mt-1">
                        أو اسحب الملف هنا
                      </p>{" "}
                    </>}{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Footer */}{" "}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-end gap-3">
              {" "}
              <button onClick={handleUpload} disabled={uploading || !title.trim() || !selectedFile} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {" "}
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{" "}
                رفع الكتالوج{" "}
              </button>{" "}
              <button onClick={() => setShowUpload(false)} className="px-5 py-2.5 text-slate-600 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
                {" "}
                إلغاء{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}