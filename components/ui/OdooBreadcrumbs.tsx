"use client";

import Link from "next/link";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react"; /** * Stack-Based Breadcrumbs * Renders the breadcrumbs linearly from the Zustand store. * Allows popping the stack when clicking a previous path. */
export function OdooBreadcrumbs({
  locale
}: {
  locale: string;
}) {
  const {
    stack,
    popTo
  } = useBreadcrumbStore();
  const router = useRouter();
  const pathname = usePathname();
  if (stack.length === 0 || pathname?.includes("/dashboard")) return null;
  const handleNavigate = (id: string) => {
    popTo(id);
  };
  return (
    <nav className="flex items-center text-xl font-normal" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-0">
        {stack.map((item, index) => {
          const isLast = index === stack.length - 1;
          return (
            <li key={item.id} className="inline-flex items-center">
              {index > 0 && (
                <span className="text-slate-400 mx-2 font-normal opacity-70">/</span>
              )}
              {isLast ? (
                <span className="font-semibold text-slate-800 truncate max-w-[400px]" title={item.label}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} onClick={() => handleNavigate(item.id)} className="text-[#017E84] hover:text-[#015e63] transition-colors cursor-pointer whitespace-nowrap" title={item.label}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}