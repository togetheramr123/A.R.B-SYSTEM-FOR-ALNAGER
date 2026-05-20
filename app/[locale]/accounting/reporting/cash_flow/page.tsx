import { getCashFlowStatement } from "@/app/actions/reporting";
import { CashFlowReport } from "@/components/accounting/CashFlowReport";
import { Button } from "@/components/ui/button";
import { Landmark, Download } from "lucide-react";
import { TopPortal } from "@/components/common/TopPortal";
interface Props {
  searchParams: {
    from?: string;
    to?: string;
  };
}
export default async function CashFlowReportingPage({
  searchParams
}: Props) {
  const from = searchParams.from ? new Date(searchParams.from) : new Date(new Date().getFullYear(), 0, 1);
  const to = searchParams.to ? new Date(searchParams.to) : new Date();
  const data = await getCashFlowStatement(from, to);
  return <div className="p-4 space-y-6">
      {" "}
      <TopPortal>
        {" "}
        <Button variant="outline" size="sm" className="h-7 text-xs">
          {" "}
          <Download className="mr-1.5 h-3.5 w-3.5" /> تنزيل التقرير{" "}
        </Button>{" "}
      </TopPortal>{" "}
      <div className="flex justify-between items-center bg-white p-4 rounded-sm border border-slate-200">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <div className="bg-green-100 p-3 rounded-sm shadow-inner">
            {" "}
            <Landmark className="h-8 w-8 text-green-700" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h1 className="text-3xl font-bold tracking-tight">
              قائمة التدفقات النقدية
            </h1>{" "}
            <p className="text-muted-foreground mt-1">
              {" "}
              تحليل الحركات النقدية من {from.toLocaleDateString("ar-EG")} إلى {to.toLocaleDateString("ar-EG")}{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center gap-4">
          {" "}
          <div className="text-right">
            {" "}
            <div className="text-xs font-bold text-gray-400 uppercase">
              صافي الزيادة / (النقص)
            </div>{" "}
            <div className={`text-xl font-bold ${data.netIncrease >= 0 ? "text-green-600" : "text-red-600"}`}>
              {" "}
              {data.netIncrease.toFixed(2)}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <CashFlowReport data={data} from={from.toISOString()} to={to.toISOString()} />{" "}
    </div>;
}