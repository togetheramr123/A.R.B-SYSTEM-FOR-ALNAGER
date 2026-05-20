"use client";

import { StatusBar } from "@/components/common/StatusBar";
import { useTransition } from "react";
import { setToDraftPurchaseOrder } from "@/app/actions/purchases";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
interface PurchaseStatusBarProps {
  orderId: string;
  steps: {
    value: string;
    label: string;
  }[];
  currentStatus: string;
}
export function PurchaseStatusBar({
  orderId,
  steps,
  currentStatus
}: PurchaseStatusBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const handleStatusClick = (status: string) => {
    if (status === "draft" && currentStatus === "cancel") {
      // Removed native confirm() to prevent browser blocking
      startTransition(async () => {
        try {
          await setToDraftPurchaseOrder(orderId);
          router.refresh();
        } catch (e: any) {
          toast.error("خطأ أثناء إعادة التعيين: " + e.message);
        }
      });
    }
  };
  /* The generic StatusBar uses 'key' instead of 'value' */
  const formattedSteps = steps.map(s => ({
    key: s.value,
    label: s.label
  }));
  return <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
      {" "}
      <StatusBar steps={formattedSteps} currentStatus={currentStatus} onStatusClick={currentStatus === "cancel" ? handleStatusClick : undefined} />{" "}
    </div>;
}