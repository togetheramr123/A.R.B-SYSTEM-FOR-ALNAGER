import { getOCRRules } from "@/app/actions/ocrMapping";
import { getAllProducts } from "@/app/actions/inventory";
import OCRMappingClient from "./OCRMappingClient";

export default async function OCRMappingPage() {
  const rules = await getOCRRules();
  const products = await getAllProducts();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">إعدادات التعرف على الصور (OCR)</h1>
        <p className="text-sm text-slate-500 mt-1">
          قم بتحديد الكلمات المفتاحية التي يقرأها النظام من الصورة، واربطها بالمنتجات الحقيقية الموجودة في النظام.
        </p>
      </div>
      
      <OCRMappingClient initialRules={rules} products={products} />
    </div>
  );
}
