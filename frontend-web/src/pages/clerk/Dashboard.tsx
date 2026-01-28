// frontend-web/src/pages/clerk/Dashboard.tsx
import DashboardLayout from "../../components/layout/DashboardLayout";
import { BarChart3, Package, DollarSign, FileText, Bell } from "lucide-react";
import ClerkDashboardView from "./DashboardView";
import InventoryView from "./InventoryView";
import PaymentsView from "./PaymentsView";
import InvoicesView from "./InvoicesView";
import {ReportsView} from "./ReportsView";

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'reports', label: 'Reports', icon: FileText },
];

const views = {
  dashboard: ClerkDashboardView,
  inventory: InventoryView,
  payments: PaymentsView,
  invoices: InvoicesView,
  reports: () => <ReportsView onNavigate={() => {}} />,
};

export default function ClerkDashboard() {
  return <DashboardLayout navItems={navItems} views={views} defaultView="dashboard" />;
}
