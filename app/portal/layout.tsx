import React from "react";
import type { Metadata } from "next";
import "../globals.css";
export const metadata: Metadata = {
  title: "بوابة التجّار",
  description: "تصفح المنتجات وأرسل طلباتك بسهولة",
  manifest: "/manifest.json",
  themeColor: "#10b981",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "بوابة التجّار"
  }
};
export default function PortalRootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <html lang="ar" dir="rtl">
      {" "}
      <body className="bg-slate-50 text-slate-900 font-sans antialiased font-arabic">
        {" "}
        {children}{" "}
      </body>{" "}
    </html>;
}