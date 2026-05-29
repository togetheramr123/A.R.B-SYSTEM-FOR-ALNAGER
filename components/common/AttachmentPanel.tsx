'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, UploadCloud, Download, Loader2, File, Eye } from 'lucide-react';
import { toast } from 'sonner';

type AttachmentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
};

type AttachmentPanelProps = {
  model: 'purchaseOrder' | 'saleOrder' | 'invoice' | 'payment' | 'stockMove' | 'product';
  recordId: string | null | undefined;
  readOnly?: boolean;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileText className="w-5 h-5 text-green-600" />;
  if (type.includes('word') || type.includes('doc')) return <FileText className="w-5 h-5 text-blue-700" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

export function AttachmentPanel({ model, recordId, readOnly = false }: AttachmentPanelProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch attachments
  const fetchAttachments = useCallback(async () => {
    if (!recordId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/upload?model=${model}&recordId=${recordId}`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments || []);
      }
    } catch (e) {
      console.error('Failed to fetch attachments:', e);
    } finally {
      setIsLoading(false);
    }
  }, [model, recordId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Upload file(s)
  const uploadFiles = async (files: FileList | File[]) => {
    if (!recordId) {
      toast.error('يجب حفظ السجل أولاً قبل إرفاق ملفات');
      return;
    }

    setIsUploading(true);
    const fileArr = Array.from(files);
    let successCount = 0;

    for (const file of fileArr) {
      // 20MB max
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: الملف كبير جداً (الحد الأقصى 20 ميجا)`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', model);
      formData.append('recordId', recordId);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.attachment) {
            setAttachments(prev => [...prev, data.attachment]);
            successCount++;
          }
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(`فشل رفع ${file.name}: ${err.error || 'خطأ غير معروف'}`);
        }
      } catch (e) {
        toast.error(`فشل رفع ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`تم رفع ${successCount} ملف بنجاح`);
    }
    setIsUploading(false);
  };

  // Delete
  const deleteAttachment = async (id: string, fileName: string) => {
    if (!confirm(`هل تريد حذف "${fileName}"؟`)) return;

    try {
      const res = await fetch(`/api/upload/delete?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAttachments(prev => prev.filter(a => a.id !== id));
        toast.success('تم حذف المرفق');
      } else {
        toast.error('فشل حذف المرفق');
      }
    } catch (e) {
      toast.error('فشل حذف المرفق');
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (readOnly) return;
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = ''; // Reset
    }
  };

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-[#017E84]" />
          المرفقات
          {attachments.length > 0 && (
            <span className="bg-[#017E84]/10 text-[#017E84] text-[11px] font-bold px-2 py-0.5 rounded-full">
              {attachments.length}
            </span>
          )}
        </h3>
      </div>

      {/* Drop Zone + Files Grid */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-all ${
          dragOver 
            ? 'border-[#017E84] bg-teal-50/50' 
            : 'border-slate-200 hover:border-slate-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            <span className="text-sm">جاري التحميل...</span>
          </div>
        ) : (
          <>
            {/* File Grid */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="group relative bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md hover:border-[#017E84]/30 transition-all"
                  >
                    {/* Preview / Icon */}
                    <div className="flex items-center justify-center h-16 mb-2">
                      {att.fileType.startsWith('image/') ? (
                        <img
                          src={att.fileUrl}
                          alt={att.fileName}
                          className="max-h-16 max-w-full object-contain rounded cursor-pointer"
                          onClick={() => setPreview(att.fileUrl)}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center">
                          {getFileIcon(att.fileType)}
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    <p className="text-[11px] font-bold text-slate-700 truncate text-center" title={att.fileName}>
                      {att.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 text-center mt-0.5">
                      {formatSize(att.fileSize)}
                    </p>

                    {/* Actions overlay */}
                    <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={att.fileUrl}
                        download={att.fileName}
                        className="w-6 h-6 rounded-full bg-white shadow border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300"
                        title="تحميل"
                      >
                        <Download className="w-3 h-3 text-blue-600" />
                      </a>
                      {att.fileType.startsWith('image/') && (
                        <button
                          onClick={() => setPreview(att.fileUrl)}
                          className="w-6 h-6 rounded-full bg-white shadow border border-slate-200 flex items-center justify-center hover:bg-teal-50 hover:border-teal-300"
                          title="معاينة"
                        >
                          <Eye className="w-3 h-3 text-teal-600" />
                        </button>
                      )}
                    </div>

                    {/* Delete button */}
                    {!readOnly && (
                      <button
                        onClick={() => deleteAttachment(att.id, att.fileName)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                        title="حذف"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            {!readOnly && (
              <label className={`flex flex-col items-center justify-center gap-2 py-4 cursor-pointer rounded-lg transition-all ${
                isUploading ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50'
              }`}>
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-[#017E84] animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-slate-300" />
                )}
                <span className="text-xs font-bold text-slate-400">
                  {isUploading ? 'جاري الرفع...' : 'اسحب الملفات هنا أو اضغط للاختيار'}
                </span>
                <span className="text-[10px] text-slate-300">
                  PDF, صور, Excel, Word — الحد الأقصى 20 ميجا
                </span>
                <input autoComplete="off" autoCorrect="off" spellCheck={false}
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                />
              </label>
            )}

            {/* Empty state */}
            {attachments.length === 0 && readOnly && (
              <p className="text-center text-sm text-slate-400 py-4">
                لا توجد مرفقات
              </p>
            )}
          </>
        )}
      </div>

      {/* Image Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-8"
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
