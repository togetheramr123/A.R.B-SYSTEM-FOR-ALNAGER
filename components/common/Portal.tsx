"use client";
import React from "react";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
export const Portal = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (typeof document === "undefined") return null;
  return mounted ? createPortal(children, document.body) : null;
};