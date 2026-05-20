import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
export interface DashboardCardProp {
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  colorClass?: string;
  bgClass?: string;
  metrics?: {
    label: string;
    value: string | number;
    trend?: string;
  }[];
}
export function DashboardCards({
  title,
  subtitle,
  cards
}: {
  title: string;
  subtitle?: string;
  cards: DashboardCardProp[];
}) {
  return <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full animate-fade-in-up">
      {" "}
      <div className="mb-8 text-center md:text-start rtl:md:text-right">
        {" "}
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
          {title}
        </h1>{" "}
        {subtitle && <p className="text-slate-500 font-medium">{subtitle}</p>}{" "}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {" "}
        {cards.map((card, idx) => {
        const Icon = card.icon;
        return <Link key={idx} href={card.href} className="group">
              {" "}
              <div className="bg-white rounded-sm p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-sm hover: hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                {" "}
                {/* Background subtle accent */}{" "}
                <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20", card.bgClass || "bg-[#017E84]/100")} />{" "}
                <div className="flex items-start gap-4 mb-6 relative">
                  {" "}
                  <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center shrink-0 shadow-sm", card.bgClass || "bg-[#017E84]/10 text-[#017E84]")}>
                    {" "}
                    <Icon className="w-6 h-6" strokeWidth={2} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#017E84] transition-colors">
                      {card.title}
                    </h3>{" "}
                    {card.description && <p className="text-sm text-slate-500 leading-relaxed mt-1 line-clamp-2">
                        {card.description}
                      </p>}{" "}
                  </div>{" "}
                </div>{" "}
                {card.metrics && card.metrics.length > 0 && <div className="mt-auto grid grid-cols-2 gap-4 pt-5 border-t border-slate-50/80">
                    {" "}
                    {card.metrics.map((metric, mIdx) => <div key={mIdx}>
                        {" "}
                        <p className="text-2xl font-bold text-slate-700 font-numbers">
                          {metric.value}
                        </p>{" "}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {" "}
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {metric.label}
                          </p>{" "}
                          {metric.trend && <span className={cn("text-[10px] font-bold px-1 rounded-sm", metric.trend.includes("-") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-teal-700")}>
                              {" "}
                              {metric.trend}{" "}
                            </span>}{" "}
                        </div>{" "}
                      </div>)}{" "}
                  </div>}{" "}
              </div>{" "}
            </Link>;
      })}{" "}
      </div>{" "}
    </div>;
}