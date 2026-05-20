"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
const Sheet = ({
  children
}: {
  children: React.ReactNode;
}) => <div className="fixed inset-0 z-50 flex pointer-events-none">
    {" "}
    <div className="pointer-events-auto h-full w-full max-w-4xl ml-auto bg-white shadow-sm flex flex-col transition-transform animate-in slide-in-from-right duration-300">
      {" "}
      {children}{" "}
    </div>{" "}
  </div>;
const SheetHeader = ({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={cn("px-6 py-4 border-b", className)}>{children}</div>;
const SheetTitle = ({
  children
}: {
  children: React.ReactNode;
}) => <h2 className="text-xl font-bold">{children}</h2>;
const SheetDescription = ({
  children
}: {
  children: React.ReactNode;
}) => <p className="text-sm text-muted-foreground">{children}</p>;
const SheetBody = ({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={cn("flex-1 overflow-y-auto p-6", className)}>{children}</div>;
const SheetFooter = ({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={cn("px-6 py-4 border-t flex items-center justify-end gap-2", className)}>
    {children}
  </div>;
const SheetContent = ({
  children
}: {
  children: React.ReactNode;
}) => <div className="h-full flex flex-col">{children}</div>;
export { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetContent };