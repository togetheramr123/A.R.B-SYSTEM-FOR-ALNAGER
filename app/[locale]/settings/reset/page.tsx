import ResetClient from './ResetClient';

export const metadata = {
  title: 'تصفير بيانات المنتجات والمخزون',
};

export default function ResetPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">تصفير بيانات المنتجات والمخزون</h1>
        <p className="text-slate-500 mt-1">
          استخدم هذه الأداة لحذف جميع بيانات المنتجات والكميات والفئات وإعادة النظام للوضع الافتراضي.
        </p>
      </div>
      <ResetClient />
    </div>
  );
}
