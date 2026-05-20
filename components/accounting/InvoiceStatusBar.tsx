"use client";

import { StatusBar } from "@/components/common/StatusBar";
import { useTransition } from "react";
import { resetToDraftInvoice } from "@/app/actions/accounting";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
interface InvoiceStatusBarProps {
  invoiceId: string;
  steps: {
    key: string;
    label: string;
  }[];
  currentStatus: string;
}
export function InvoiceStatusBar({
  invoiceId,
  steps,
  currentStatus
}: InvoiceStatusBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const handleStatusClick = (status: string) => {
    if (status === "draft" && currentStatus === "cancel") {
      // Removed native confirm() to prevent browser blocking
      startTransition(async () => {
        try {
          await resetToDraftInvoice(invoiceId);
          router.refresh();
        } catch (e: any) {
          toast.error("خطأ أثناء إعادة التعيين: " + e.message);
        }
      });
    }
  };
  return <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
      {" "}
      <StatusBar steps={steps} currentStatus={currentStatus} onStatusClick={currentStatus === "cancel" ? handleStatusClick : undefined} />{" "}
    </div>;
}