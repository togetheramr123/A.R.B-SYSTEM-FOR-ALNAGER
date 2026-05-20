'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOCRRules() {
  try {
    return await prisma.oCRMappingRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Failed to fetch OCR rules:", error);
    return [];
  }
}

export async function createOCRRule(data: { keyword: string; productIds: string; defaultUom?: string }) {
  try {
    // Check if keyword already exists
    const existing = await prisma.oCRMappingRule.findUnique({
      where: { keyword: data.keyword }
    });
    if (existing) {
      return { success: false, error: "الكلمة المفتاحية موجودة مسبقاً" };
    }

    const rule = await prisma.oCRMappingRule.create({
      data: {
        keyword: data.keyword,
        productIds: data.productIds,
        defaultUom: data.defaultUom || "Units"
      }
    });
    revalidatePath("/settings/ocr-mapping");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Failed to create OCR rule:", error);
    return { success: false, error: error.message };
  }
}

export async function updateOCRRule(id: string, data: { keyword: string; productIds: string; defaultUom?: string }) {
  try {
    const rule = await prisma.oCRMappingRule.update({
      where: { id },
      data: {
        keyword: data.keyword,
        productIds: data.productIds,
        defaultUom: data.defaultUom || "Units"
      }
    });
    revalidatePath("/settings/ocr-mapping");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Failed to update OCR rule:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteOCRRule(id: string) {
  try {
    await prisma.oCRMappingRule.delete({
      where: { id }
    });
    revalidatePath("/settings/ocr-mapping");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete OCR rule:", error);
    return { success: false, error: error.message };
  }
}

// Extract English digits or Arabic-Indic digits, and look for secondary ratio
function extractQuantityAndRatio(line: string): { quantity: number, ratio: number | null } {
  // Convert Arabic-Indic digits to regular digits
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  let normalizedLine = line;
  for (let i = 0; i < 10; i++) {
    normalizedLine = normalizedLine.split(arabicDigits[i]).join(i.toString());
  }
  
  let ratio: number | null = null;
  // Match keywords followed by a number
  const ratioRegex = /(?:كرتونه|كرتونة|طرد|باكت|شده|شدة|علبه|علبة|شوال|كيس|دسته|دستة)\s*(\d+)/i;
  const ratioMatch = normalizedLine.match(ratioRegex);
  
  if (ratioMatch && ratioMatch[1]) {
    ratio = parseInt(ratioMatch[1], 10);
    // Remove the ratio number so it's not parsed as the primary quantity
    normalizedLine = normalizedLine.replace(ratioMatch[0], ratioMatch[0].replace(ratioMatch[1], ''));
  }

  const match = normalizedLine.match(/\d+/);
  const quantity = match ? parseInt(match[0], 10) : 1;
  
  return { quantity, ratio };
}

export async function matchOCRText(ocrText: string) {
  try {
    const rules = await prisma.oCRMappingRule.findMany();
    const products = await prisma.product.findMany();
    
    const lines = ocrText.split('\n').filter(line => line.trim().length > 0);
    
    const results = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const matchedRules = rules.filter(r => line.includes(r.keyword));
      if (matchedRules.length > 0) {
        // Collect all suggested product IDs from matching rules
        const suggestedProductIds = new Set<string>();
        let defaultUom = "Units";
        let isIgnored = false;
        
        matchedRules.forEach(r => {
          if (r.defaultUom) defaultUom = r.defaultUom;
          if (r.productIds === 'IGNORE') {
            isIgnored = true;
          } else {
            r.productIds.split(',').filter(Boolean).forEach(id => suggestedProductIds.add(id));
          }
        });

        const { quantity: qty, ratio } = extractQuantityAndRatio(line);

        if (isIgnored) {
          results.push({
            originalText: line,
            quantity: qty,
            ratio: ratio,
            uom: defaultUom,
            suggestedProducts: [],
            isIgnored: true,
            matchedRuleId: matchedRules[0]?.id,
            matchedKeyword: matchedRules[0]?.keyword,
            lineIndex: lineIdx
          });
        } else {
          const suggestedProducts = products.filter(p => suggestedProductIds.has(p.id));
          
          results.push({
            originalText: line,
            quantity: qty,
            ratio: ratio,
            uom: defaultUom,
            suggestedProducts: suggestedProducts.map(p => ({
              id: p.id,
              name: p.name,
              uom: p.uom,
              price: 0
            })),
            matchedRuleId: matchedRules[0]?.id,
            matchedKeyword: matchedRules[0]?.keyword,
            lineIndex: lineIdx
          });
        }
      } else {
        const { quantity: qty, ratio } = extractQuantityAndRatio(line);
        // If no rule matches, still return the line so user can see it failed to map
        results.push({
          originalText: line,
          quantity: qty,
          ratio: ratio,
          uom: "Units",
          suggestedProducts: [],
          matchedRuleId: null,
          matchedKeyword: null,
          lineIndex: lineIdx
        });
      }
    }

    return { success: true, results };
  } catch (error: any) {
    console.error("Failed to match OCR text:", error);
    return { success: false, error: error.message };
  }
}

