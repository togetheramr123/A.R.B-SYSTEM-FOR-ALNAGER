import { getTranslations } from "next-intl/server";
import ImportClient from "./ImportClient";

import ImportTabs from "./ImportTabs";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Settings" });
  return {
    title: t("import_data") || "استيراد البيانات",
  };
}

export default function ImportPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">استيراد البيانات الأساسية</h1>
        <p className="text-slate-500">
          يمكنك من خلال هذه الشاشة استيراد البيانات التاريخية والأرصدة الافتتاحية لتهيئة النظام الجديد.
        </p>
      </div>

      <ImportTabs />
    </div>
  );
}
