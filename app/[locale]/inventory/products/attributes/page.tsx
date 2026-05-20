"use client";

import OdooListView from "@/components/common/OdooListView";
import { toast } from "sonner";
export default function ProductAttributesPage() {
  const columns = [{
    key: "name",
    label: "الخاصية",
    width: "w-1/3"
  }, {
    key: "displayType",
    label: "نوع العرض",
    width: "w-1/3"
  }, {
    key: "values",
    label: "القيم"
  }];
  const data = [{
    id: "1",
    name: "Color",
    displayType: "Color",
    values: "White, Black"
  }, {
    id: "2",
    name: "Size",
    displayType: "Select",
    values: "S, M, L, XL"
  }, {
    id: "3",
    name: "Material",
    displayType: "Radio",
    values: "Cotton, Polyester"
  }];
  return <OdooListView title="خصائص المنتجات" columns={columns} data={data} />;
}