// frontend-web/src/components/layout/Header.tsx
import { Bell, User, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom"; // Import Link for navigation
import Profile from "./Profile";

interface HeaderProps {
  // We can strongly type this later, but keeping 'any' for now to match your code
  user: any;
  onOpenProfile: () => void; // Function to open the profile sidebar
}

export default function Header({ user, onOpenProfile }: HeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">

        {/* Left Side: Logo & Greeting */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900 mb-0">Manjula Marketing DMS</h1>
            <p className="text-sm text-gray-600">Good Morning, {user?.name}</p>
          </div>
        </div>

        {/* Right Side: Navigation Actions */}
        <div className="flex items-center gap-4">

          {/* Notification Link */}
          <Link
            to="/notifications"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition block"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {/* Keeping the red dot indicator */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Link>

          {/* Profile Link */}
          <button
            onClick={onOpenProfile} // We pass this prop into the Header
            className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
          >
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium">Profile</span>
          </button>

          {/* Messages Link */}
          <Link
            to="/messages"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition block"
          >
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium"></span>
          </Link>

        </div>
      </div>
    </header>
  );
}