"use server";
import { ensureAccess } from '@/lib/access';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCompanyId } from '@/lib/getCompanyId';
export async function getAllDepartments() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read");

  return await prisma.department.findMany({
    include: {
      employees: true,
      _count: {
        select: {
          employees: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}
export async function getDepartment(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read");

  return await prisma.department.findUnique({
    where: {
      id
    },
    include: {
      employees: {
        include: {
          contracts: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      }
    }
  });
}
export async function createDepartment(data: {
  name: string;
  managerId?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  const dept = await prisma.department.create({
    data: {
      name: data.name,
      managerId: data.managerId || null
    }
  });
  revalidatePath('/hr/departments');
  return dept;
}
export async function getAllEmployees() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read");

  return await prisma.employee.findMany({
    include: {
      department: true,
      contracts: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}
export async function getEmployee(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read");

  return await prisma.employee.findUnique({
    where: {
      id
    },
    include: {
      department: true,
      contracts: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      payslips: {
        orderBy: {
          dateTo: 'desc'
        },
        include: {
          journalEntry: true
        }
      }
    }
  });
}
export async function createEmployee(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  const employee = await prisma.employee.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      jobTitle: data.jobTitle || null,
      departmentId: data.departmentId || null
    }
  });
  if (data.wage) {
    await prisma.contract.create({
      data: {
        name: `عقد - ${data.name}`,
        employeeId: employee.id,
        wage: parseFloat(data.wage),
        startDate: new Date(),
        state: 'open'
      }
    });
  }
  revalidatePath('/hr/employees');
  return employee;
}
export async function updateEmployee(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  const employee = await prisma.employee.update({
    where: {
      id
    },
    data: {
      name: data.name || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      jobTitle: data.jobTitle || undefined,
      departmentId: data.departmentId || undefined
    }
  });
  revalidatePath(`/hr/employees/${id}`);
  revalidatePath('/hr/employees');
  return employee;
}
export async function getAllContracts() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read");

  return await prisma.contract.findMany({
    include: {
      employee: {
        include: {
          department: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
export async function createContract(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  const contract = await prisma.contract.create({
    data: {
      name: data.name || `عقد - ${data.employeeName}`,
      employeeId: data.employeeId,
      wage: parseFloat(data.wage),
      startDate: new Date(data.startDate || Date.now()),
      endDate: data.endDate ? new Date(data.endDate) : null,
      state: 'open'
    }
  });
  revalidatePath('/hr/contracts');
  revalidatePath(`/hr/employees/${data.employeeId}`);
  return contract;
}
export async function getAllPayslips() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read");

  return await prisma.payslip.findMany({
    include: {
      employee: {
        include: {
          department: true
        }
      },
      journalEntry: true
    },
    orderBy: {
      dateTo: 'desc'
    }
  });
}
export async function createPayslip(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  const start = new Date(data.dateFrom);
  const end = new Date(data.dateTo);
  const contract = await prisma.contract.findFirst({
    where: {
      employeeId: data.employeeId,
      state: 'open'
    }
  });
  const wage = contract ? Number(contract.wage) : 0;
  const employee = await prisma.employee.findUnique({
    where: {
      id: data.employeeId
    }
  });
  return await prisma.payslip.create({
    data: {
      name: `كشف راتب - ${employee?.name || ''} - ${start.toLocaleDateString('ar-EG', {
        month: 'short',
        year: 'numeric'
      })}`,
      employeeId: data.employeeId,
      dateFrom: start,
      dateTo: end,
      basicWage: wage,
      gross: wage,
      net: wage,
      state: 'draft'
    }
  });
}
export async function confirmPayslip(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  const payslip = await prisma.payslip.findUnique({
    where: {
      id
    },
    include: {
      employee: true
    }
  });
  if (!payslip || payslip.state !== 'draft') return;
  const companyId = await getCompanyId();
  const expenseAccount = await prisma.account.upsert({
    where: {
      code_companyId: { code: '600001', companyId }
    },
    update: {},
    create: {
      code: '600001',
      name: 'مصروفات الرواتب',
      type: 'expense',
      companyId
    }
  });
  const payableAccount = await prisma.account.upsert({
    where: {
      code_companyId: { code: '200002', companyId }
    },
    update: {},
    create: {
      code: '200002',
      name: 'الرواتب المستحقة',
      type: 'payable',
      companyId
    }
  });
  let journal = await prisma.journal.findFirst({
    where: {
      code: 'MISC'
    }
  });
  if (!journal) {
    journal = await prisma.journal.create({
      data: {
        code: 'MISC',
        name: 'عمليات متنوعة',
        type: 'general',
        companyId
      }
    });
  }
  const entry = await prisma.journalEntry.create({
    data: {
      name: `SAL/${payslip.name}`,
      date: new Date(),
      journalId: journal.id,
      ref: payslip.name,
      state: 'posted',
      items: {
        create: [{
          accountId: expenseAccount.id,
          name: `مصروف راتب - ${payslip.employee.name}`,
          debit: payslip.gross,
          credit: 0
        }, {
          accountId: payableAccount.id,
          name: `راتب مستحق - ${payslip.employee.name}`,
          debit: 0,
          credit: payslip.net
        }]
      }
    }
  });
  await prisma.payslip.update({
    where: {
      id
    },
    data: {
      state: 'done',
      journalEntryId: entry.id
    }
  });
  revalidatePath('/hr/payslips');
}
export async function getHRStats() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read");

  const [employeeCount, departmentCount, activeContractsCount, payslipCount, totalWages] = await Promise.all([prisma.employee.count(), prisma.department.count(), prisma.contract.count({
    where: {
      state: 'open'
    }
  }), prisma.payslip.count(), prisma.contract.aggregate({
    _sum: {
      wage: true
    },
    where: {
      state: 'open'
    }
  })]);
  return {
    employeeCount,
    departmentCount,
    activeContractsCount,
    payslipCount,
    totalWages: Number(totalWages._sum.wage || 0)
  };
}