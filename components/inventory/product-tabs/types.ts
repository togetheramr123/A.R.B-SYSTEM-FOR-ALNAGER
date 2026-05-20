export interface ProductFormValues {
  name: string;
  can_sell: boolean;
  can_purchase: boolean;
  detailedType: string;
  invoicingPolicy: string;
  price: number;
  cost: number;
  tax_customer: number;
  tax_vendor: number;
  category: string;
  ref: string;
  barcode: string;
  manufacturer: string;
  description: string;
  descriptionSale: string;
  uom: string;
  purchaseUom: string;
  hasSecondaryUnit: boolean;
  secondaryUom: string;
  secondaryUomFactor: string | number;
  tracking: string;
  routeBuy: boolean;
  routeMto: boolean;
  weight: number;
  volume: number;
  descriptionPicking: string;
  descriptionPickingout: string;
  descriptionInternal: string;
  availableInPos: boolean;
  websitePublished: boolean;
  controlPolicy: string;
  descriptionPurchase: string;
  costMethod: string;
  propertyAccountIncomeId: string;
  propertyAccountExpenseId: string;
  assetType: string;
  priceDifferenceAccount: string;
}

export interface Option {
  value: string;
  label: string;
  color?: string;
}

export interface SupplierLine {
  id: string;
  partnerId: string;
  price: number;
  minQty: number;
  delay: number;
  productCode: string;
}

export interface BomLine {
  id: string;
  componentId: string;
  componentName?: string;
  quantity: number;
  uom: string;
  cost?: number;
}

export interface AttributeState {
  id: string;
  attributeId: string;
  values: { id: string; valueId: string; extraPrice: number }[];
}

export interface Metrics {
  sold: number;
  purchased: number;
  onHand: number;
  forecasted: number;
  incoming: number;
  outgoing: number;
  variantsCount: number;
  journalItemsCount: number;
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;
  supplierCount: number;
}
