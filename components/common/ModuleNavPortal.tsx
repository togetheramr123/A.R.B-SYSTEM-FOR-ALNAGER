"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
export function ModuleNavPortal({
  children
}: {
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  const el = document.getElementById("module-nav-portal");
  if (!el) return null;
  return createPortal(children, el);
}