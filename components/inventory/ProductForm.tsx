"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Save,
  Cloud,
  CloudUpload,
  RotateCcw,
  MoreHorizontal,
  StarIcon,
  Image as ImageIcon,
  Box,
  Activity,
  ArrowRight,
  Trash2,
  Copy,
  ChevronDown,
  ArrowRightLeft,
  RefreshCw,
  Shuffle,
  BarChart3,
  CreditCard,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  AlertCircle,
  Loader2,
  Undo2,
  ListFilter,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useSearchParams, useParams, usePathname } from "next/navigation";
import { OdooCombobox, Option } from "@/components/ui/OdooCombobox";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { useBreadcrumbsStore } from "@/store/breadcrumbsStore";
import { useStatusStore } from "@/store/statusStore";
import { toast } from "sonner";
import { TopPortal } from "@/components/common/TopPortal";
import { createProduct, getProductCategories } from "@/app/actions/inventory";
import { getChartOfAccounts, createAccount } from "@/app/actions/accounting";
import { useRouter } from "next/navigation";
import {
  deleteProduct,
  archiveProduct,
  duplicateProduct,
  createCategory,
  getProductMetrics,
  createTag,
  getTags,
  getAttributes,
  createAttribute,
  createAttributeValue,
  updateProduct,
  getUoms,
  createUom,
  updateUom,
  deleteUom,
  getProductPagination,
  getPartners,
  getAdjacentProductIds,
  toggleFavorite,
  updateProductQuantity,
  updateCategory,
} from "@/app/actions/inventory";
import { Chatter } from "@/components/chatter/Chatter";
import { CategoryCreationDialog } from "@/components/dialogs/CategoryCreationDialog";
import {
  UoM,
  UoMManagementDialog,
} from "@/components/dialogs/UoMManagementDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuickAccountCreationDialog } from "@/components/dialogs/QuickAccountCreationDialog";
import { useFormTracking } from "@/hooks/useFormTracking";
import { useAutoSaveOnLeave } from "@/hooks/useAutoSaveOnLeave";
import { convertArabicToEnglishNumbers } from "@/lib/utils/numberUtils";
import { parsePrismaError } from "@/lib/utils/errorHandler";
import { ProductGeneralTab } from "./product-tabs/ProductGeneralTab";
import { ProductSalesTab } from "./product-tabs/ProductSalesTab";
import { ProductAccountingTab } from "./product-tabs/ProductAccountingTab";
import { ProductComponentsTab } from "./product-tabs/ProductComponentsTab";
import { ProductAttributesTab } from "./product-tabs/ProductAttributesTab";
import { ProductPurchasesTab } from "./product-tabs/ProductPurchasesTab";
interface ProductFormProps {
  initialData?: any;
  isCopy?: boolean;
  isModal?: boolean;
  onSuccess?: (product: any) => void;
  userRole?: string;
  canViewCost?: boolean;
}
const defaultUomFallback: Option[] = [{ value: "Units", label: "قطعة" }];

export function ProductForm({
  initialData,
  isCopy = false,
  isModal = false,
  onSuccess,
  userRole = "USER",
  canViewCost = true,
}: ProductFormProps) {
  const [saved, setSaved] = useState(false);
  const isAdmin = userRole === "ADMIN";
  const params = useParams();
  const locale = params.locale;
  const t = useTranslations("Inventory.Product");
  const [isDuplicate, setIsDuplicate] = useState(isCopy);
  const isNewRecord = !initialData?.id || isCopy;
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const DRAFT_KEY = `product_draft_${locale}`;
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [isActive, setIsActive] = useState(initialData?.active ?? true);
  const [fetchedCategories, setFetchedCategories] = useState<Option[]>([]);
  const [uomOptionsState, setUomOptionsState] =
    useState<Option[]>(defaultUomFallback);
  const [secondaryUomOptionsState, setSecondaryUomOptionsState] =
    useState<Option[]>(defaultUomFallback);
  const [bomLines, setBomLines] = useState<
    {
      id: string;
      componentId: string;
      componentName?: string;
      quantity: number;
      uom: string;
      cost?: number;
    }[]
  >(
    initialData?.boms?.length
      ? initialData.boms[0].lines.map((b: any) => ({
          id: b.id,
          componentId: b.componentId,
          componentName: b.component?.name || "",
          quantity: Number(b.quantity),
          uom: b.uom || "",
          cost: Number(b.component?.costPrice || 0),
        }))
      : [],
  );
  const [productOptions, setProductOptions] = useState<Option[]>([]);
  const [availableTags, setAvailableTags] = useState<Option[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags?.map((t: any) => t.id) || [],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  const [attributeLines, setAttributeLines] = useState<
    { id: string; attributeId: string; valueIds: string[] }[]
  >(
    initialData?.attributeLines?.map((line: any) => ({
      id: line.id,
      attributeId: line.attributeId,
      valueIds: line.values?.map((v: any) => v.id) || [],
    })) || [],
  );
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null,
  );
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [pendingAccountName, setPendingAccountName] = useState("");
  const [pendingAccountType, setPendingAccountType] = useState("income");
  const [activeAccountField, setActiveAccountField] = useState<
    "propertyAccountIncomeId" | "propertyAccountExpenseId"
  >("propertyAccountIncomeId");
  const [adjacentIds, setAdjacentIds] = useState<{
    next: string | null;
    prev: string | null;
  }>({ next: null, prev: null });
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setHasUnsavedChangesSync(true);
      };
      reader.readAsDataURL(file);
    }
  };
  const pathname = usePathname();
  useEffect(() => {
    if (!isModal && initialData?.name) {
      useBreadcrumbStore.getState().updateCurrentLabel(initialData.name);
      const pathname = window.location.pathname;
      useBreadcrumbsStore
        .getState()
        .updateCurrentLabel(initialData.name, pathname);
    }
  }, [isModal, initialData?.name, pathname]);
  const [accountOptions, setAccountOptions] = useState<{
    income: Option[];
    expense: Option[];
  }>({ income: [], expense: [] });
  const [supplierLines, setSupplierLines] = useState<
    {
      id: string;
      partnerId: string;
      price: number;
      minQty: number;
      delay: number;
      productCode: string;
    }[]
  >(
    initialData?.supplierInfo?.map((s: any) => ({
      id: s.id,
      partnerId: s.partnerId,
      price: s.price,
      minQty: s.minQty,
      delay: s.delay,
      productCode: s.productCode,
    })) || [],
  );
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);
  const nameParam = searchParams.get("name");
  const defaultValues = {
    name: isCopy
      ? initialData?.name || ""
      : initialData?.name || nameParam || "",
    can_sell: initialData?.canBeSold ?? initialData?.can_sell ?? true,
    can_purchase:
      initialData?.canBePurchased ?? initialData?.can_purchase ?? true,
    detailedType:
      (initialData?.detailedType === "product"
        ? "storable"
        : initialData?.detailedType) || "storable",
    invoicingPolicy: initialData?.invoicingPolicy || "delivered",
    price: initialData?.salePrice ?? initialData?.price ?? 0.0,
    cost: initialData?.costPrice ?? initialData?.cost ?? 0.0,
    tax_customer: initialData?.taxes ?? initialData?.tax_customer ?? 14,
    tax_vendor: initialData?.taxVendor ?? initialData?.tax_vendor ?? 0,
    category: initialData?.categoryId || initialData?.category?.id || "",
    ref: initialData?.internalReference ?? initialData?.ref ?? "",
    barcode: initialData?.barcode || "",
    manufacturer: initialData?.manufacturer || "",
    description: initialData?.description || "",
    descriptionSale: initialData?.descriptionSale || "",
    uom: initialData?.uom || "Units",
    purchaseUom: initialData?.purchaseUom || "Units",
    hasSecondaryUnit: initialData?.hasSecondaryUnit || false,
    secondaryUom: initialData?.secondaryUom || "",
    secondaryUomFactor: initialData?.secondaryUomFactor || "",
    tracking: initialData?.tracking || "none",
    routeBuy: initialData?.routeBuy ?? true,
    routeMto: initialData?.routeMto || false,
    weight: initialData?.weight || 0,
    volume: initialData?.volume || 0,
    descriptionPicking: initialData?.descriptionPicking || "",
    descriptionPickingout: initialData?.descriptionPickingout || "",
    descriptionInternal: initialData?.descriptionInternal || "",
    availableInPos: initialData?.availableInPos || false,
    websitePublished: initialData?.websitePublished || false,
    controlPolicy: initialData?.controlPolicy || "received",
    descriptionPurchase: initialData?.descriptionPurchase || "",
    costMethod: initialData?.costMethod || "standard",
    propertyAccountIncomeId: initialData?.propertyAccountIncomeId || "",
    propertyAccountExpenseId: initialData?.propertyAccountExpenseId || "",
    assetType: initialData?.assetType || "",
    priceDifferenceAccount: initialData?.priceDifferenceAccount || "",
  };
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { isDirty, errors },
  } = useForm({ defaultValues });
  const [isStarred, setIsStarred] = useState(initialData?.isFavorite ?? false);
  const [showUpdateQty, setShowUpdateQty] = useState(false);
  const [updateQtyValue, setUpdateQtyValue] = useState("0");
  const [draftId, setDraftId] = useState<string | null>(
    initialData?.id || null,
  );
  const handleToggleFavorite = async () => {
    if (!initialData?.id) return;
    try {
      const result = await toggleFavorite(initialData.id);
      if (result?.success) setIsStarred(result.isFavorite);
    } catch (e) {
      console.error(e);
    }
  };
  const handleUpdateQuantity = async () => {
    if (!initialData?.id) return;
    try {
      await updateProductQuantity(
        initialData.id,
        "default",
        parseFloat(updateQtyValue),
      );
      setShowUpdateQty(false);
      toast.success("تم تحديث الكمية بنجاح!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isDirtyImmediateRef = useRef(false);
  const setHasUnsavedChangesSync = useCallback((val: boolean) => {
    isDirtyImmediateRef.current = val;
    setHasUnsavedChanges(val);
  }, []);
  useEffect(() => {
    if (isDirty) isDirtyImmediateRef.current = true;
  }, [isDirty]);
  const hasStock = (initialData?.quantityOnHand || 0) > 0;
  const [metrics, setMetrics] = useState<{
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
  }>({
    sold: 0,
    purchased: 0,
    onHand: 0,
    forecasted: 0,
    incoming: 0,
    outgoing: 0,
    variantsCount: 0,
    journalItemsCount: 0,
    totalRevenue: 0,
    totalCost: 0,
    profitMargin: 0,
    supplierCount: 0,
  });
  useEffect(() => {
    const loadCommonData = async () => {
      if (initialData?.id) {
        const m = await getProductMetrics(initialData.id);
        setMetrics(m);
        const adjacent = await getAdjacentProductIds(initialData.id);
        setAdjacentIds(adjacent);
      } else {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          try {
            const parsedDraft = JSON.parse(draft);
            reset({ ...defaultValues, ...parsedDraft });
          } catch (e) {
            console.error("Failed to parse draft", e);
          }
        }
      }
      const cats = await getProductCategories();
      if (cats && cats.length > 0) {
        setFetchedCategories(
          cats.map((c: any) => ({
            value: c.id,
            label:
              c.name === "All"
                ? "الكل"
                : c.name === "Saleable"
                  ? "قابل للبيع"
                  : c.name,
          })),
        );
      }
      const tags = await getTags();
      if (tags) {
        setAvailableTags(
          tags.map((t: any) => ({
            value: t.id,
            label: t.name,
            color: t.color,
          })),
        );
      }
      const attrs = await getAttributes();
      if (attrs) {
        setAvailableAttributes(attrs);
      }
      const accounts = await getChartOfAccounts();
      if (accounts) {
        const allAccountOptions = accounts.map((a: any) => ({
          value: a.id,
          label: `${a.code} ${a.name}`,
        }));
        setAccountOptions({
          income: allAccountOptions,
          expense: allAccountOptions,
        });
        if (!getValues("propertyAccountIncomeId")) {
          const salesAcc = accounts.find(
            (a: any) => a.name.includes("مبيعات") || a.code === "500001",
          );
          if (salesAcc) setValue("propertyAccountIncomeId", salesAcc.id);
        }
        if (!getValues("propertyAccountExpenseId")) {
          const cogsAcc = accounts.find(
            (a: any) =>
              a.name.includes("تكلفة البضاعة المباعة مع المبيعات") ||
              a.code === "400002",
          );
          if (cogsAcc) setValue("propertyAccountExpenseId", cogsAcc.id);
        }
      }
      const vendors = await getPartners();
      if (vendors) {
        setVendorOptions(vendors);
      }
      try {
        const { getAllProducts } = await import("@/app/actions/inventory");
        const products = await getAllProducts();
        if (products) {
          setProductOptions(
            products.map((p: any) => ({ value: p.id, label: p.name })),
          );
        }
      } catch (e) {
        console.error("Could not fetch products for boms", e);
      }
      if (initialData?.id && !isDuplicate) {
        try {
          const { getProductBoms } = await import("@/app/actions/inventory");
          const boms = await getProductBoms(initialData.id);
          if (boms && boms.length > 0) {
            setBomLines(
              boms.map((b: any) => ({
                id: crypto.randomUUID(),
                componentId: b.componentId,
                componentName: b.componentName,
                quantity: Number(b.quantity),
                uom: b.uom || "",
                cost: b.cost,
              })),
            );
          }
        } catch (e) {
          console.error("Could not fetch BOMs", e);
        }
      }
    };
    loadCommonData();
  }, []);
  const handleCreateTag = async (tagName: string) => {
    try {
      const newTag = await createTag(tagName);
      if (newTag) {
        const newOption = {
          value: newTag.id,
          label: newTag.name,
          color: newTag.color,
        };
        setAvailableTags((prev) => [...prev, newOption]);
        setSelectedTagIds((prev) => [...prev, newTag.id]);
        setHasUnsavedChangesSync(true);
      }
    } catch (e) {
      console.error("Failed to create tag", e);
    }
  };
  const handleSelectTag = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds((prev) => [...prev, tagId]);
      setHasUnsavedChangesSync(true);
    }
  };
  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    setHasUnsavedChangesSync(true);
  };
  const handleAddAttributeLine = () => {
    setAttributeLines((prev) => [
      ...prev,
      { id: Math.random().toString(), attributeId: "", valueIds: [] },
    ]);
    setHasUnsavedChangesSync(true);
  };
  const handleRemoveAttributeLine = (id: string) => {
    setAttributeLines((prev) => prev.filter((l) => l.id !== id));
    setHasUnsavedChangesSync(true);
  };
  const handleAttributeChange = (lineId: string, attrId: string) => {
    setAttributeLines((prev) =>
      prev.map((l) =>
        l.id === lineId ? { ...l, attributeId: attrId, valueIds: [] } : l,
      ),
    );
    setHasUnsavedChangesSync(true);
  };
  const handleCreateAttribute = async (lineId: string, name: string) => {
    const newAttr = await createAttribute(name);
    if (newAttr) {
      setAvailableAttributes((prev) => [...prev, { ...newAttr, values: [] }]);
      handleAttributeChange(lineId, newAttr.id);
      setHasUnsavedChangesSync(true);
    }
  };
  const handleValueSelect = (lineId: string, valId: string) => {
    setAttributeLines((prev) =>
      prev.map((l) => {
        if (l.id === lineId && !l.valueIds.includes(valId)) {
          return { ...l, valueIds: [...l.valueIds, valId] };
        }
        return l;
      }),
    );
    setHasUnsavedChangesSync(true);
  };
  const handleValueRemove = (lineId: string, valId: string) => {
    setAttributeLines((prev) =>
      prev.map((l) => {
        if (l.id === lineId) {
          return { ...l, valueIds: l.valueIds.filter((v) => v !== valId) };
        }
        return l;
      }),
    );
    setHasUnsavedChangesSync(true);
  };
  const handleCreateValue = async (
    lineId: string,
    attrId: string,
    name: string,
  ) => {
    if (!attrId) return;
    const newVal = await createAttributeValue(attrId, name);
    if (newVal) {
      setAvailableAttributes((prev) =>
        prev.map((a) => {
          if (a.id === attrId) {
            return { ...a, values: [...(a.values || []), newVal] };
          }
          return a;
        }),
      );
      handleValueSelect(lineId, newVal.id);
      setHasUnsavedChangesSync(true);
    }
  };
  const finalCategoryOptions =
    fetchedCategories.length > 0 ? fetchedCategories : [];
  const handleAddSupplierLine = () => {
    setSupplierLines((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        partnerId: "",
        price: 0,
        minQty: 0,
        delay: 0,
        productCode: "",
      },
    ]);
    setHasUnsavedChangesSync(true);
  };
  const handleRemoveSupplierLine = (id: string) => {
    setSupplierLines((prev) => prev.filter((l) => l.id !== id));
    setHasUnsavedChangesSync(true);
  };
  const handleSupplierChange = (id: string, field: string, value: any) => {
    setSupplierLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    );
    setHasUnsavedChangesSync(true);
  };
  const handleAddBomLine = () => {
    setBomLines([
      ...bomLines,
      { id: crypto.randomUUID(), componentId: "", quantity: 1, uom: "قطعة" },
    ]);
    setHasUnsavedChangesSync(true);
  };
  const handleBomChange = (lineId: string, field: string, value: any) => {
    setBomLines(
      bomLines.map((line) =>
        line.id === lineId ? { ...line, [field]: value } : line,
      ),
    );
    setHasUnsavedChangesSync(true);
  };
  const handleRemoveBomLine = (lineId: string) => {
    setBomLines(bomLines.filter((line) => line.id !== lineId));
    setHasUnsavedChangesSync(true);
  };
  const fieldLabels = {
    name: "اسم المنتج",
    detailedType: "نوع المنتج",
    price: "سعر البيع",
    cost: "التكلفة",
    category: "فئة المنتج",
    uom: "وحدة القياس",
    secondaryUom: "الوحدة الثانوية",
    can_sell: "يمكن بيعه",
    can_purchase: "يمكن شراؤه",
    taxes: "الضرائب",
    ref: "المرجع الداخلي",
    barcode: "الباركود",
  };
  const { getChanges } = useFormTracking({ fieldLabels });
  const setTriggers = useStatusStore((state) => state.setTriggers);
  const clearTriggers = useStatusStore((state) => state.clearTriggers);
  const setStoreUnsaved = useStatusStore((state) => state.setHasUnsavedChanges);
  const setStoreIsSaving = useStatusStore((state) => state.setIsSaving);
  const isFormLocallyDirty = hasUnsavedChanges || isDirty;
  const bomLinesRef = useRef(bomLines);
  const supplierLinesRef = useRef(supplierLines);
  const attributeLinesRef = useRef(attributeLines);
  const selectedTagIdsRef = useRef(selectedTagIds);
  const imagePreviewRef = useRef(imagePreview);
  useEffect(() => {
    bomLinesRef.current = bomLines;
  }, [bomLines]);
  useEffect(() => {
    supplierLinesRef.current = supplierLines;
  }, [supplierLines]);
  useEffect(() => {
    attributeLinesRef.current = attributeLines;
  }, [attributeLines]);
  useEffect(() => {
    selectedTagIdsRef.current = selectedTagIds;
  }, [selectedTagIds]);
  useEffect(() => {
    imagePreviewRef.current = imagePreview;
  }, [imagePreview]);
  const backgroundSave = useCallback(async () => {
    if (!isFormLocallyDirty) return;
    try {
      const data = getValues();
      const currentId = draftId || initialData?.id;
      if (!data.name || data.name.trim() === "") return;
      const rawProductData = {
        name: data.name,
        can_sell: data.can_sell ?? true,
        can_purchase: data.can_purchase ?? true,
        detailedType: data.detailedType || "consu",
        invoicingPolicy: data.invoicingPolicy || "ordered",
        salePrice: data.price || 0,
        costPrice: data.cost || 0,
        taxes: data.tax_customer || 0,
        taxVendor: data.tax_vendor || 0,
        internalReference: data.ref || null,
        barcode: data.barcode || null,
        uom: data.uom || "قطعة",
        purchaseUom: data.purchaseUom || "قطعة",
        secondaryUom: data.hasSecondaryUnit ? data.secondaryUom || null : null,
        secondaryUomFactor: data.hasSecondaryUnit
          ? !isNaN(parseFloat(data.secondaryUomFactor as string))
            ? parseFloat(data.secondaryUomFactor as string)
            : null
          : null,
        hasSecondaryUnit: data.hasSecondaryUnit || false,
        categoryId: data.category || null,
        description: data.description || null,
        descriptionSale: data.descriptionSale || null,
        tracking: data.tracking || "none",
        routeBuy: data.routeBuy || false,
        routeMto: data.routeMto || false,
        weight: data.weight || 0,
        volume: data.volume || 0,
        descriptionPicking: data.descriptionPicking || null,
        descriptionPickingout: data.descriptionPickingout || null,
        descriptionInternal: data.descriptionInternal || null,
        availableInPos: data.availableInPos || false,
        websitePublished: data.websitePublished || false,
        controlPolicy: data.controlPolicy || "received",
        descriptionPurchase: data.descriptionPurchase || null,
        costMethod: data.costMethod || "standard",
        propertyAccountIncomeId: data.propertyAccountIncomeId || null,
        propertyAccountExpenseId: data.propertyAccountExpenseId || null,
        assetType: data.assetType || null,
        priceDifferenceAccount: data.priceDifferenceAccount || null,
        tags: selectedTagIdsRef.current || [],
        attributeLines: attributeLinesRef.current || [],
        image: imagePreviewRef.current || null,
        supplierInfo: supplierLinesRef.current || [],
        boms: (bomLinesRef.current || [])
          .filter((b) => b.componentId)
          .map((b) => ({
            componentId: b.componentId,
            quantity: b.quantity,
            uom: b.uom,
          })),
      };
      const sanitizePayload = (obj: any): any =>
        JSON.parse(
          JSON.stringify(obj, (key, value) =>
            value === undefined ? null : value,
          ),
        );
      const productData = sanitizePayload(rawProductData);
      if (currentId && !isDuplicate) {
        const res = await updateProduct(currentId, productData);
        if (res?.error) {
          toast.error(`فشل الحفظ التلقائي: ${res.error}`);
        } else {
          console.log("[BackgroundSave] Product updated successfully.");
        }
      } else if (data.name && data.name.trim() !== "") {
        const newAttr = await createProduct({
          ...productData,
          name: data.name,
        });
        if (newAttr?.error) {
          toast.error(`فشل حفظ المنتج الجديد تلقائياً: ${newAttr.error}`);
          console.error("[BackgroundSave] Error:", newAttr.error);
        } else {
          console.log("[BackgroundSave] Product auto-created successfully.");
          if (newAttr && newAttr.id) {
            setDraftId(newAttr.id);
            const currentPath = window.location.pathname;
            const locale = currentPath.split("/")[1] || "ar";
            window.history.replaceState(
              null,
              "",
              `/${locale}/inventory/products/${newAttr.id}`,
            );
          }
        }
      }
    } catch (error: any) {
      console.error("[BackgroundSave] Failed:", error); // for navigation-related abort errors (keepaliveSave handles those);
      const msg = error?.message || "";
      if (
        error?.name === "AbortError" ||
        msg.includes("aborted") ||
        msg.includes("fetch failed")
      ) {
        console.log(
          "[BackgroundSave] Request aborted by navigation — keepaliveSave should handle it.",
        );
      } else {
        toast.error("حدث خطأ أثناء الحفظ التلقائي: " + msg);
      }
    }
  }, [getValues, initialData?.id, draftId, isDuplicate, isFormLocallyDirty]);
  const keepaliveSave = useCallback(() => {
    const currentId = draftId || initialData?.id;
    console.log(
      "[KeepaliveSave] CALLED! currentId=",
      currentId,
      "isDirtyRef=",
      isDirtyImmediateRef.current,
    );
    if (!currentId) {
      console.log("[KeepaliveSave] No ID, skipping.");
      return;
    }
    const data = getValues();
    console.log(
      "[KeepaliveSave] getValues() price=",
      data.price,
      "cost=",
      data.cost,
      "name=",
      data.name,
    );
    if (!data.name || data.name.trim() === "") {
      console.log("[KeepaliveSave] No name, skipping.");
      return;
    }
    const payload = {
      id: currentId,
      data: {
        name: data.name,
        can_sell: data.can_sell ?? true,
        can_purchase: data.can_purchase ?? true,
        detailedType: data.detailedType || "consu",
        invoicingPolicy: data.invoicingPolicy || "ordered",
        salePrice: data.price || 0,
        costPrice: data.cost || 0,
        taxes: data.tax_customer || 0,
        taxVendor: data.tax_vendor || 0,
        internalReference: data.ref || null,
        barcode: data.barcode || null,
        uom: data.uom || "قطعة",
        purchaseUom: data.purchaseUom || "قطعة",
        secondaryUom: data.hasSecondaryUnit ? data.secondaryUom || null : null,
        secondaryUomFactor: data.hasSecondaryUnit
          ? !isNaN(parseFloat(data.secondaryUomFactor as string))
            ? parseFloat(data.secondaryUomFactor as string)
            : null
          : null,
        hasSecondaryUnit: data.hasSecondaryUnit || false,
        categoryId: data.category || null,
        description: data.description || null,
        descriptionSale: data.descriptionSale || null,
        tracking: data.tracking || "none",
        routeBuy: data.routeBuy || false,
        routeMto: data.routeMto || false,
        weight: data.weight || 0,
        volume: data.volume || 0,
        descriptionPicking: data.descriptionPicking || null,
        descriptionPickingout: data.descriptionPickingout || null,
        descriptionInternal: data.descriptionInternal || null,
        availableInPos: data.availableInPos || false,
        websitePublished: data.websitePublished || false,
        controlPolicy: data.controlPolicy || "received",
        descriptionPurchase: data.descriptionPurchase || null,
        costMethod: data.costMethod || "standard",
        propertyAccountIncomeId: data.propertyAccountIncomeId || null,
        propertyAccountExpenseId: data.propertyAccountExpenseId || null,
        assetType: data.assetType || null,
        priceDifferenceAccount: data.priceDifferenceAccount || null,
        image: imagePreviewRef.current || null,
      },
    };
    console.log(
      "[KeepaliveSave] Sending fetch with payload salePrice=",
      payload.data.salePrice,
    );
    fetch("/api/products/keepalive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) =>
      console.error("[KeepaliveSave] Error (likely harmless):", err),
    );
  }, [getValues, draftId, initialData?.id]);
  const noopSave = useCallback(async () => {}, []);
  const noopKeepalive = useCallback(() => {}, []);
  const { setDiscarded, setClean } = useAutoSaveOnLeave(
    isModal ? { current: false } : isDirtyImmediateRef,
    isModal ? noopSave : backgroundSave,
    isModal ? noopKeepalive : keepaliveSave,
  );
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false); // if user has genuinely interacted with the form (not just initialization);
  const hasUserInteractedRef = useRef(false);
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name || type === "change") {
        hasUserInteractedRef.current = true;
        if (!isModal) setStoreUnsaved(true);
        if (!isModal) {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = setTimeout(() => {
            backgroundSave().catch((e) => console.error("Auto-save error:", e));
          }, 3000);
        }
      }
    });
    return () => {
      subscription.unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null; // if NOT in modal mode and:
        if (
          !isModal &&
          isUnmountingRef.current &&
          hasUserInteractedRef.current &&
          isDirtyImmediateRef.current
        ) {
          console.log(
            "[WatchCleanup] Unmounting with pending changes — firing keepaliveSave!",
          );
          keepaliveSave();
        }
      }
    };
  }, [watch, setStoreUnsaved, backgroundSave, keepaliveSave, isModal]);
  useEffect(() => {
    setStoreUnsaved(hasUnsavedChanges || isDirty);
  }, [hasUnsavedChanges, isDirty, setStoreUnsaved]);
  const [messages, setMessages] = useState<any[]>([]);
  const handleSave = async (
    silent = false,
    forceCreate = false,
  ): Promise<string | undefined> => {
    return new Promise((resolve, reject) => {
      const interactedBeforeSave = hasUserInteractedRef.current;
      hasUserInteractedRef.current = false;
      if (!silent) {
        setIsSaving(true);
        setStoreIsSaving(true);
      }
      setPageError(null);
      handleSubmit(
        async (data) => {
          try {
            const productData = {
              name: data.name,
              can_sell: data.can_sell ?? true,
              can_purchase: data.can_purchase ?? true,
              detailedType: data.detailedType || "consu",
              invoicingPolicy: data.invoicingPolicy || "ordered",
              salePrice: data.price || 0,
              costPrice: data.cost || 0,
              taxes: data.tax_customer || 0,
              taxVendor: data.tax_vendor || 0,
              internalReference: data.ref || null,
              barcode: data.barcode || null,
              uom: data.uom || "قطعة",
              purchaseUom: data.purchaseUom || "قطعة",
              secondaryUom: data.hasSecondaryUnit ? data.secondaryUom || null : null,
              secondaryUomFactor: data.hasSecondaryUnit
                ? !isNaN(parseFloat(data.secondaryUomFactor as string))
                  ? parseFloat(data.secondaryUomFactor as string)
                  : null
                : null,
              hasSecondaryUnit: data.hasSecondaryUnit || false,
              categoryId: data.category || null,
              description: data.description || null,
              descriptionSale: data.descriptionSale || null,
              tracking: data.tracking || "none",
              routeBuy: data.routeBuy || false,
              routeMto: data.routeMto || false,
              weight: data.weight || 0,
              volume: data.volume || 0,
              descriptionPicking: data.descriptionPicking || null,
              descriptionPickingout: data.descriptionPickingout || null,
              descriptionInternal: data.descriptionInternal || null,
              availableInPos: data.availableInPos || false,
              websitePublished: data.websitePublished || false,
              controlPolicy: data.controlPolicy || "received",
              descriptionPurchase: data.descriptionPurchase || null,
              costMethod: data.costMethod || "standard",
              propertyAccountIncomeId: data.propertyAccountIncomeId || null,
              propertyAccountExpenseId: data.propertyAccountExpenseId || null,
              assetType: data.assetType || null,
              priceDifferenceAccount: data.priceDifferenceAccount || null,
              tags: selectedTagIdsRef.current || [],
              attributeLines: attributeLinesRef.current || [],
              image: imagePreviewRef.current || null,
              supplierInfo: supplierLinesRef.current || [],
              boms: (bomLinesRef.current || [])
                .filter((b) => b.componentId)
                .map((b) => ({
                  componentId: b.componentId,
                  quantity: b.quantity,
                  uom: b.uom,
                })),
            };
            let savedId = initialData?.id;
            if (initialData?.id && !isDuplicate) {
              const updated = await updateProduct(initialData.id, productData);
              if ((updated as any)?.error)
                throw new Error((updated as any).error);
            } else {
              if (!silent || forceCreate) {
                const newProduct = await createProduct(productData);
                if ((newProduct as any)?.error)
                  throw new Error((newProduct as any).error);
                savedId = newProduct.id;
                if (newProduct?.id) {
                  setClean();
                  resolve(newProduct.id);
                  if (isModal && onSuccess) {
                    onSuccess(newProduct);
                    return;
                  }
                  router.refresh();
                  if (returnUrl) {
                    router.push(returnUrl);
                  } else {
                    router.push(
                      `/${locale}/inventory/products/${newProduct.id}`,
                    );
                  }
                  return;
                }
              } else {
                resolve(undefined);
                return;
              }
            }
            setSaved(true);
            if (!hasUserInteractedRef.current) {
              setClean();
              setHasUnsavedChangesSync(false);
              setStoreUnsaved(false);
              if (
                typeof reset === "function" &&
                typeof getValues === "function"
              ) {
                reset(getValues(), { keepValues: true, keepDirty: false });
              }
            } else {
              // , so we keep it dirty!
              setHasUnsavedChangesSync(true);
              setStoreUnsaved(true);
            }
            if (!silent) router.refresh();
            resolve(savedId);
          } catch (error: any) {
            console.error("Save error:", error);
            const errorMessage = parsePrismaError(error);
            if (!silent) {
              toast.error(errorMessage);
              setPageError(errorMessage);
            } // if save failed
            setHasUnsavedChangesSync(true);
            reject(error);
          } finally {
            setIsSaving(false);
            setStoreIsSaving(false);
          }
        },
        (errors) => {
          console.error("Form validation errors:", errors);
          if (!silent) {
            const errorFields = Object.keys(errors).join(", ");
            toast.error(
              `يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح. الحقول الناقصة: ${errorFields}`,
            );
          }
          resolve(undefined);
        },
      )();
    });
  };
  const handleDuplicate = async () => {
    try {
      let currentId = initialData?.id;
      if (!saved || !currentId || isDuplicate) {
        const resultId = await handleSave(true, true);
        if (resultId) {
          currentId = resultId;
        }
      }
      if (!currentId) {
        toast.error(
          "حدث خطأ: لم يتم العثور على المنتج لنسخه. يرجى محاولة حفظه أولا.",
        );
        return;
      }
      const newProduct = await duplicateProduct(currentId);
      router.push(`/inventory/products/${newProduct.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error duplicating product:", error);
      toast.error(
        "حدث خطأ أثناء حفظ ومضاعفة المنتج. يرجى التأكد من تعبئة جميع الحقول المطلوبة.",
      );
    }
  };
  const handleAction = async (
    action: "archive" | "duplicate" | "delete" | "report",
  ) => {
    if (!initialData?.id) {
      setShowActionsMenu(false);
      toast.warning("يجب حفظ المنتج أولاً قبل تنفيذ الإجراءات.");
      return;
    }
    try {
      if (action === "archive") {
        setShowActionsMenu(false);
        const newState = !isActive;
        await archiveProduct(initialData.id, newState);
        setIsActive(newState);
        toast.success(newState ? "تم تفعيل المنتج" : "تم أرشفة المنتج");
      } else if (action === "duplicate") {
        setShowActionsMenu(false);
        setShowDuplicateConfirm(true);
      } else if (action === "delete") {
        setShowActionsMenu(false);
        setShowDeleteConfirm(true);
      } else if (action === "report") {
        setShowActionsMenu(false);
        toast.info("جاري إنشاء تقرير قائمة الأسعار... (محاكاة)");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تنفيذ الإجراء");
    }
  };
  const handleOpenCategoryDialog = (searchTerm: string) => {
    setNewCategoryName(searchTerm);
    setSelectedCategoryId(undefined);
    setShowCategoryDialog(true);
  };
  const handleEditCategory = (categoryId: string) => {
    if (!categoryId) return;
    const currentPath = window.location.pathname;
    const locale = currentPath.split("/")[1] || "ar";
    router.push(`/${locale}/inventory/config/categories/${categoryId}`);
  };
  const handleSaveCategory = async (data: any) => {
    try {
      let savedCat;
      if (selectedCategoryId) {
        savedCat = await updateCategory(selectedCategoryId, data);
      } else {
        savedCat = await createCategory(data);
      }
      if (savedCat?.error) {
        throw new Error(savedCat.error);
      }
      if (savedCat) {
        const updatedCats = await getProductCategories();
        setFetchedCategories(
          updatedCats.map((c: any) => ({ value: c.id, label: c.name })),
        );
        setValue("category", savedCat.id);
        setSelectedCategoryId(undefined);
      }
    } catch (e: any) {
      console.error("Failed to save category", e);
      toast.error(e.message || "Failed to save category");
      throw e; // this
    }
  };
  const handleOpenAccountDialog = (
    name: string,
    type: "income" | "expense",
    fieldName: "propertyAccountIncomeId" | "propertyAccountExpenseId",
  ) => {
    setPendingAccountName(name);
    setPendingAccountType(type);
    setActiveAccountField(fieldName);
    setShowAccountDialog(true);
  };
  const handleAccountCreated = async (data: {
    code: string;
    name: string;
    type: string;
  }) => {
    try {
      const result = await createAccount({
        name: data.name,
        type: data.type,
        code: data.code,
        id: "new",
      });
      if (result.success && result.account) {
        const accounts = await getChartOfAccounts();
        if (accounts) {
          const allAccounts = accounts.map((a: any) => ({
            value: a.id,
            label: `${a.code} ${a.name}`,
          }));
          setAccountOptions({ income: allAccounts, expense: allAccounts });
        }
        setValue(activeAccountField, result.account.id, { shouldDirty: true });
      } else {
        console.error("Failed to save new account", result.error);
      }
    } catch (error) {
      console.error("Failed to save new account", error);
      throw error;
    }
  };
  const [showUoMDialog, setShowUoMDialog] = useState(false);
  const [activeUomField, setActiveUomField] = useState<"uom" | "secondaryUom">(
    "secondaryUom",
  );
  const [uomDialogInitialName, setUomDialogInitialName] = useState("");
  const [units, setUnits] = useState<UoM[]>([]);
  const [uomCategories, setUomCategories] = useState<any[]>([]);
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const { getUomCategories } = await import("@/app/actions/inventory");
        const [cats, tags, attrs, uomList, uomCats] = await Promise.all([
          getProductCategories(),
          getTags(),
          getAttributes(),
          getUoms(),
          getUomCategories(),
        ]);
        setFetchedCategories(
          cats.map((c: any) => ({ value: c.id, label: c.name })),
        );
        setAvailableTags(
          tags.map((t: any) => ({
            value: t.id,
            label: t.name,
            color: t.color,
          })),
        );
        setUomCategories(uomCats);
        if (uomList && uomList.length > 0) {
          const options = uomList.map((u: any) => ({
            value: u.name,
            label: u.name,
          }));
          setUomOptionsState(options);
          setSecondaryUomOptionsState(options);
          setUnits(uomList);
        }
        const uomOptions = uomList.map((u: any) => ({
          value: u.name,
          label: u.name,
        }));
        const uniqueOptions = uomOptions.filter(
          (v, i, a) => a.findIndex((t) => t.value === v.value) === i,
        ); // if user deleted it
        if (uniqueOptions.length === 0)
          uniqueOptions.push({ value: "Units", label: "قطعة" });
        setUomOptionsState(uniqueOptions);
        setSecondaryUomOptionsState(uniqueOptions);
      } catch (e) {
        console.error("Failed to load dependencies", e);
      }
    };
    loadRequests();
  },
    []);
  const reloadAccounts = async () => {
    const accounts = await getChartOfAccounts();
    if (accounts) {
      const allAccounts = accounts.map((a: any) => ({
        value: a.id,
        label: `${a.code} ${a.name}`,
      }));
      setAccountOptions({ income: allAccounts, expense: allAccounts });
    }
  };
  const handleReloadUoms = async () => {
    try {
      const uomList = await getUoms();
      const uomOptions = uomList
        .map((u: any) => ({ value: u.name, label: u.name }))
        .filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i);
      if (uomOptions.length === 0)
        uomOptions.push({ value: "Units", label: "قطعة" });
      setUomOptionsState(uomOptions);
      setSecondaryUomOptionsState(uomOptions);
      setUnits(uomList);
      return uomOptions;
    } catch (e) {
      console.error("Failed to reload UoMs", e);
      return null;
    }
  };
  const openUomDialog = (field: "uom" | "secondaryUom", initialName = "") => {
    setActiveUomField(field);
    setUomDialogInitialName(initialName);
    setShowUoMDialog(true);
  };
  const handleAddUnit = async (uom: UoM) => {
    try {
      await createUom(uom);
      await handleReloadUoms();
    } catch (e) {
      toast.error("فشل في إنشاء الوحدة");
    }
  };
  const handleUpdateUnit = async (uom: UoM) => {
    try {
      await updateUom(uom.id, uom);
      await handleReloadUoms();
    } catch (e) {
      toast.error("فشل في تحديث الوحدة");
    }
  };
  const handleDeleteUnit = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    try {
      await deleteUom(id);
      const newList = await getUoms();
      const uomOptions = newList.map((u: any) => ({
        value: u.name,
        label: u.name,
      }));
      setUomOptionsState(uomOptions);
      setSecondaryUomOptionsState(uomOptions);
    } catch (e) {
      toast.error("فشل في حذف الوحدة");
    }
  };
  const handleSaveUoM = async (uom: any) => {
    await handleReloadUoms();
    if (uom && uom.name) {
      const newOption = { value: uom.name, label: uom.name };
      if (activeUomField === "uom") {
        setUomOptionsState((prev) => {
          if (!prev.find((p) => p.value === newOption.value))
            return [...prev, newOption];
          return prev;
        });
        setValue("uom", uom.name);
      } else {
        setSecondaryUomOptionsState((prev) => {
          if (!prev.find((p) => p.value === newOption.value))
            return [...prev, newOption];
          return prev;
        });
        setValue("secondaryUom", uom.name);
        if (uom.type === "bigger" && uom.ratio) {
          setValue("secondaryUomFactor", uom.ratio);
        }
      }
    }
  };
  const hasSecondaryUnit = watch("hasSecondaryUnit");
  const [pagination, setPagination] = useState({
    prev: null,
    next: null,
    index: 0,
    total: 0,
  });
  useEffect(() => {
    if (initialData?.id && !isDuplicate) {
      getProductPagination(initialData.id).then((res: any) =>
        setPagination(res),
      );
    }
  }, [initialData?.id, isDuplicate]);
  const handleNavigate = (id: string | null) => {
    if (id) router.push(`/${locale}/inventory/products/${id}`);
  };
  const handleNew = () => {
    router.push(`/${locale}/inventory/products/new`);
  };
  const handleDiscard = () => {
    if (confirm("تجاهل التعديلات والعودة؟")) {
      setDiscarded();
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        window.history.back();
      }
    }
  };
  const handleResetForm = () => {
    if (
      confirm(
        "هل أنت متأكد من رغبتك في التراجع عن جميع التعديلات والتراجع للوضع الأصلي؟",
      )
    ) {
      reset(defaultValues);
      localStorage.removeItem(DRAFT_KEY);
      if (initialData?.bomLines) {
        setBomLines(
          initialData.bomLines.map((line: any) => ({
            id: crypto.randomUUID(),
            componentId: line.componentId,
            quantity: Number(line.quantity),
            uom: line.uom || "",
          })),
        );
      } else {
        setBomLines([]);
      }
      if (initialData?.attributeLines) {
        setAttributeLines(
          initialData.attributeLines.map((line: any) => ({
            id: crypto.randomUUID(),
            attributeId: line.attributeId,
            valueIds: line.values.map((v: any) => v.id),
          })),
        );
      } else {
        setAttributeLines([]);
      }
      if (initialData?.supplierLines) {
        setSupplierLines(
          initialData.supplierLines.map((line: any) => ({
            id: crypto.randomUUID(),
            partnerId: line.partnerId,
            minQty: Number(line.minQty),
            price: Number(line.price),
            delay: line.delay || 0,
          })),
        );
      } else {
        setSupplierLines([]);
      }
      setImagePreview(initialData?.imageUrl || null);
      setHasUnsavedChangesSync(false);
      toast.info("تم استعادة البيانات الأصلية");
    }
  };
  const discardChanges = useCallback(() => {
    setDiscarded();
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.refresh();
    }
  }, [setDiscarded, returnUrl, router]);
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });
  useEffect(() => {
    setTriggers(() => handleSaveRef.current(false, false), discardChanges);
    return () => clearTriggers();
  }, [discardChanges, setTriggers, clearTriggers]);
  return (
    <div
      className={`bg-slate-100 ${isModal ? "pb-4" : "min-h-screen pt-2 pb-4 px-4 sm:px-8"} font-sans text-right`}
      dir="rtl"
    >
      {" "}
      <CategoryCreationDialog
        isOpen={showCategoryDialog}
        onClose={() => setShowCategoryDialog(false)}
        onSave={handleSaveCategory}
        initialName={newCategoryName}
        categories={fetchedCategories}
        categoryId={selectedCategoryId}
      />{" "}
      <UoMManagementDialog
        isOpen={showUoMDialog}
        onClose={() => {
          setShowUoMDialog(false);
          setUomDialogInitialName("");
        }}
        onSave={handleSaveUoM}
        initialName={uomDialogInitialName}
        units={units}
        uomCategories={uomCategories}
      />{" "}
      {!isModal && (
        <TopPortal>
          {" "}
          <div
            className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse"
            dir="rtl"
          >
            {" "}
            {}{" "}
            <button
              onClick={handleNew}
              title="إنشاء منتج جديد"
              className="bg-white border border-[#017E84] text-[#017E84] px-3 py-1.5 rounded-sm text-sm font-bold hover:bg-[#017E84] hover:text-white transition-colors h-8 flex items-center justify-center min-w-[60px]"
            >
              {" "}
              جديد{" "}
            </button>{" "}
            <div className="h-4 w-px bg-slate-300 mx-1"></div> {}{" "}
            <div className="flex items-center text-slate-500 font-numbers text-xs font-bold gap-2">
              {" "}
              <button
                className={`p-1 rounded-sm transition-colors ${adjacentIds.next ? "text-slate-700 hover:bg-slate-200" : "text-slate-300 cursor-not-allowed"}`}
                title="التالي"
                onClick={() =>
                  adjacentIds.next &&
                  router.push(
                    `/${locale}/inventory/products/${adjacentIds.next}`,
                  )
                }
                disabled={!adjacentIds.next}
              >
                {" "}
                <ChevronLeft className="w-4 h-4" />{" "}
              </button>{" "}
              <button
                className={`p-1 rounded-sm transition-colors ${adjacentIds.prev ? "text-slate-700 hover:bg-slate-200" : "text-slate-300 cursor-not-allowed"}`}
                title="السابق"
                onClick={() =>
                  adjacentIds.prev &&
                  router.push(
                    `/${locale}/inventory/products/${adjacentIds.prev}`,
                  )
                }
                disabled={!adjacentIds.prev}
              >
                {" "}
                <ChevronRight className="w-4 h-4" />{" "}
              </button>{" "}
              <span dir="ltr" className="inline-block">
                {pagination.index || 1} / {pagination.total || 1}
              </span>{" "}
            </div>{" "}
            {}{" "}

            {initialData?.id && !isDuplicate && (
              <div className="relative">
                {" "}
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="flex items-center gap-1.5 text-slate-700 px-2 py-1.5 rounded-sm text-sm hover:bg-slate-100 transition-colors font-medium border-transparent border hover:border-slate-300"
                >
                  {" "}
                  <Settings className="w-3.5 h-3.5 text-slate-500" /> إجراء{" "}
                </button>{" "}
                {showActionsMenu && (
                  <div
                    className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 shadow-md rounded-sm py-1 z-50 overflow-hidden text-right"
                    dir="rtl"
                  >
                    {" "}
                    <button
                      onClick={() => handleAction("duplicate")}
                      className="w-full text-right px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                      {" "}
                      <Copy className="w-3.5 h-3.5 text-slate-400" /> إنشاء نسخة
                      مطابقة{" "}
                    </button>{" "}
                    <button
                      onClick={() => handleAction("archive")}
                      className="w-full text-right px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                      {" "}
                      <Activity className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {isActive ? "أرشفة المنتج" : "تفعيل المنتج"}{" "}
                    </button>{" "}
                    <div className="border-t border-slate-100 my-1"></div>{" "}
                    <button
                      onClick={() => handleAction("delete")}
                      className="w-full text-right px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      {" "}
                      <Trash2 className="w-3.5 h-3.5 text-red-500" /> حذف
                      نهائي{" "}
                    </button>{" "}
                  </div>
                )}{" "}
              </div>
            )}{" "}
            {isFormLocallyDirty && (
              <>
                {" "}
                <button
                  onClick={() => handleSave(false, true)}
                  disabled={isSaving}
                  className="bg-[#017E84] text-white px-3 py-1 rounded-sm text-sm font-bold hover:bg-[#006A6F] transition-colors flex items-center gap-2 h-8"
                >
                  {" "}
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4" />
                  )}{" "}
                  حفظ يدوي{" "}
                </button>{" "}
                <button
                  onClick={discardChanges}
                  disabled={isSaving}
                  className="bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded-sm text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 h-8"
                >
                  {" "}
                  <RotateCcw className="w-4 h-4" /> تجاهل{" "}
                </button>{" "}
              </>
            )}{" "}
          </div>{" "}
        </TopPortal>
      )}{" "}
      {}{" "}
      {isModal && (
        <div className="flex items-center justify-start gap-2 mb-4 bg-white p-3 rounded-md shadow-sm border border-slate-200">
          {" "}
          <button
            onClick={() => handleSave(false, true)}
            disabled={isSaving}
            className="bg-[#017E84] text-white px-4 py-2 rounded-sm text-sm font-bold flex items-center justify-center min-w-[80px]"
          >
            {" "}
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "حفظ المنتج"
            )}{" "}
          </button>{" "}
          {isFormLocallyDirty && (
            <button
              onClick={handleDiscard}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-sm font-bold bg-slate-100 hover:bg-slate-200 rounded-sm"
            >
              {" "}
              تجاهل التعديلات{" "}
            </button>
          )}{" "}
        </div>
      )}{" "}
      {}{" "}
      {initialData?.id && !isActive && (
        <div className="relative">
          {" "}
          <div className="absolute top-0 left-0 z-30 overflow-hidden w-[150px] h-[150px] pointer-events-none">
            {" "}
            <div className="absolute top-[28px] left-[-35px] w-[200px] text-center transform -rotate-45 bg-red-600 text-white text-xs font-bold py-1 shadow-md">
              {" "}
              مؤرشف{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {}{" "}
      <QuickAccountCreationDialog
        isOpen={showAccountDialog}
        onClose={() => setShowAccountDialog(false)}
        onSave={handleAccountCreated}
        initialName={pendingAccountName}
        initialType={pendingAccountType}
      />{" "}
      <div
        className={`max-w-[1200px] mx-auto pb-20 ${isSaving ? "pointer-events-none opacity-60 transition-opacity duration-200" : ""}`}
      >
        {" "}
        {pageError && (
          <div className="bg-red-50 border border-red-200 p-4 mb-4 flex items-start gap-3 rounded shadow-sm">
            {" "}
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />{" "}
            <div>
              {" "}
              <h3 className="text-sm font-bold text-red-800">
                تعذر الحفظ
              </h3>{" "}
              <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap">
                {pageError}
              </p>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {}{" "}
        <div className="flex justify-start mb-4" dir="rtl">
          {" "}
          <div className="flex bg-white rounded-sm border border-slate-200 h-[44px] overflow-hidden divide-x divide-x-reverse divide-slate-200 shrink-0 shadow-sm">
            {" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/products?templateId=${initialData.id}`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[110px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <ListFilter className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-slate-800 text-[13px]">
                  1
                </span>{" "}
                <span className="text-slate-500 text-[11px]">
                  الأسعار الإضافية
                </span>{" "}
              </div>{" "}
            </Link>{" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/stock?productId=${initialData.id}`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[120px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <Box className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-[#017E84] text-[13px]">
                  {metrics.onHand}{" "}
                  <span className="text-[10px] text-slate-500 font-normal">
                    قطعة
                  </span>
                </span>{" "}
                <span className="text-slate-500 text-[11px]">الموجود</span>{" "}
              </div>{" "}
            </Link>{" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/products/${initialData.id}/quants`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[120px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <RefreshCw className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-slate-800 text-[13px]">
                  تحديث الكمية
                </span>{" "}
                <span className="text-slate-500 text-[11px]">
                  الجرد الفعلي
                </span>{" "}
              </div>{" "}
            </Link>{" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/forecast?productId=${initialData.id}`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[120px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <Box className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-slate-800 text-[13px]">
                  {metrics.forecasted}{" "}
                  <span className="text-[10px] text-slate-500 font-normal">
                    قطعة
                  </span>
                </span>{" "}
                <span className="text-slate-500 text-[11px]">المتوقع</span>{" "}
              </div>{" "}
            </Link>{" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/operations/receipts?productId=${initialData.id}`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[120px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <Box className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-[#017E84] text-[13px]">
                  {metrics.incoming}{" "}
                  <span className="text-[10px] text-slate-500 font-normal">
                    قطعة
                  </span>
                </span>{" "}
                <span className="text-slate-500 text-[11px]">
                  Incoming
                </span>{" "}
              </div>{" "}
            </Link>{" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/operations/deliveries?productId=${initialData.id}`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[120px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <Box className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-[#017E84] text-[13px]">
                  {metrics.outgoing}{" "}
                  <span className="text-[10px] text-slate-500 font-normal">
                    قطعة
                  </span>
                </span>{" "}
                <span className="text-slate-500 text-[11px]">
                  Outgoing
                </span>{" "}
              </div>{" "}
            </Link>{" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/products/${initialData.id}/moves`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[120px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <ArrowRightLeft className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-[#017E84] text-[13px]">
                  سجل{" "}
                  <span className="text-[10px] text-slate-500 font-normal">
                    الحركات
                  </span>
                </span>{" "}
                <span className="text-slate-500 text-[11px]">
                  الداخل والخارج
                </span>{" "}
              </div>{" "}
            </Link>{" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/products/${initialData.id}/sales`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[120px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <BarChart3 className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-slate-800 text-[13px]">
                  {metrics.sold}
                </span>{" "}
                <span className="text-slate-500 text-[11px]">
                  تم البيع
                </span>{" "}
              </div>{" "}
            </Link>{" "}
            {}{" "}
            <Link
              href={
                initialData?.id
                  ? `/${locale}/inventory/products/${initialData.id}/purchases`
                  : "#"
              }
              className={`h-full px-3 hover:bg-slate-50 flex items-center min-w-[120px] transition-colors ${!initialData?.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {" "}
              <CreditCard className="w-6 h-6 text-slate-500 shrink-0 ml-2" />{" "}
              <div className="flex flex-col items-start leading-tight">
                {" "}
                <span className="font-bold text-slate-800 text-[13px]">
                  {metrics.purchased}
                </span>{" "}
                <span className="text-slate-500 text-[11px]">
                  تم الشراء
                </span>{" "}
              </div>{" "}
            </Link>{" "}
          </div>{" "}
        </div>{" "}
        {}{" "}
        <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-6 sm:p-8 relative sheet">
          {" "}
          <div className="flex gap-6 mb-8 items-start">
            {" "}
            {}{" "}
            <div className="w-[100px] h-[100px] bg-white border border-slate-200 shadow-sm flex items-center justify-center relative group cursor-pointer hover:bg-slate-50 transition-all shrink-0 overflow-hidden">
              {" "}
              {imagePreview ? (
                <img
                  src={imagePreview as string}
                  alt="Product"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-200" />
              )}{" "}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleImageUpload}
                accept="image/*"
                title="تغيير الصورة"
              />{" "}
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                {" "}
                <span className="text-xs text-white font-medium">
                  تعديل
                </span>{" "}
              </div>{" "}
            </div>{" "}
            {}{" "}
            <div className="flex-1 max-w-3xl space-y-4">
              {" "}
              <div className="space-y-1">
                {" "}
                <div className="flex items-center gap-4 group/title border-b border-transparent focus-within:border-slate-400 transition-all pb-1">
                  {" "}
                  <input
                    {...register("name", { required: true })}
                    autoComplete="new-password"
                    aria-autocomplete="none"
                    spellCheck="false"
                    className="text-[28px] font-bold bg-transparent outline-none w-full text-slate-900 placeholder-slate-300"
                    placeholder="مثال: طقم مكتب تنفيذي"
                  />{" "}
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className="text-slate-400 hover:text-yellow-400 transition-colors"
                  >
                    {" "}
                    <StarIcon
                      className={cn(
                        "w-6 h-6",
                        isStarred ? "fill-yellow-400 text-yellow-400" : "",
                      )}
                    />{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex gap-8">
                {" "}
                <label className="flex items-center gap-3 cursor-pointer group">
                  {" "}
                  <div className="relative flex items-center">
                    {" "}
                    <Controller
                      name="can_sell"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            setHasUnsavedChangesSync(true);
                          }}
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-sm checked:bg-[#017E84] checked:border-[#017E84] focus:outline-none transition-all cursor-pointer"
                        />
                      )}
                    />{" "}
                    <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-0.5 pointer-events-none" />{" "}
                  </div>{" "}
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                    يمكن بيعه
                  </span>{" "}
                </label>{" "}
                <label className="flex items-center gap-3 cursor-pointer group">
                  {" "}
                  <div className="relative flex items-center">
                    {" "}
                    <Controller
                      name="can_purchase"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            setHasUnsavedChangesSync(true);
                          }}
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-sm checked:bg-[#017E84] checked:border-[#017E84] focus:outline-none transition-all cursor-pointer"
                        />
                      )}
                    />{" "}
                    <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-0.5 pointer-events-none" />{" "}
                  </div>{" "}
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                    يمكن شراؤه
                  </span>{" "}
                </label>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="border-b border-slate-200 mb-6">
            {" "}
            <div className="flex gap-6 overflow-x-auto">
              {" "}
              <button
                onClick={() => setActiveTab("general")}
                className={`py-2 px-1 text-sm font-medium transition-all ${activeTab === "general" ? "text-slate-800 border-b-2 border-[#2563EB]" : "text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300"}`}
              >
                {t("general")}
              </button>{" "}
              <button
                onClick={() => setActiveTab("sales")}
                className={`py-2 px-1 text-sm font-medium transition-all ${activeTab === "sales" ? "text-slate-800 border-b-2 border-[#2563EB]" : "text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300"}`}
              >
                المبيعات
              </button>{" "}
              <button
                onClick={() => setActiveTab("components")}
                className={`py-2 px-1 text-sm font-medium transition-all ${activeTab === "components" ? "text-slate-800 border-b-2 border-[#2563EB]" : "text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300"}`}
              >
                المكونات الداخليه
              </button>{" "}
              <button
                onClick={() => setActiveTab("attributes")}
                className={`py-2 px-1 text-sm font-medium transition-all ${activeTab === "attributes" ? "text-slate-800 border-b-2 border-[#2563EB]" : "text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300"}`}
              >
                {t("attributes")}
              </button>{" "}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab("purchases")}
                  className={`py-2 px-1 text-sm font-medium transition-all ${activeTab === "purchases" ? "text-slate-800 border-b-2 border-[#2563EB]" : "text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300"}`}
                >
                  {t("purchase")}
                </button>
              )}{" "}
              <button
                onClick={() => setActiveTab("inventory")}
                className={`py-2 px-1 text-sm font-medium transition-all ${activeTab === "inventory" ? "text-slate-800 border-b-2 border-[#2563EB]" : "text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300"}`}
              >
                {t("inventory")}
              </button>{" "}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab("accounting")}
                  className={`py-2 px-1 text-sm font-medium transition-all ${activeTab === "accounting" ? "text-slate-800 border-b-2 border-[#2563EB]" : "text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300"}`}
                >
                  {t("accounting")}
                </button>
              )}{" "}
            </div>{" "}
          </div>{" "}
          {}{" "}
          <div className="min-h-[300px]">
            {" "}
            {activeTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {" "}
                {}{" "}
                <div className="space-y-3">
                  {" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2 border-l border-transparent">
                      {t("type")}
                    </label>{" "}
                    <select
                      {...register("detailedType")}
                      className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent"
                    >
                      {" "}
                      <option value="consu" className="font-bold">
                        استهلاكي
                      </option>{" "}
                      <option value="service">خدمة</option>{" "}
                      <option value="storable">منتج قابل للتخزين</option>{" "}
                    </select>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      سياسة الفوترة
                    </label>{" "}
                    <select
                      {...register("invoicingPolicy")}
                      className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent"
                    >
                      {" "}
                      <option value="ordered">الكميات المطلوبة</option>{" "}
                      <option value="delivered">الكميات المستلمة</option>{" "}
                    </select>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      وحدة القياس
                    </label>{" "}
                    <div className="flex items-center gap-1 w-full">
                      {" "}
                      <div className="flex-1">
                        {" "}
                        <Controller
                          name="uom"
                          control={control}
                          render={({ field }) => (
                            <OdooCombobox
                              options={uomOptionsState}
                              value={field.value}
                              onChange={field.onChange}
                              onCreate={(val) => openUomDialog("uom")}
                              placeholder="قطعه"
                              className={!field.value ? "border-b-red-500" : ""}
                              searchable={true}
                              disabled={hasStock}
                            />
                          )}
                        />{" "}
                      </div>{" "}
                      <button
                        type="button"
                        onClick={() => !hasStock && openUomDialog("uom")}
                        disabled={hasStock}
                        className={`p-1 rounded transition-colors ${hasStock ? "text-slate-300 cursor-not-allowed" : "hover:bg-slate-100 text-slate-400 hover:text-[#2563EB]"}`}
                        title={
                          hasStock
                            ? "لا يمكن تعديل وحدة القياس لوجود رصيد"
                            : "إدارة وحدات القياس"
                        }
                      >
                        {" "}
                        <ExternalLink className="w-4 h-4" />{" "}
                      </button>{" "}
                    </div>{" "}
                  </div>{" "}
                  {}{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center mt-2">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      وحدة ثانوية؟
                    </label>{" "}
                    <Controller
                      name="hasSecondaryUnit"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            setHasUnsavedChangesSync(true);
                          }}
                          disabled={hasStock}
                          className="checkbox checkbox-xs rounded-sm border-slate-400 checked:bg-[#2563EB]"
                        />
                      )}
                    />{" "}
                  </div>{" "}
                  {hasSecondaryUnit && (
                    <>
                      {" "}
                      <div className="grid grid-cols-[130px_1fr] items-center mt-2">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2 text-right w-full cursor-pointer hover:text-blue-600 transition-colors">
                          الثانوية UOM.
                        </label>{" "}
                        <div className="flex items-center gap-1 w-full">
                          {" "}
                          <div className="flex-1">
                            {" "}
                            <Controller
                              name="secondaryUom"
                              control={control}
                              render={({ field }) => (
                                <OdooCombobox
                                  options={secondaryUomOptionsState}
                                  value={field.value}
                                  onChange={(val) => {
                                    field.onChange(val);
                                    if (val) {
                                      const converted =
                                        convertArabicToEnglishNumbers(
                                          String(val),
                                        );
                                      const match =
                                        converted.match(/(\d+[\d.]*)/);
                                      if (match) {
                                        const extractedFactor = parseFloat(
                                          match[1],
                                        );
                                        if (extractedFactor > 0) {
                                          setValue(
                                            "secondaryUomFactor",
                                            extractedFactor,
                                          );
                                        }
                                      }
                                    }
                                  }}
                                  onCreate={(val) =>
                                    openUomDialog("secondaryUom")
                                  }
                                  placeholder="اختر وحدة ثانوية..."
                                  searchable={true}
                                  disabled={hasStock}
                                  className="w-full text-lg font-bold min-h-[40px] flex items-center"
                                />
                              )}
                            />{" "}
                          </div>{" "}
                          <button
                            type="button"
                            onClick={() =>
                              !hasStock && openUomDialog("secondaryUom")
                            }
                            disabled={hasStock}
                            className={`p-1 rounded transition-colors ${hasStock ? "text-slate-300 cursor-not-allowed" : "hover:bg-slate-100 text-slate-400 hover:text-[#2563EB]"}`}
                            title={
                              hasStock
                                ? "لا يمكن التعديل لوجود رصيد"
                                : "إدارة وحدات القياس"
                            }
                          >
                            {" "}
                            <ExternalLink className="w-4 h-4" />{" "}
                          </button>{" "}
                        </div>{" "}
                      </div>{" "}
                      {}{" "}
                      <div className="hidden">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2 text-right w-full">
                          معامل التحويل
                        </label>{" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <input
                            type="number"
                            step="0.01"
                            {...register("secondaryUomFactor")}
                            onChange={(e) => {
                              const val = convertArabicToEnglishNumbers(
                                e.target.value,
                              );
                              setValue(
                                "secondaryUomFactor",
                                val ? parseFloat(val) : 1,
                              );
                            }}
                            disabled={hasStock}
                            className="w-32 border border-slate-200 rounded focus:border-[#2563EB] outline-none py-1.5 px-2 text-sm bg-transparent font-bold"
                            placeholder="مثال: 70"
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                    </>
                  )}
                </div>{" "}
                {}{" "}
                <div className="space-y-3">
                  {" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      {t("salePrice")}
                    </label>{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <Controller
                        name="price"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = convertArabicToEnglishNumbers(
                                e.target.value,
                              ).replace(/[^0-9.]/g, "");
                              field.onChange(val);
                              setHasUnsavedChangesSync(true);
                            }}
                            className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-lg font-bold text-slate-800 bg-transparent text-left"
                            dir="ltr"
                          />
                        )}
                      />{" "}
                      <span className="text-sm text-slate-500 font-bold">
                        ج.م
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  {canViewCost && (
                    <div className="grid grid-cols-[130px_1fr] items-center">
                      {" "}
                      <label className="text-sm font-bold text-slate-700 pl-2">
                        {t("cost")}
                      </label>{" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <Controller
                          name="cost"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = convertArabicToEnglishNumbers(
                                  e.target.value,
                                ).replace(/[^0-9.]/g, "");
                                field.onChange(val);
                                setHasUnsavedChangesSync(true);
                              }}
                              className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-lg font-bold text-slate-800 bg-transparent text-left"
                              dir="ltr"
                            />
                          )}
                        />{" "}
                        <span className="text-sm text-slate-500 font-bold">
                          ج.م
                        </span>{" "}
                      </div>{" "}
                    </div>
                  )}
                  <div className="grid grid-cols-[130px_1fr] items-center mt-4 group">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2 text-right w-full cursor-pointer group-hover:text-slate-900 transition-colors">
                      فئة المنتج
                    </label>{" "}
                    <div className="flex items-center w-full">
                      {" "}
                      <div className="flex-1">
                        {" "}
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <OdooCombobox
                              options={finalCategoryOptions}
                              value={field.value}
                              onChange={field.onChange}
                              onCreate={(val) => handleOpenCategoryDialog(val)}
                              onExternalLink={(val) => handleEditCategory(val)}
                              onSearchMore={async () => {
                                const name = watch("name");
                                if (name && name.trim()) {
                                  try {
                                    const savedId = await handleSave(
                                      true,
                                      true,
                                    );
                                    if (savedId) {
                                      router.push(
                                        `/${locale}/inventory/config/categories?returnUrl=/${locale}/inventory/products/${savedId}`,
                                      );
                                      return;
                                    }
                                  } catch (e) {}
                                }
                                router.push(
                                  `/${locale}/inventory/config/categories`,
                                );
                              }}
                              placeholder="اختر فئة المنتج..."
                              className="w-full text-lg font-bold min-h-[40px] border-b border-slate-300 focus-within:border-[#2563EB]"
                              searchable={true}
                              maxOptions={7}
                            />
                          )}
                        />{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            )}
            {activeTab === "sales" && <ProductSalesTab register={register} setValue={setValue} convertArabicToEnglishNumbers={convertArabicToEnglishNumbers} />}
            {activeTab === "components" && <ProductComponentsTab bomLines={bomLines} productOptions={productOptions} handleAddComponent={handleAddBomLine} handleComponentChange={handleBomChange} handleRemoveComponent={handleRemoveBomLine} convertArabicToEnglishNumbers={convertArabicToEnglishNumbers} initialDataId={initialData?.id} uomOptionsState={uomOptionsState} />}
            {activeTab === "attributes" && <ProductAttributesTab attributeLines={attributeLines} availableAttributes={availableAttributes} handleAddAttributeLine={handleAddAttributeLine} handleRemoveAttributeLine={handleRemoveAttributeLine} handleAttributeChange={handleAttributeChange} handleCreateAttribute={handleCreateAttribute} handleValueSelect={handleValueSelect} handleValueRemove={handleValueRemove} handleCreateValue={handleCreateValue} />}
            {activeTab === "purchases" && <ProductPurchasesTab supplierLines={supplierLines} vendorOptions={vendorOptions} handleAddSupplierLine={handleAddSupplierLine} handleSupplierChange={handleSupplierChange} handleRemoveSupplierLine={handleRemoveSupplierLine} register={register} setValue={setValue} convertArabicToEnglishNumbers={convertArabicToEnglishNumbers} />}
            {activeTab === "accounting" && <ProductAccountingTab register={register} setValue={setValue} watch={watch} control={control} accountOptions={accountOptions} handleOpenAccountDialog={handleOpenAccountDialog} />}
            {activeTab === "inventory" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {" "}
                <div className="grid grid-cols-2 gap-8">
                  {" "}
                  {}{" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-1">
                      العمليات
                    </h3>{" "}
                    <div className="space-y-4">
                      {" "}
                      <div className="grid grid-cols-[130px_1fr] items-center">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2">
                          المسارات
                        </label>{" "}
                        <div className="space-y-2">
                          {" "}
                          <div className="flex items-center gap-2">
                            {" "}
                            <Controller
                              name="routeBuy"
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  id="route_buy"
                                  checked={!!field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked);
                                    setHasUnsavedChangesSync(true);
                                  }}
                                  className="rounded border-slate-300 text-[#017E84] focus:ring-indigo-500"
                                />
                              )}
                            />{" "}
                            <label
                              htmlFor="route_buy"
                              className="text-sm font-medium text-slate-700"
                            >
                              شراء (Buy)
                            </label>{" "}
                          </div>{" "}
                          <div className="flex items-center gap-2">
                            {" "}
                            <Controller
                              name="routeMto"
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  id="route_mto"
                                  checked={!!field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked);
                                    setHasUnsavedChangesSync(true);
                                  }}
                                  className="rounded border-slate-300 text-[#017E84] focus:ring-indigo-500"
                                />
                              )}
                            />{" "}
                            <label
                              htmlFor="route_mto"
                              className="text-sm font-medium text-slate-700"
                            >
                              إعادة التزويد عند الطلب (MTO)
                            </label>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="grid grid-cols-[130px_1fr] items-center">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2">
                          التتبع
                        </label>{" "}
                        <select
                          {...register("tracking")}
                          className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent font-medium"
                        >
                          {" "}
                          <option value="none">لا يوجد تتبع</option>{" "}
                          <option value="lot">بالدفعات (Lots)</option>{" "}
                          <option value="serial">
                            بالأرقام التسلسلية الفريدة (SN)
                          </option>{" "}
                        </select>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  {}{" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-1">
                      اللوجستيات
                    </h3>{" "}
                    <div className="space-y-3">
                      {" "}
                      <div className="grid grid-cols-[130px_1fr] items-center">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2">
                          الوزن
                        </label>{" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <input
                            type="number"
                            step="0.01"
                            {...register("weight", {
                              onChange: (e) => {
                                const v = convertArabicToEnglishNumbers(
                                  e.target.value,
                                );
                                setValue("weight", v, { shouldDirty: true });
                              },
                            })}
                            className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent"
                            placeholder="0.00"
                          />{" "}
                          <span className="text-xs text-slate-500">
                            كجم
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="grid grid-cols-[130px_1fr] items-center">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2">
                          الكثافة
                        </label>{" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <input
                            type="number"
                            step="0.01"
                            {...register("volume", {
                              onChange: (e) => {
                                const v = convertArabicToEnglishNumbers(
                                  e.target.value,
                                );
                                setValue("volume", v, { shouldDirty: true });
                              },
                            })}
                            className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent"
                            placeholder="0.00"
                          />{" "}
                          <span className="text-xs text-slate-500">
                            متر مكعب
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="grid grid-cols-[130px_1fr] items-center">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2">
                          مهلة العميل
                        </label>{" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <input
                            type="number"
                            {...register("saleDelay", {
                              valueAsNumber: true,
                              onChange: (
                                e: React.ChangeEvent<HTMLInputElement>,
                              ) => {
                                const v = convertArabicToEnglishNumbers(
                                  e.target.value,
                                );
                                setValue("saleDelay", v ? parseInt(v) : 0, {
                                  shouldDirty: true,
                                });
                              },
                            })}
                            className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent"
                            placeholder="0"
                          />{" "}
                          <span className="text-xs text-slate-500">
                            يوم
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                {}{" "}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  {" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-1">
                      الوصف في الشحنات الواردة
                    </h3>{" "}
                    <textarea
                      {...register("descriptionPicking")}
                      rows={3}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="تتم إضافة هذه الملاحظة إلى أوامر الاستلام..."
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-1">
                      الوصف في أوامر التوصيل
                    </h3>{" "}
                    <textarea
                      {...register("descriptionPickingout")}
                      rows={3}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="تتم إضافة هذه الملاحظة إلى أوامر التوصيل..."
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="pt-2">
                  {" "}
                  <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-1">
                    الوصف في التحركات الداخلية
                  </h3>{" "}
                  <textarea
                    {...register("descriptionInternal")}
                    rows={3}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="تتم إضافة هذه الملاحظة إلى أوامر التحويل الداخلي..."
                  />{" "}
                </div>{" "}
              </div>
            )}{" "}
          </div>{" "}
        </div>{" "}
        {!isNewRecord && <Chatter model="product" id={initialData.id} />}{" "}

        <ConfirmDialog
          open={showDeleteConfirm}
          title="حذف المنتج"
          message="هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف نهائي"
          cancelLabel="إلغاء"
          variant="danger"
          loading={isDeleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              console.log(
                "[DELETE] Starting delete for product:",
                initialData?.id,
              );
              const result = await deleteProduct(initialData.id);
              console.log("[DELETE] Server response:", JSON.stringify(result));
              if (result?.error) {
                toast.error(result.error);
              } else if (result?.success) {
                toast.success("تم حذف المنتج بنجاح");
                router.push(`/${locale}/inventory/products`);
              } else {
                toast.error("حدث خطأ غير متوقع أثناء الحذف");
              }
            } catch (e: any) {
              console.error("[DELETE] Exception:", e);
              toast.error(
                e?.message || "لا يمكن حذف المنتج. يرجى أرشفته بدلاً من ذلك.",
              );
            } finally {
              setIsDeleting(false);
              setShowDeleteConfirm(false);
            }
          }}
        />{" "}
        <ConfirmDialog
          open={showDuplicateConfirm}
          title="نسخ المنتج"
          message="هل أنت متأكد من إنشاء نسخة مطابقة من هذا المنتج؟"
          confirmLabel="نسخ"
          cancelLabel="إلغاء"
          variant="default"
          onCancel={() => setShowDuplicateConfirm(false)}
          onConfirm={async () => {
            setShowDuplicateConfirm(false);
            try {
              const newProduct = await duplicateProduct(initialData.id);
              toast.success("تم إنشاء نسخة مطابقة: " + newProduct.name);
              router.push(`/${locale}/inventory/products/${newProduct.id}`);
            } catch (e: any) {
              toast.error(e?.message || "حدث خطأ أثناء النسخ");
            }
          }}
        />{" "}
      </div>{" "}
    </div>
  );
}
