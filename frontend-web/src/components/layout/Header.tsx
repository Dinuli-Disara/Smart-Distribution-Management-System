// frontend-web/src/components/layout/Header.tsx
import { Bell, LogOut } from "lucide-react";

interface HeaderProps {
  user: any;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900 mb-0">Manjula Marketing DMS</h1>
            <p className="text-sm text-gray-600">Good Morning, {user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}