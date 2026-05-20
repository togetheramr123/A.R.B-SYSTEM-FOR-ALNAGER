"use server";
import { ensureAccess } from '@/lib/access';

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export async function getAttributes() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  try {
    const attributes = await prisma.attribute.findMany({
      include: {
        values: true
      },
      orderBy: {
        name: "asc"
      }
    });
    return attributes;
  } catch (e) {
    console.error(e);
    return [];
  }
}
export async function createAttribute(name: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const attribute = await prisma.attribute.create({
      data: {
        name
      }
    });
    return attribute;
  } catch (e) {
    console.error("Failed to create attribute", e);
    throw e;
  }
}
export async function createAttributeValue(attributeId: string, value: string, color?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const attrValue = await prisma.attributeValue.create({
      data: {
        name: value,
        attributeId,
        color
      }
    });
    return attrValue;
  } catch (e) {
    console.error("Failed to create attribute value", e);
    throw e;
  }
}