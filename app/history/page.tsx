import { getWeeklyPlansAction } from "@/app/actions/menu-actions";
import { HistoryClient } from "@/components/HistoryClient";

export default async function HistoryPage() {
  const result = await getWeeklyPlansAction();

  if (!result.success) {
    return <div>Errore: {result.error}</div>;
  }

  const plans = result.plans || [];

  return <HistoryClient initialPlans={plans} />;
}
