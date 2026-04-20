// frontend-web/src/pages/clerk/Dashboard.tsx
import DashboardLayout from "../../components/layout/DashboardLayout";
import { BarChart3, Package, DollarSign, FileText, Truck } from "lucide-react";
import ClerkDashboardView from "./DashboardView";
import InventoryView from "./InventoryView";
import PaymentsView from "./PaymentsView";
import InvoicesView from "./InvoicesView";
import {ReportsView} from "./ReportsView";
import RoutesView from "./InvoicesView";
import RoutePlanner from "./InvoicesView";

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  //{ id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'routes', label: 'Routes', icon: Truck },
  { id: 'reports', label: 'Reports', icon: FileText },
];

const views = {
  dashboard: ClerkDashboardView,
  inventory: InventoryView,
  payments: PaymentsView,
  routes: RoutePlanner,
  reports: () => <ReportsView onNavigate={() => {}} />,
};

export default function ClerkDashboard() {
  return <DashboardLayout navItems={navItems} views={views} defaultView="dashboard" />;
}
