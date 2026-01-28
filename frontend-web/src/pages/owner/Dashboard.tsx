// frontend-web/src/pages/owner/Dashboard.tsx
import DashboardLayout from "../../components/layout/DashboardLayout";
import { BarChart3, Users, Package, Truck, FileText } from "lucide-react";
import DashboardView from "./DashboardView";
import EmployeesView from "./EmployeesView";
import InventoryView from "./InventoryView";
import VansRoutesView from "./VanRoutesView";
import { ReportsView } from "./ReportsView";

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'vans', label: 'Vans & Routes', icon: Truck },
  { id: 'reports', label: 'Reports', icon: FileText },
];

const views = {
  dashboard: DashboardView,
  employees: EmployeesView,
  inventory: InventoryView,
  vans: VansRoutesView,
  reports: () => <ReportsView onNavigate={() => {}} />,
};

export default function OwnerDashboard() {
  return <DashboardLayout navItems={navItems} views={views} defaultView="dashboard" />;
}
