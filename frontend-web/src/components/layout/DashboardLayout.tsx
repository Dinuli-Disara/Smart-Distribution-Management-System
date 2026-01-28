// frontend-web/src/components/layout/DashboardLayout.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "./Header";
import Navigation from "./Navigation";
import { NavItem, ViewConfig } from "../../types/dashboard";

interface DashboardLayoutProps {
  navItems: NavItem[];
  views: ViewConfig;
  defaultView: string;
}

export default function DashboardLayout({ navItems, views, defaultView }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(defaultView);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ViewComponent = views[activeView] || views[defaultView];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <Navigation 
        activeView={activeView} 
        onViewChange={setActiveView}
        navItems={navItems}
      />
      
      <main className="p-6 max-w-[1400px] mx-auto">
        <ViewComponent />
      </main>
    </div>
  );
}