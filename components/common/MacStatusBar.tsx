"use client";

import { useStatusStore } from "@/store/statusStore";
import { CloudUpload, Undo2, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
export function MacStatusBar() {
  const { isSaving, hasUnsavedChanges, saveTriggerFn, discardTriggerFn } =
    useStatusStore();
  const [savedJustNow, setSavedJustNow] = useState(false);
  const [portalNode, setPortalNode] = useState<Element | null>(null);
  const prevIsSaving = useRef(isSaving);
  useEffect(() => {
    setPortalNode(document.getElementById("mac-status-bar-portal"));
  }, []);

  useEffect(() => {
    if (
      prevIsSaving.current === true &&
      isSaving === false &&
      !hasUnsavedChanges
    ) {
      setSavedJustNow(true);
      const timer = setTimeout(() => setSavedJustNow(false), 2000);
      return () => clearTimeout(timer);
    }
    prevIsSaving.current = isSaving;
  }, [isSaving, hasUnsavedChanges]);
  if (!hasUnsavedChanges && !isSaving && !savedJustNow) {
    return null;
  }
  const content = (
    <div
      className="flex items-center gap-1 transition-all duration-300"
      dir="rtl"
    >
      {" "}
      <button
        onClick={saveTriggerFn || undefined}
        disabled={isSaving || (!hasUnsavedChanges && !savedJustNow)}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded hover:bg-slate-200 transition-colors cursor-pointer",
          isSaving
            ? "text-slate-400 cursor-not-allowed"
            : savedJustNow
              ? "text-teal-700"
              : hasUnsavedChanges
                ? "text-slate-600 hover:text-slate-900"
                : "text-slate-400",
        )}
        title={
          isSaving
            ? "جاري الحفظ..."
            : hasUnsavedChanges
              ? "حفظ يدوياً"
              : "تم الحفظ"
        }
      >
        {" "}
        {isSaving ? (
          <Loader2
            className="w-[18px] h-[18px] animate-spin"
            strokeWidth={2.5}
          />
        ) : savedJustNow ? (
          <Check className="w-[18px] h-[18px]" strokeWidth={3} />
        ) : hasUnsavedChanges ? (
          <CloudUpload className="w-[18px] h-[18px]" strokeWidth={2.5} />
        ) : (
          <CloudUpload
            className="w-[18px] h-[18px] opacity-50"
            strokeWidth={2.5}
          />
        )}{" "}
      </button>{" "}
      {discardTriggerFn && hasUnsavedChanges && !isSaving && (
        <button
          onClick={discardTriggerFn}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-slate-200 transition-colors cursor-pointer text-slate-500 hover:text-slate-900"
          title="تجاهل التغييرات"
        >
          {" "}
          <Undo2 className="w-[18px] h-[18px]" strokeWidth={2.5} />{" "}
        </button>
      )}{" "}
    </div>
  );
  if (portalNode) {
    return createPortal(content, portalNode);
  }
  return null;
}
