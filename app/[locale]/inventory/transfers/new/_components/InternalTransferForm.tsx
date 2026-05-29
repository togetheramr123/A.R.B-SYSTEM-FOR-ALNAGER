"use client";

import { useActionState, useState } from "react";
import { createInternalTransfer } from "@/app/actions/inventory";
import { Plus, Trash2, ArrowRightLeft, Loader2 } from "lucide-react";
export default function InternalTransferForm({
  locations,
  products,
  locale
}: any) {
  /* @ts-ignore */const [state, formAction, isPending] = useActionState(createInternalTransfer, null);
  const [rows, setRows] = useState([{
    id: 1
  }]);
  const addRow = () => {
    setRows([...rows, {
      id: Date.now()
    }]);
  };
  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };
  return <form action={formAction}>
      {" "}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {" "}
        <div>
          {" "}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Location
          </label>{" "}
          <select name="sourceLocationId" className="w-full border-gray-300 rounded-md shadow-sm p-2 border" required>
            {" "}
            <option value="">Select Source...</option>{" "}
            {locations.map((loc: any) => <option key={loc.id} value={loc.id}>
                {loc.completeName || loc.name}
              </option>)}{" "}
          </select>{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination Location
          </label>{" "}
          <select name="destLocationId" className="w-full border-gray-300 rounded-md shadow-sm p-2 border" required>
            {" "}
            <option value="">Select Destination...</option>{" "}
            {locations.map((loc: any) => <option key={loc.id} value={loc.id}>
                {loc.completeName || loc.name}
              </option>)}{" "}
          </select>{" "}
        </div>{" "}
      </div>{" "}
      <div className="mb-6">
        {" "}
        <div className="flex items-center justify-between mb-2">
          {" "}
          <h3 className="text-lg font-medium text-gray-900">Products</h3>{" "}
          <button type="button" onClick={addRow} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
            {" "}
            <Plus size={16} /> Add Line{" "}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوحدة
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
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
                    <select name="productId" className="w-full border-gray-300 rounded-md shadow-sm p-1 border text-sm" required>
                      {" "}
                      <option value="">Select Product...</option>{" "}
                      {products.map((p: any) => <option key={p.id} value={p.id}>
                          {p.name}
                        </option>)}{" "}
                    </select>{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <select name="unitSelection" className="w-full border-gray-300 rounded-md shadow-sm p-1 border text-sm" required>
                      {" "}
                      <option value="primary">أساسية (Primary)</option>{" "}
                      <option value="secondary">ثانوية (Secondary)</option>{" "}
                    </select>{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" name="quantity" min="1" step="0.01" defaultValue="1" className="w-24 border-gray-300 rounded-md shadow-sm p-1 border text-sm" required />{" "}
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
        <a href={`/${locale}/inventory/transfers`} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
          {" "}
          Cancel{" "}
        </a>{" "}
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
          {" "}
          {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}{" "}
          Validate Transfer{" "}
        </button>{" "}
      </div>{" "}
    </form>;
}