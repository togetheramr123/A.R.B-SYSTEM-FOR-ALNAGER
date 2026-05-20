"use client";

import React from "react";
import { Truck, Receipt, FileText, Package } from "lucide-react";
interface SmartButtonProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  onClick?: () => void;
}
const SmartButton: React.FC<SmartButtonProps> = ({
  icon: Icon,
  label,
  count,
  onClick
}) => <button onClick={onClick} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 hover:border-slate-300 transition-all min-w-[100px] shadow-sm group">
    {" "}
    <div className="flex items-center gap-2 mb-1">
      {" "}
      <span className="text-xl font-bold text-slate-800">
        {count ?? 0}
      </span>{" "}
      <Icon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />{" "}
    </div>{" "}
    <span className="text-xs text-slate-500 font-medium">{label}</span>{" "}
  </button>;
export const OdooSmartButtons: React.FC<{
  buttons: SmartButtonProps[];
}> = ({
  buttons
}) => {
  return <div className="flex flex-wrap gap-2 mb-6">
      {" "}
      {buttons.map((btn, idx) => <SmartButton key={idx} {...btn} />)}{" "}
    </div>;
};