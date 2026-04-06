import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useStore();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-surface border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/app" className="flex items-center gap-2">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-xl font-bold text-text">LungAI</span>
            </Link>

            <div className="hidden md:flex gap-6">
              <NavItem path="/app/dashboard" label="Dashboard" isActive={isActive('/app/dashboard')} />
              <NavItem path="/app/patients" label="Patients" isActive={isActive('/app/patients')} />
              <NavItem path="/app/studies" label="Studies" isActive={isActive('/app/studies')} />
              <NavItem path="/app/reports" label="Reports" isActive={isActive('/app/reports')} />
              <NavItem path="/app/settings" label="Settings" isActive={isActive('/app/settings')} />
              <NavItem path="/pricing" label="Pricing" isActive={isActive('/pricing')} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-text">{user?.fullName}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.fullName?.charAt(0) || 'A'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavItemProps {
  path: string;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ path, label, isActive }) => (
  <Link
    to={path}
    className={`px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'text-primary border-b-2 border-primary'
        : 'text-text-secondary hover:text-text'
    }`}
  >
    {label}
  </Link>
);

export default Navbar;
