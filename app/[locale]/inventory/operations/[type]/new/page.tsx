import { useTranslations } from 'next-intl';
import { StockOperationForm } from '@/components/inventory/StockOperationForm';
type Props = {
  params: Promise<{
    type: string;
  }>;
};
export default async function NewOperationPage(props: Props) {
  const {
    type
  } = await props.params;
  const t = useTranslations('Inventory');
  const getUnlocalizedTitle = () => {
    switch (type) {
      case 'receipts':
        return 'receipts';
      case 'deliveries':
        return 'deliveries';
      default:
        return 'operations';
    }
  };
  return <div className="max-w-5xl mx-auto space-y-6"> <div className="flex items-center gap-2 text-sm text-slate-500 mb-4"> <span>{t('operations')}</span> <span>/</span> <span>{t(getUnlocalizedTitle())}</span> <span>/</span> <span className="font-bold text-slate-800">New</span> </div> <StockOperationForm type={type} /> </div>;
}