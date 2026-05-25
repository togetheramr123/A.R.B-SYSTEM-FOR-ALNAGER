import prisma from "@/lib/prisma";
import { Mail, Phone, MapPin, User, Plus, Search, Filter, Download, Building, Users, CreditCard, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { serializeDecimal } from "@/lib/serialize";
import { PartnerListClient } from "@/components/partner/PartnerListClient";

export default async function ContactsPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    filter?: string;
    type?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const q = searchParams?.q;
  const filter = searchParams?.filter;
  const typeFilter = searchParams?.type;
  const where: any = {};
  if (q) {
    where.OR = [{
      name: {
        contains: q
      }
    }, {
      email: {
        contains: q
      }
    }, {
      phone: {
        contains: q
      }
    }];
  }
  if (filter === "customer") where.isCustomer = true;
  if (filter === "vendor") where.isVendor = true;
  if (typeFilter === "company") where.type = "company";
  if (typeFilter === "person") where.type = "person";
  const partners = await prisma.partner.findMany({
    where,
    orderBy: {
      name: "asc"
    },
    take: 80,
    include: {
      _count: {
        select: {
          invoices: true,
          saleOrders: true
        }
      }
    }
  });
  /* Calculate total receivable for each partner */
  const partnerIds = partners.map((p: any) => p.id);
  const receivables = await prisma.invoice.groupBy({
    by: ["partnerId"],
    _sum: {
      amountResidual: true
    },
    where: {
      partnerId: {
        in: partnerIds
      },
      state: "posted",
      type: "out_invoice"
    }
  });
  const payables = await prisma.invoice.groupBy({
    by: ["partnerId"],
    _sum: {
      amountResidual: true
    },
    where: {
      partnerId: {
        in: partnerIds
      },
      state: "posted",
      type: "in_invoice"
    }
  });
  const receivableMap: Record<string, number> = {};
  const payableMap: Record<string, number> = {};
  receivables.forEach((r: any) => {
    receivableMap[r.partnerId] = Number(r._sum.amountResidual || 0);
  });
  payables.forEach((p: any) => {
    payableMap[p.partnerId] = Number(p._sum.amountResidual || 0);
  });
  /* Stats */
  const totalPartners = partners.length;
  const customerCount = partners.filter((p: any) => p.isCustomer).length;
  const vendorCount = partners.filter((p: any) => p.isVendor).length;
  const companyCount = partners.filter((p: any) => p.type === "company").length;
  
  const stats = {
    totalPartners,
    customerCount,
    vendorCount,
    companyCount
  };

  const serializedPartners = serializeDecimal(partners);

  return (
    <PartnerListClient
      partners={serializedPartners}
      locale={locale}
      receivableMap={receivableMap}
      payableMap={payableMap}
      stats={stats}
      q={q}
      filter={filter}
      typeFilter={typeFilter}
    />
  );
}