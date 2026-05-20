"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
const Dialog = ({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  React.useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {" "}
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />{" "}
      <div className="relative bg-white rounded-sm shadow-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {" "}
        {children}{" "}
      </div>{" "}
    </div>;
};
const DialogHeader = ({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={cn("px-6 py-4 border-b", className)}>{children}</div>;
const DialogTitle = ({
  children
}: {
  children: React.ReactNode;
}) => <h2 className="text-xl font-bold">{children}</h2>;
const DialogContent = ({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={cn("p-6", className)}>{children}</div>;
const DialogFooter = ({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={cn("px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2", className)}>
    {children}
  </div>;
const DialogDescription = ({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) => <p className={cn("text-sm text-slate-500", className)}>{children}</p>;
export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogDescription };