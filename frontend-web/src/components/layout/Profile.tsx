// frontend-web/src/components/layout/Profile.tsx
import { useState, useEffect } from "react";
import { X, User, ShieldCheck, Key, LogOut } from "lucide-react";
import authService, { ProfileData } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function Profile({ isOpen, onClose, onLogout }: ProfileProps) {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phone: "",
    username: "",
    role: "",
    employee_id: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user && isOpen) {
      loadUserProfile();
    }
  }, [user, isOpen]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      console.log('Loading user profile, isOpen:', isOpen, 'user:', user);

      // Always try to get fresh data from API first
      try {
        console.log('Fetching profile from API...');
        const profileData = await authService.getProfile();
        console.log('Profile data from API:', profileData);
        setFormData(profileData);
      } catch (apiError) {
        console.error('API error, falling back to user data:', apiError);

        // If API fails, use existing user data from context
        if (user) {
          console.log('Using context user data:', user);
          const nameParts = user.name?.split(' ') || [];
          const fallbackData = {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            name: user.name || '',
            email: user.email || '',
            phone: user.contact || '',
            username: user.username || '',
            role: user.role || '',
            employee_id: user.employee_id || 0
          };
          console.log('Fallback data:', fallbackData);
          setFormData(fallbackData);
        } else {
          setMessage({ type: 'error', text: 'No user data available' });
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      const updatedProfile = await authService.updateProfile(formData);

      // Update the user in context
      updateUser({
        name: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
        email: updatedProfile.email,
        username: updatedProfile.username,
        contact: updatedProfile.phone
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });

      // Update form data with response
      setFormData(updatedProfile);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setIsChangingPassword(true);
      setMessage(null);

      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleVerifyPhone = () => {
    // TODO: Implement phone verification
    setMessage({ type: 'success', text: 'Verification feature coming soon!' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
            {message.text}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            </div>
          ) : (
            <>
              {/* Profile Picture & Greeting */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                  <User className="w-10 h-10 text-blue-900" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Hi, {formData.firstName || "User"}!
                </h3>
              </div>

              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                  />
                </div>

                {/* Role (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                    />
                    <button
                      onClick={handleVerifyPhone}
                      className="px-4 py-2 bg-blue-50 text-blue-900 text-sm font-medium rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Verify
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                  />
                </div>

                {/* Save Changes Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>

              <hr className="border-gray-200" />

              {/* Password Change & Logout */}
              <div className="space-y-3 pb-6">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
                >
                  <Key className="w-5 h-5 text-gray-500" />
                  Change Password
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition text-red-700 font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Change Password</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex-1 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}