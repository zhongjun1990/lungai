import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-surface border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
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
              <span className="text-xl font-bold text-text">Medical AI</span>
            </Link>

            <div className="hidden md:flex gap-6">
              <NavItem path="/dashboard" label="Dashboard" isActive={isActive('/dashboard')} />
              <NavItem path="/patients" label="Patients" isActive={isActive('/patients')} />
              <NavItem path="/studies" label="Studies" isActive={isActive('/studies')} />
              <NavItem path="/reports" label="Reports" isActive={isActive('/reports')} />
              <NavItem path="/settings" label="Settings" isActive={isActive('/settings')} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">A</span>
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
