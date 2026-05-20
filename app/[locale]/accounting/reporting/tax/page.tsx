import { getTaxReport } from "@/app/actions/reporting";
import { TaxReport } from "@/components/accounting/TaxReport";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { TopPortal } from "@/components/common/TopPortal";
interface Props {
  searchParams: {
    from?: string;
    to?: string;
  };
}
export default async function TaxReportingPage({
  searchParams
}: Props) {
  const from = searchParams.from ? new Date(searchParams.from) : new Date(new Date().getFullYear(), 0, 1);
  const to = searchParams.to ? new Date(searchParams.to) : new Date();
  const data = await getTaxReport(from, to);
  return <div className="p-4 space-y-6">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <Button variant="outline" size="sm" className="h-7 text-xs">
            {" "}
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print{" "}
          </Button>{" "}
          <Button variant="outline" size="sm" className="h-7 text-xs">
            {" "}
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV{" "}
          </Button>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="flex justify-between items-center bg-white p-4 rounded-sm border border-slate-200">
        {" "}
        <div>
          {" "}
          <h1 className="text-3xl font-bold tracking-tight">
            Tax Report (VAT)
          </h1>{" "}
          <p className="text-muted-foreground mt-1">
            {" "}
            Report period: {from.toLocaleDateString()} to{" "}
            {to.toLocaleDateString()}{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <TaxReport data={data} from={from.toISOString()} to={to.toISOString()} />{" "}
    </div>;
}