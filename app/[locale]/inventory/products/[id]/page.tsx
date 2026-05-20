import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ProductForm } from '@/components/inventory/ProductForm';
export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
export default async function ProductDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const product = await prisma.product.findUnique({
    where: {
      id: id
    },
    include: {
      stockQuants: {
        include: {
          location: {
            include: {
              warehouse: true
            }
          }
        }
      },
      category: true,
      tags: true,
      variantValues: true,
      boms: {
        include: {
          lines: {
            include: {
              component: true
            }
          }
        }
      },
      supplierInfo: {
        include: {
          partner: true
        }
      },
      attributeLines: {
        include: {
          values: true
        }
      },
      messages: {
        include: {
          trackingValues: true,
          author: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
  if (!product) {
    notFound();
  }
  const serializedProduct = JSON.parse(JSON.stringify(product, (key, value) => {
    if (value !== null && typeof value === 'object' && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    return value;
  }));
  const session = await getSession();
  const userRole = session?.role || 'USER';
  const canViewCost = session?.canViewCost ?? true;
  return <ProductForm key={product.id} initialData={serializedProduct} userRole={userRole} canViewCost={canViewCost} />;
}