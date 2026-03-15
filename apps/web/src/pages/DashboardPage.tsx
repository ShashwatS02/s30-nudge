import { useOutletContext } from "react-router-dom";
import type { AppShellContext } from "../layouts/AppLayout";
import AppDashboard from "../sections/AppDashboard";

export default function DashboardPage() {
  const { searchQuery, newItemRequest } = useOutletContext<AppShellContext>();

  return <AppDashboard searchQuery={searchQuery} newItemRequest={newItemRequest} />;
}
