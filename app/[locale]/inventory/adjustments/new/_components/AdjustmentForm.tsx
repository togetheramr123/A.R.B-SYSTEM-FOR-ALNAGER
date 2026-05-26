"use client";

import { useActionState, useState, useMemo } from "react";
import { createInventoryAdjustment } from "@/app/actions/inventory";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
export default function AdjustmentForm({
  locations,
  products,
  quants,
  locale
}: any) {
  /* @ts-ignore */const [state, formAction, isPending] = useActionState(createInventoryAdjustment, null);
  const [rows, setRows] = useState([{
    id: 1,
    productId: "",
    quantity: 0
  }]);
  const [locationId, setLocationId] = useState("");
  const addRow = () => {
    setRows([...rows, {
      id: Date.now(),
      productId: "",
      quantity: 0
    }]);
  };
  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };
  const updateRow = (id: number, field: string, value: any) => {
    setRows(rows.map((r: any) => r.id === id ? {
      ...r,
      [field]: value
    } : r));
  };
  const getTheoreticalQty = (productId: string) => {
    if (!productId || !locationId) return 0;
    const q = quants.find((q: any) => q.productId === productId && q.locationId === locationId);
    return q ? q.quantity : 0;
  };
  return <form action={formAction}>
      {" "}
      <div className="mb-6 max-w-md">
        {" "}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>{" "}
        <select name="locationId" value={locationId} onChange={e => setLocationId(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" required>
          {" "}
          <option value="">Select Location...</option>{" "}
          {locations.map((loc: any) => <option key={loc.id} value={loc.id}>
              {loc.completeName || loc.name}
            </option>)}{" "}
        </select>{" "}
      </div>{" "}
      <div className="mb-6">
        {" "}
        <div className="flex items-center justify-between mb-2">
          {" "}
          <h3 className="text-lg font-medium text-gray-900">
            Products to Adjust
          </h3>{" "}
          <button type="button" onClick={addRow} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
            {" "}
            <Plus size={16} /> Add Product{" "}
          </button>{" "}
        </div>{" "}
        <div className="border rounded-lg overflow-hidden">
          {" "}
          <table className="min-w-full divide-y divide-gray-200">
            {" "}
            <thead className="bg-gray-50">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Theoretical Qty
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Real Quantity
                </th>{" "}
                <th className="px-6 py-3 text-right"></th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="bg-white divide-y divide-gray-200">
              {" "}
              {rows.map((row: any) => <tr key={row.id}>
                  {" "}
                  <td className="px-6 py-4">
                    {" "}
                    <select name="productId" value={row.productId} onChange={e => updateRow(row.id, "productId", e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-1 border text-sm" required>
                      {" "}
                      <option value="">Select Product...</option>{" "}
                      {products.map((p: any) => <option key={p.id} value={p.id}>
                          {p.name}
                        </option>)}{" "}
                    </select>{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                    {" "}
                    {getTheoreticalQty(row.productId).toFixed(2)}{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" name="realQuantity" step="0.01" className="w-24 border-gray-300 rounded-md shadow-sm p-1 border text-sm font-bold text-blue-600" required />{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-right">
                    {" "}
                    <button type="button" onClick={() => removeRow(row.id)} className="text-red-500 hover:text-red-700">
                      {" "}
                      <Trash2 size={16} />{" "}
                    </button>{" "}
                  </td>{" "}
                </tr>)}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
      {state?.error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {" "}
          {state.error}{" "}
        </div>}{" "}
      <div className="flex justify-end gap-3">
        {" "}
        <a href={`/${locale}/inventory/adjustments`} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
          {" "}
          Cancel{" "}
        </a>{" "}
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
          {" "}
          {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}{" "}
          Apply Adjustment{" "}
        </button>{" "}
      </div>{" "}
    </form>;
}