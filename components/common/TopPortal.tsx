"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
interface PortalProps {
  children: ReactNode;
  elementId?: string;
}
export function TopPortal({
  children,
  elementId = "top-actions-portal"
}: PortalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  const targetElement = document.getElementById(elementId);
  if (!targetElement) return null;
  return createPortal(children, targetElement);
}