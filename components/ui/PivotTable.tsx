'use client';

import { useMemo } from 'react';
export type PivotConfig = {
  rows: string[];
  cols?: string[];
  measures: string[];
};
interface PivotTableProps {
  data: any[];
  config: PivotConfig;
  className?: string;
}
export function PivotTable({
  data,
  config,
  className
}: PivotTableProps) {
  const {
    matrix,
    rowLabels,
    colLabels
  } = useMemo(() => {
    const rowKey = config.rows[0];
    const colKey = config.cols?.[0];
    const measureKey = config.measures[0];
    const rows = Array.from(new Set(data.map(d => getDescendantProp(d, rowKey) || 'Undefined'))).sort();
    const cols = colKey ? Array.from(new Set(data.map(d => getDescendantProp(d, colKey) || 'Undefined'))).sort() : ['Total'];
    const mat: any = {};
    
    rows.forEach((r: any) => {
      mat[r] = {};
      cols.forEach((c: any) => {
        mat[r][c] = 0;
      });
    });
    
    data.forEach((d: any) => {
      const r = getDescendantProp(d, rowKey) || 'Undefined';
      const c = colKey ? getDescendantProp(d, colKey) || 'Undefined' : 'Total';
      const val = getDescendantProp(d, measureKey) || 0;
      mat[r][c] += Number(val);
    });
    
    return {
      matrix: mat,
      rowLabels: rows,
      colLabels: cols
    };
  }, [data, config]);
  function getDescendantProp(obj: any, desc: string) {
    if (!desc) return null;
    const arr = desc.split('.');
    let part;
    while (obj && (part = arr.shift())) {
      obj = obj[part];
    }
    return obj;
  }
  return <div className={`overflow-x-auto border rounded-sm shadow-sm ${className}`}> <table className="w-full text-sm text-left rtl:text-right text-gray-500 bg-white"> <thead className="text-xs text-gray-700 uppercase bg-gray-50"> <tr> <th className="px-6 py-3 border-b">{config.rows[0]}</th> {colLabels.map(c => <th key={c} className="px-6 py-3 border-b text-center">{c}</th>)} </tr> </thead> <tbody> {rowLabels.map((r, idx) => <tr key={r} className="bg-white border-b hover:bg-gray-50"> <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap border-r bg-gray-50"> {String(r)} </td> {colLabels.map(c => <td key={c} className="px-6 py-4 text-center border-l"> {matrix[r][c].toLocaleString()} </td>)} </tr>)} {} <tr className="bg-gray-100 font-bold"> <td className="px-6 py-4 border-r">Total</td> {colLabels.map(c => {
            const total = rowLabels.reduce((sum, r) => sum + matrix[r][c], 0);
            return <td key={c} className="px-6 py-4 text-center border-l"> {total.toLocaleString()} </td>;
          })} </tr> </tbody> </table> </div>;
}