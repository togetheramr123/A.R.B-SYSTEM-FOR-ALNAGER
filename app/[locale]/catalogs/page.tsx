import { getCatalogs } from "@/app/actions/catalogs";
import CatalogsClient from "./CatalogsClient";
export default async function CatalogsPage() {
  const catalogs = await getCatalogs();
  /* Serialize dates */
  const serialized = catalogs.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString()
  }));
  return <CatalogsClient initialCatalogs={serialized} />;
}