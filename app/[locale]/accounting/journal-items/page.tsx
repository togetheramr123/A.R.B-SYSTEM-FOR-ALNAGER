import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { JournalItemsClient } from "./JournalItemsClient";

export default async function JournalItemsPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    filter?: string;
    journal?: string;
    q?: string;
  }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const filter = searchParams?.filter;
  const journalFilter = searchParams?.journal;
  const q = searchParams?.q;
  const currentPage = parseInt(searchParams?.page || "1");
  const pageSize = 80;
  const skip = (currentPage - 1) * pageSize;

  const where: any = {};
  
  if (filter === "posted") {
    where.entry = { state: "posted" };
  } else if (filter === "draft") {
    where.entry = { state: "draft" };
  }
  
  if (journalFilter) {
    where.entry = { ...where.entry, journalId: journalFilter };
  }
  
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { account: { name: { contains: q, mode: 'insensitive' } } },
      { account: { code: { contains: q, mode: 'insensitive' } } },
      { entry: { name: { contains: q, mode: 'insensitive' } } },
      { entry: { partner: { name: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  const [items, totalCount, totals] = await Promise.all([
    prisma.journalItem.findMany({
      where,
      include: {
        entry: {
          include: {
            partner: true,
            journal: true,
          }
        },
        account: true,
      },
      orderBy: [
        { entry: { date: "desc" } },
        { id: "desc" }
      ],
      skip,
      take: pageSize
    }),
    prisma.journalItem.count({ where }),
    prisma.journalItem.aggregate({
      where,
      _sum: {
        debit: true,
        credit: true,
      }
    })
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const serializedItems = serializeDecimal(items);
  const startRecord = skip + 1;
  const endRecord = Math.min(skip + pageSize, totalCount);

  return (
    <JournalItemsClient 
      locale={locale}
      items={serializedItems}
      totalCount={totalCount}
      startRecord={startRecord}
      endRecord={endRecord}
      currentPage={currentPage}
      totalPages={totalPages}
      filter={filter}
      journalFilter={journalFilter}
      q={q}
      totalDebit={Number(totals._sum.debit || 0)}
      totalCredit={Number(totals._sum.credit || 0)}
    />
  );
}