"use client";

import React from "react";
import { useRouter } from "next/navigation";
interface SmartButtonProps {
  icon: React.ReactNode;
  count: number | string;
  label: string;
  href?: string;
  onClick?: () => void;
} /** * Odoo-style Smart Button * Displays a count + label with an icon * Can be a link or a button */
export default function OdooSmartButton({
  icon,
  count,
  label,
  href,
  onClick
}: SmartButtonProps) {
  const router = useRouter();

  const content = <>
      {" "}
      <div className="o_stat_icon">{icon}</div>{" "}
      <div className="flex flex-col items-center">
        {" "}
        <span className="o_stat_value">{count}</span>{" "}
        <span className="o_stat_text">{label}</span>{" "}
      </div>{" "}
    </>;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return <button type="button" className="oe_stat_button" onClick={handleClick}>
      {" "}
      {content}{" "}
    </button>;
}