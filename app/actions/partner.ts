"use server";

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ensureAccess } from '@/lib/access';
import { CreatePartnerSchema, UpdatePartnerSchema, validateSafe } from '@/lib/validations';
import { logAuditAction } from '@/app/actions/audit';
export async function getAllPartners() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("partner", "read");
  return prisma.partner.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      mobile: true,
      email: true
    },
    orderBy: {
      name: 'asc'
    },
    take: 200
  });
}
export async function getPartner(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("partner", "read");
  const partner = await prisma.partner.findUnique({
    where: {
      id
    },
    include: {
      bankAccounts: true,
      purchaseAgreements: {
        orderBy: {
          startDate: 'desc'
        }
      },
      saleAgreements: {
        orderBy: {
          startDate: 'desc'
        }
      },
      tags: true,
      propertyAccountReceivable: true,
      propertyAccountPayable: true,
      parent: true,
      children: true,
      _count: {
        select: {
          saleOrders: true,
          purchaseOrders: true,
          invoices: true
        }
      }
    } as any
  });
  if (!partner) return null;
  const receivableAccount = await prisma.account.findFirst({
    where: {
      type: 'receivable',
      companyId: partner.companyId || undefined
    }
  });
  const payableAccount = await prisma.account.findFirst({
    where: {
      type: 'payable',
      companyId: partner.companyId || undefined
    }
  });
  let totalReceivable = 0;
  let totalPayable = 0;
  if (receivableAccount) {
    const result = await prisma.journalItem.aggregate({
      _sum: {
        debit: true,
        credit: true
      },
      where: {
        entry: {
          partnerId: id,
          state: 'posted'
        },
        accountId: receivableAccount.id
      }
    });
    totalReceivable = (result._sum?.debit?.toNumber() || 0) - (result._sum?.credit?.toNumber() || 0);
  }
  if (payableAccount) {
    const result = await prisma.journalItem.aggregate({
      _sum: {
        debit: true,
        credit: true
      },
      where: {
        entry: {
          partnerId: id,
          state: 'posted'
        },
        accountId: payableAccount.id
      }
    });
    totalPayable = (result._sum?.credit?.toNumber() || 0) - (result._sum?.debit?.toNumber() || 0);
  }
  return {
    ...partner,
    totalReceivable,
    totalPayable
  };
}
export async function getPartnerDefaults() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("partner", "read");

  const company = await prisma.company.findFirst();
  return {
    propertyAccountReceivableId: (await prisma.account.findFirst({
      where: {
        type: 'receivable',
        companyId: company?.id
      }
    }))?.id,
    propertyAccountPayableId: (await prisma.account.findFirst({
      where: {
        type: 'payable',
        companyId: company?.id
      }
    }))?.id
  };
}
export async function getAccountingOptions() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("partner", "read");

  const [receivableAccounts, payableAccounts, pricelists] = await Promise.all([prisma.account.findMany({
    where: {
      type: 'receivable'
    },
    select: {
      id: true,
      name: true,
      code: true
    }
  }), prisma.account.findMany({
    where: {
      type: 'payable'
    },
    select: {
      id: true,
      name: true,
      code: true
    }
  }), prisma.priceList.findMany({
    where: {
      active: true
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    },
    take: 50
  })]);
  const paymentTerms = [{
    id: 'immediate',
    name: 'فوري'
  }, {
    id: '15days',
    name: '15 يوم'
  }, {
    id: '30days',
    name: '30 يوم'
  }, {
    id: '45days',
    name: '45 يوم'
  }, {
    id: '60days',
    name: '60 يوم'
  }, {
    id: '90days',
    name: '90 يوم'
  }];
  return {
    receivableAccounts,
    payableAccounts,
    paymentTerms,
    pricelists
  };
}
export async function updatePartner(id: string, data: any) {
  const session = await getSession();
  if (!session) return {
    error: "غير مصرح"
  };
  await ensureAccess('partner', 'write');
  const validation = validateSafe(UpdatePartnerSchema, data);
  if (!validation.success) return {
    error: `بيانات غير صالحة: ${validation.error}`
  };
  const propertyAccountReceivableId = data.propertyAccountReceivableId;
  const propertyAccountPayableId = data.propertyAccountPayableId;
  if (Array.isArray(data.customerType)) {
    data.customerType = data.customerType.join(',');
  }
  const cleanData: any = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
  if (!cleanData.customerType || cleanData.customerType === 'none') {
    cleanData.customerType = 'cash';
  }
  delete cleanData.id;
  delete cleanData.bankAccounts;
  delete cleanData.companyId;
  delete cleanData.tags;
  delete cleanData.propertyAccountReceivableId;
  delete cleanData.propertyAccountPayableId;
  delete cleanData.propertyAccountReceivable;
  delete cleanData.propertyAccountPayable;
  delete cleanData.parent;
  delete cleanData.children;
  delete cleanData._count;
  delete cleanData.totalReceivable;
  delete cleanData.totalPayable;
  delete cleanData.branch;
  delete cleanData.createdAt;
  delete cleanData.updatedAt;
  delete cleanData.updatedBy;
  delete cleanData.createdBy;
  delete cleanData.odooId;
  delete cleanData.isCompany;
  delete cleanData.isSupplier;
  delete cleanData.taxId;
  delete cleanData.purchaseAgreements;
  delete cleanData.saleAgreements;
  try {
    const bankAccountsData = data.bankAccounts && Array.isArray(data.bankAccounts) ? {
      deleteMany: {
        id: {
          notIn: data.bankAccounts.filter((b: any) => b.id).map((b: any) => b.id)
        }
      },
      upsert: data.bankAccounts.map((b: any) => ({
        where: {
          id: b.id || 'new_id'
        },
        create: {
          accNumber: b.accNumber,
          bankName: b.bankName
        },
        update: {
          accNumber: b.accNumber,
          bankName: b.bankName
        }
      }))
    } : undefined;
    const purchaseAgreementsData = data.purchaseAgreements && Array.isArray(data.purchaseAgreements) ? {
      deleteMany: {
        id: {
          notIn: data.purchaseAgreements.filter((b: any) => b.id).map((b: any) => b.id)
        }
      },
      upsert: data.purchaseAgreements.map((b: any) => ({
        where: {
          id: b.id || 'new_id'
        },
        create: {
          group: b.group,
          discount1: Number(b.discount1) || 0,
          discount2: Number(b.discount2) || 0,
          discount3: Number(b.discount3) || 0,
          addition: Number(b.addition) || 0,
          startDate: b.startDate ? new Date(b.startDate) : null,
          endDate: b.endDate ? new Date(b.endDate) : null,
          season: b.season,
          branch: b.branch
        },
        update: {
          group: b.group,
          discount1: Number(b.discount1) || 0,
          discount2: Number(b.discount2) || 0,
          discount3: Number(b.discount3) || 0,
          addition: Number(b.addition) || 0,
          startDate: b.startDate ? new Date(b.startDate) : null,
          endDate: b.endDate ? new Date(b.endDate) : null,
          season: b.season,
          branch: b.branch
        }
      }))
    } : undefined;
    const saleAgreementsData = data.saleAgreements && Array.isArray(data.saleAgreements) ? {
      deleteMany: {
        id: {
          notIn: data.saleAgreements.filter((b: any) => b.id).map((b: any) => b.id)
        }
      },
      upsert: data.saleAgreements.map((b: any) => ({
        where: {
          id: b.id || 'new_id'
        },
        create: {
          group: b.group,
          discount1: Number(b.discount1) || 0,
          discount2: Number(b.discount2) || 0,
          discount3: Number(b.discount3) || 0,
          addition: Number(b.addition) || 0,
          startDate: b.startDate ? new Date(b.startDate) : null,
          endDate: b.endDate ? new Date(b.endDate) : null,
          season: b.season,
          branch: b.branch
        },
        update: {
          group: b.group,
          discount1: Number(b.discount1) || 0,
          discount2: Number(b.discount2) || 0,
          discount3: Number(b.discount3) || 0,
          addition: Number(b.addition) || 0,
          startDate: b.startDate ? new Date(b.startDate) : null,
          endDate: b.endDate ? new Date(b.endDate) : null,
          season: b.season,
          branch: b.branch
        }
      }))
    } : undefined;
    await prisma.partner.update({
      where: {
        id
      },
      data: {
        ...cleanData,
        ...(propertyAccountReceivableId ? {
          propertyAccountReceivable: {
            connect: {
              id: propertyAccountReceivableId
            }
          }
        } : {}),
        ...(propertyAccountPayableId ? {
          propertyAccountPayable: {
            connect: {
              id: propertyAccountPayableId
            }
          }
        } : {}),
        ...(bankAccountsData ? {
          bankAccounts: bankAccountsData
        } : {}),
        ...(purchaseAgreementsData ? {
          purchaseAgreements: purchaseAgreementsData
        } : {}),
        ...(saleAgreementsData ? {
          saleAgreements: saleAgreementsData
        } : {}),
        updatedById: session.userId
      } as any
    });

    await logAuditAction({
      action: 'update',
      model: 'partner',
      recordId: id,
      recordName: cleanData.name || '',
      newValues: { name: cleanData.name, phone: cleanData.phone, email: cleanData.email },
    });

    revalidatePath('/[locale]/contacts');
    revalidatePath(`/[locale]/contacts/${id}`);
    return {
      id
    };
  } catch (dbError: any) {
    console.error("Database Update Error:", dbError);
    return {
      error: 'حدث خطأ في قاعدة البيانات أثناء التعديل: ' + (dbError.message || 'خطأ غير معروف')
    };
  }
}
export async function createPartner(data: any) {
  const session = await getSession();
  if (!session) return {
    error: "غير مصرح"
  };
  await ensureAccess('partner', 'create');
  const validation = validateSafe(CreatePartnerSchema, data);
  if (!validation.success) return {
    error: `بيانات غير صالحة: ${validation.error}`
  };
  const company = await prisma.company.findFirst();
  const propertyAccountReceivableId = data.propertyAccountReceivableId || (await prisma.account.findFirst({
    where: {
      type: 'receivable',
      companyId: company?.id
    }
  }))?.id;
  const propertyAccountPayableId = data.propertyAccountPayableId || (await prisma.account.findFirst({
    where: {
      type: 'payable',
      companyId: company?.id
    }
  }))?.id;
  if (Array.isArray(data.customerType)) {
    data.customerType = data.customerType.join(',');
  }
  const cleanData: any = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
  if (!cleanData.customerType || cleanData.customerType === 'none') {
    cleanData.customerType = 'cash';
  }
  const bankAccounts = data.bankAccounts && Array.isArray(data.bankAccounts) ? {
    create: data.bankAccounts.map((b: any) => ({
      accNumber: b.accNumber,
      bankName: b.bankName
    }))
  } : undefined;
  delete cleanData.id;
  delete cleanData.bankAccounts;
  delete cleanData.companyId;
  delete cleanData.tags;
  delete cleanData.purchaseAgreements;
  delete cleanData.saleAgreements;
  delete cleanData.propertyAccountReceivableId;
  delete cleanData.propertyAccountPayableId;
  delete cleanData.propertyAccountReceivable;
  delete cleanData.propertyAccountPayable;
  delete cleanData.parent;
  delete cleanData.children;
  delete cleanData._count;
  delete cleanData.totalReceivable;
  delete cleanData.totalPayable;
  delete cleanData.branch;
  delete cleanData.createdAt;
  delete cleanData.updatedAt;
  delete cleanData.updatedBy;
  delete cleanData.createdBy;
  delete cleanData.odooId;
  delete cleanData.isCompany;
  delete cleanData.isSupplier;
  delete cleanData.taxId;
  try {
    const partner = await prisma.partner.create({
      data: {
        ...cleanData,
        propertyAccountReceivable: propertyAccountReceivableId ? {
          connect: {
            id: propertyAccountReceivableId
          }
        } : undefined,
        propertyAccountPayable: propertyAccountPayableId ? {
          connect: {
            id: propertyAccountPayableId
          }
        } : undefined,
        company: company?.id ? {
          connect: {
            id: company.id
          }
        } : undefined,
        bankAccounts: bankAccounts as any,
        ...(data.purchaseAgreements?.length ? {
          purchaseAgreements: {
            create: data.purchaseAgreements.map((b: any) => ({
              group: b.group,
              discount1: Number(b.discount1) || 0,
              discount2: Number(b.discount2) || 0,
              discount3: Number(b.discount3) || 0,
              addition: Number(b.addition) || 0,
              startDate: b.startDate ? new Date(b.startDate) : null,
              endDate: b.endDate ? new Date(b.endDate) : null,
              season: b.season,
              branch: b.branch
            }))
          }
        } : {}),
        ...(data.saleAgreements?.length ? {
          saleAgreements: {
            create: data.saleAgreements.map((b: any) => ({
              group: b.group,
              discount1: Number(b.discount1) || 0,
              discount2: Number(b.discount2) || 0,
              discount3: Number(b.discount3) || 0,
              addition: Number(b.addition) || 0,
              startDate: b.startDate ? new Date(b.startDate) : null,
              endDate: b.endDate ? new Date(b.endDate) : null,
              season: b.season,
              branch: b.branch
            }))
          }
        } : {}),
        createdById: session.userId,
        updatedById: session.userId
      } as any
    });
    await logAuditAction({
      action: 'create',
      model: 'partner',
      recordId: partner.id,
      recordName: cleanData.name || '',
      newValues: { name: cleanData.name, isCustomer: cleanData.isCustomer, isVendor: cleanData.isVendor },
    });

    revalidatePath('/[locale]/contacts');
    return {
      id: partner.id
    };
  } catch (dbError: any) {
    console.error("Database Create Error:", dbError);
    return {
      error: 'حدث خطأ في قاعدة البيانات أثناء الحفظ: ' + (dbError.message || 'خطأ غير معروف')
    };
  }
}
export async function searchTags(query: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("partner", "read");
  return prisma.partnerTag.findMany({
    where: {
      name: {
        contains: query
      }
    },
    take: 5
  });
}
export async function createTag(name: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('partner', 'create');
  return prisma.partnerTag.create({
    data: {
      name
    }
  });
}

export async function deletePartner(id: string) {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };
  await ensureAccess('partner', 'write');

  // Safety: Check for linked records
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          saleOrders: true,
          purchaseOrders: true,
          invoices: true,
        }
      }
    }
  });

  if (!partner) return { error: "جهة الاتصال غير موجودة" };

  if (partner._count.saleOrders > 0 || partner._count.purchaseOrders > 0 || partner._count.invoices > 0) {
    return {
      error: `لا يمكن حذف جهة الاتصال "${partner.name}" لأنها مرتبطة بـ ${partner._count.saleOrders} أمر بيع و ${partner._count.purchaseOrders} أمر شراء و ${partner._count.invoices} فاتورة. يمكنك أرشفتها بدلاً من ذلك.`
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.resPartnerBank.deleteMany({ where: { partnerId: id } });
      await tx.purchaseAgreement.deleteMany({ where: { partnerId: id } }).catch(() => {});
      await tx.saleAgreement.deleteMany({ where: { partnerId: id } }).catch(() => {});
      await tx.partner.delete({ where: { id } });
    });

    await logAuditAction({
      action: 'delete',
      model: 'partner',
      recordId: id,
      recordName: partner.name,
      oldValues: { name: partner.name },
    });

    revalidatePath('/[locale]/contacts');
    return { success: true };
  } catch (dbError: any) {
    console.error("Delete Partner Error:", dbError);
    return { error: "حدث خطأ أثناء الحذف: " + (dbError.message || "خطأ غير معروف") };
  }
}

export async function duplicatePartner(id: string) {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };
  await ensureAccess('partner', 'create');

  const partner = await prisma.partner.findUnique({
    where: { id },
  });

  if (!partner) return { error: "جهة الاتصال غير موجودة" };

  const company = await prisma.company.findFirst();

  try {
    const newPartner = await prisma.partner.create({
      data: {
        name: `${partner.name} (نسخة)`,
        type: partner.type,
        email: partner.email,
        phone: partner.phone ? partner.phone + '_copy' : null,
        mobile: partner.mobile,
        website: partner.website,
        vat: partner.vat,
        street: partner.street,
        street2: partner.street2,
        city: partner.city,
        zip: partner.zip,
        country: partner.country,
        isCustomer: partner.isCustomer,
        isVendor: partner.isVendor,
        customerType: partner.customerType,
        ref: partner.ref,
        lang: partner.lang,
        companyId: partner.companyId || company?.id,
        createdById: session.userId,
        updatedById: session.userId,
      }
    });

    await logAuditAction({
      action: 'create',
      model: 'partner',
      recordId: newPartner.id,
      recordName: newPartner.name,
      newValues: { name: newPartner.name, duplicatedFrom: id },
    });

    revalidatePath('/[locale]/contacts');
    return { success: true, id: newPartner.id };
  } catch (dbError: any) {
    console.error("Duplicate Partner Error:", dbError);
    return { error: "حدث خطأ أثناء إنشاء النسخة: " + (dbError.message || "خطأ غير معروف") };
  }
}

export async function archivePartner(id: string) {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };
  await ensureAccess('partner', 'write');

  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) return { error: "جهة الاتصال غير موجودة" };

  try {
    const newActive = !partner.active;
    await prisma.partner.update({
      where: { id },
      data: { active: newActive }
    });

    await logAuditAction({
      action: 'update',
      model: 'partner',
      recordId: id,
      recordName: partner.name,
      oldValues: { active: partner.active },
      newValues: { active: newActive },
    });

    revalidatePath('/[locale]/contacts');
    revalidatePath(`/[locale]/contacts/${id}`);
    return { success: true, active: newActive };
  } catch (dbError: any) {
    console.error("Archive Partner Error:", dbError);
    return { error: "حدث خطأ أثناء الأرشفة: " + (dbError.message || "خطأ غير معروف") };
  }
}