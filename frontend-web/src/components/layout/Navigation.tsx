// frontend-web/src/components/layout/Navigation.tsx
import { NavItem } from "../../types/dashboard";

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  navItems: NavItem[];
}

export default function Navigation({ activeView, onViewChange, navItems }: NavigationProps) {
  return (
    <nav className="bg-white border-b px-6 py-3 overflow-x-auto">
      <div className="flex gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${
                activeView === item.id
                  ? 'bg-blue-900 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}