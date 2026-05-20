"use client";
import React from "react";

import { useState } from "react";
import { respondToStatementRequest } from "@/app/actions/portalAccount";
import { Clock, CheckCircle2, FileUp, X, Loader2, UploadCloud, Search } from "lucide-react";
type RequestRecord = {
  id: string;
  status: string;
  notes: string | null;
  responseNote: string | null;
  responseFile: string | null;
  createdAt: Date;
  partner: {
    name: string;
    phone: string | null;
  };
};
export default function StatementRequestsClient({
  initialRequests
}: {
  initialRequests: any[];
}) {
  const [requests, setRequests] = useState<RequestRecord[]>(initialRequests);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequestRecord | null>(null);
  const [responseNote, setResponseNote] = useState("");
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const openModal = (req: RequestRecord) => {
    setSelectedReq(req);
    setResponseNote("");
    setFileBase64(null);
    setFileName("");
    setIsModalOpen(true);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("يرجى اختيار ملف PDF فقط");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !fileBase64) {
      alert("الرجاء إرفاق ملف PDF");
      return;
    }
    setIsSubmitting(true);
    const res = await respondToStatementRequest(selectedReq.id, fileBase64, responseNote);
    setIsSubmitting(false);
    if (res.success) {
      alert("تم إرسال كشف الحساب بنجاح");
      setRequests(requests.map(r => r.id === selectedReq.id ? {
        ...r,
        status: "completed",
        responseFile: fileBase64,
        responseNote
      } : r));
      setIsModalOpen(false);
    } else {
      alert(res.error || "حدث خطأ");
    }
  };
  const filteredRequests = requests.filter(r => r.partner.name.toLowerCase().includes(search.toLowerCase()) || r.partner.phone && r.partner.phone.includes(search));
  return <div className="bg-white rounded-sm shadow-sm border border-gray-200">
      {" "}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {" "}
        <div className="relative w-72">
          {" "}
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />{" "}
          <input type="text" placeholder="بحث باسم التاجر أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-3 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent" />{" "}
        </div>{" "}
      </div>{" "}
      <div className="overflow-x-auto">
        {" "}
        <table className="w-full text-sm text-right">
          {" "}
          <thead className="bg-gray-50 text-gray-600 font-medium">
            {" "}
            <tr>
              {" "}
              <th className="px-6 py-3">التاجر</th>{" "}
              <th className="px-6 py-3">التاريخ</th>{" "}
              <th className="px-6 py-3">ملاحظة التاجر</th>{" "}
              <th className="px-6 py-3">الحالة</th>{" "}
              <th className="px-6 py-3 text-left">الإجراء</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-gray-100">
            {" "}
            {filteredRequests.length > 0 ? filteredRequests.map(req => <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  {" "}
                  <td className="px-6 py-4">
                    {" "}
                    <div className="font-bold text-gray-900">
                      {req.partner.name}
                    </div>{" "}
                    <div className="text-xs text-gray-500">
                      {req.partner.phone || "بدون رقم"}
                    </div>{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-600">
                    {" "}
                    {new Date(req.createdAt).toLocaleDateString("ar-EG")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {" "}
                    {req.notes || "-"}{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    {req.status === "pending" ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {" "}
                        <Clock className="w-3 h-3" /> قيد الانتظار{" "}
                      </span> : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-emerald-800">
                        {" "}
                        <CheckCircle2 className="w-3 h-3" /> مكتمل{" "}
                      </span>}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-left">
                    {" "}
                    {req.status === "pending" ? <button onClick={() => openModal(req)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#714B67] hover:bg-[#5e3e55] text-white text-xs font-bold rounded shadow-sm transition-colors">
                        {" "}
                        <FileUp className="w-4 h-4" /> رد وإرفاق{" "}
                      </button> : <a href={req.responseFile!} download={`statement_${req.partner.name}.pdf`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded shadow-sm transition-colors">
                        {" "}
                        <CheckCircle2 className="w-4 h-4 text-teal-700" /> تم
                        الإرسال{" "}
                      </a>}{" "}
                  </td>{" "}
                </tr>) : <tr>
                {" "}
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {" "}
                  لا يوجد طلبات تطابق بحثك.{" "}
                </td>{" "}
              </tr>}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
      {/* Modal */}{" "}
      {isModalOpen && selectedReq && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          {" "}
          <div className="bg-white rounded-sm shadow-sm w-full max-w-md overflow-hidden">
            {" "}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              {" "}
              <h3 className="text-lg font-bold text-gray-900">
                الرد على طلب كشف الحساب
              </h3>{" "}
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                {" "}
                <X className="w-5 h-5" />{" "}
              </button>{" "}
            </div>{" "}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {" "}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm mb-4">
                {" "}
                <p>
                  <span className="font-bold text-blue-900">التاجر:</span>{" "}
                  {selectedReq.partner.name}
                </p>{" "}
                {selectedReq.notes && <p className="mt-1">
                    <span className="font-bold text-blue-900">ملاحظته:</span>{" "}
                    {selectedReq.notes}
                  </p>}{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  إرفاق ملف الكشف (PDF) <span className="text-red-500">*</span>
                </label>{" "}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  {" "}
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {" "}
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />{" "}
                    {fileName ? <p className="text-sm font-bold text-teal-700">
                        {fileName}
                      </p> : <p className="text-sm text-gray-500">اضغط لرفع ملف PDF</p>}{" "}
                  </div>{" "}
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />{" "}
                </label>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رسالة / رد نصي (اختياري)
                </label>{" "}
                <textarea className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#714B67] focus:border-transparent outline-none" rows={3} placeholder="أكتب أي ملاحظات للتاجر بخصوص الرصيد..." value={responseNote} onChange={e => setResponseNote(e.target.value)}></textarea>{" "}
              </div>{" "}
              <div className="pt-2 flex gap-3">
                {" "}
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  {" "}
                  إلغاء{" "}
                </button>{" "}
                <button type="submit" disabled={isSubmitting || !fileBase64} className="flex-1 px-4 py-2 bg-[#714B67] text-white text-sm font-bold rounded-lg hover:bg-[#5e3e55] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {" "}
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                  إرسال الكشف{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}