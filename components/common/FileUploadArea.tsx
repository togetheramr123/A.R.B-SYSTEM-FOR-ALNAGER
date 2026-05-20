"use client";
import React from "react";

import { useState } from "react";
import { Paperclip, X, FileText, Image as ImageIcon, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
export function FileUploadArea() {
  const t = useTranslations("Common");
  const [files, setFiles] = useState<{
    name: string;
    size: string;
    type: string;
  }[]>([]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: (f.size / 1024).toFixed(1) + " KB",
        type: f.type
      }));
      setFiles([...files, ...newFiles]);
    }
  };
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  return <div className="space-y-4">
      {" "}
      <div className="flex items-center justify-between">
        {" "}
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          {" "}
          <Paperclip className="w-4 h-4 text-blue-500" />{" "}
          {t("attachments")}{" "}
        </h3>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {" "}
        {files.map((file, i) => <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-sm group relative">
            {" "}
            {file.type.startsWith("image") ? <ImageIcon className="w-8 h-8 text-blue-400" /> : <FileText className="w-8 h-8 text-slate-400" />}{" "}
            <div className="overflow-hidden">
              {" "}
              <p className="text-xs font-bold text-slate-700 truncate">
                {file.name}
              </p>{" "}
              <p className="text-[10px] text-slate-400">{file.size}</p>{" "}
            </div>{" "}
            <button onClick={() => removeFile(i)} className="absolute -top-2 -left-2 bg-white shadow-md border border-slate-100 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {" "}
              <X className="w-3 h-3" />{" "}
            </button>{" "}
          </div>)}{" "}
        <label className="border-2 border-dashed border-slate-200 rounded-sm p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all min-h-[80px]">
          {" "}
          <UploadCloud className="w-6 h-6 text-slate-300" />{" "}
          <span className="text-[10px] font-bold text-slate-500">
            {t("uploadFile")}
          </span>{" "}
          <input type="file" multiple className="hidden" onChange={handleFileChange} />{" "}
        </label>{" "}
      </div>{" "}
    </div>;
}