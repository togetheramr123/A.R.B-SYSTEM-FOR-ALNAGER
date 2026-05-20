"use client";

import OdooListView from "@/components/common/OdooListView";
import { toast } from "sonner";
export default function WarehousesPage() {
  const columns = [{
    key: "name",
    label: "المستودع",
    width: "w-1/3"
  }, {
    key: "shortName",
    label: "الاسم المختصر",
    width: "w-1/4"
  }, {
    key: "address",
    label: "العنوان"
  }];
  const data = [{
    id: "1",
    name: "مخزن العبور",
    shortName: "WH",
    address: "Cairo, Egypt"
  }, {
    id: "2",
    name: "مخزن الإسكندرية",
    shortName: "ALEX",
    address: "Alexandria, Egypt"
  }];
  return <OdooListView title="المستودعات" columns={columns} data={data} />;
}