"use client";
import React from "react";

import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";

type Props = {
  locale: string;
  currentFilter: string;
  currentJournal: string;
};

export function JournalItemsFilterDropdown({ locale, currentFilter, currentJournal }: Props) {
  const router = useRouter();

  // We combine the filter and journal into a single value string for the select options
  // For example: "all", "filter_posted", "filter_draft", "journal_sale", etc.
  let currentValue = "all";
  if (currentFilter === "posted") currentValue = "filter_posted";
  if (currentFilter === "draft") currentValue = "filter_draft";
  if (currentJournal) currentValue = `journal_${currentJournal}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "all") {
      router.push(`/${locale}/accounting/journal-items`);
    } else if (val.startsWith("filter_")) {
      const state = val.replace("filter_", "");
      router.push(`/${locale}/accounting/journal-items?filter=${state}`);
    } else if (val.startsWith("journal_")) {
      const jType = val.replace("journal_", "");
      router.push(`/${locale}/accounting/journal-items?journal=${jType}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-400" />
      <select
        value={currentValue}
        onChange={handleChange}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#017E84] focus:border-transparent text-gray-600 bg-white min-w-[150px] shadow-sm font-medium"
      >
        <option value="all">الكل</option>
        <optgroup label="الحالة">
          <option value="filter_posted">تم الترحيل</option>
          <option value="filter_draft">مسودة</option>
        </optgroup>
        <optgroup label="دفتر اليومية">
          <option value="journal_sale">مبيعات</option>
          <option value="journal_purchase">مشتريات</option>
          <option value="journal_bank">بنك</option>
          <option value="journal_cash">نقدية</option>
          <option value="journal_general">منوعات</option>
        </optgroup>
      </select>
    </div>
  );
}
