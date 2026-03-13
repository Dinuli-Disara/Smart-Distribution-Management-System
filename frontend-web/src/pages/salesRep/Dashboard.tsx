// frontend-web/src/pages/sales/Dashboard.tsx
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Home, Users, ShoppingCart, Package, RotateCcw, User } from "lucide-react";
import SalesDashboardView from "./DashboardView";
import CustomersView from "./CustomersView";
import OrdersView from "./OrdersView";
import StockView from "./StockView";
import ReturnsView from "./ReturnsView";
import ProfileView from "./ProfileView";

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'profile', label: 'Profile', icon: User },
];

const views = {
  home: SalesDashboardView,
  customers: CustomersView,
  orders: OrdersView,
  stock: StockView,
  returns: ReturnsView,
  profile: ProfileView,
};

export default function SalesRepDashboard() {
  return <DashboardLayout navItems={navItems} views={views} defaultView="home" />;
}