// src/components/common/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) return null;
  
  const isActive = (path: string) => location.pathname.startsWith(path);
  
  const therapistLinks = [
    { to: '/therapist', label: 'Dashboard', icon: '📊' },
    { to: '/therapist/clients', label: 'Clients', icon: '👥' },
    { to: '/therapist/sessions', label: 'Sessions', icon: '🗓️' },
    { to: '/therapist/tools', label: 'EMDR Tools', icon: '🧰' },
    { to: '/therapist/profile', label: 'Profile', icon: '👤' },
  ];
  
  const clientLinks = [
    { to: '/client', label: 'Dashboard', icon: '📊' },
    { to: '/client/sessions', label: 'My Sessions', icon: '🗓️' },
    { to: '/client/resources', label: 'Resources', icon: '📚' },
    { to: '/client/profile', label: 'Profile', icon: '👤' },
  ];
  
  const links = user.role === Role.CLIENT ? clientLinks : therapistLinks;
  
  return (
    <div className="h-full bg-gray-800 text-white w-64 px-4 py-6 flex flex-col">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-500 mx-auto flex items-center justify-center text-2xl font-bold">
          {user.firstName?.[0] || user.email[0].toUpperCase()}
        </div>
        <div className="mt-2 font-medium">{user.firstName || user.email}</div>
        <div className="text-sm text-gray-400">{user.role}</div>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`flex items-center p-3 rounded-md transition-colors ${
                  isActive(link.to)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="pt-4 mt-auto border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-2">HIPAA Compliant</div>
        <div className="text-xs text-gray-500">
          © {new Date().getFullYear()} EMDR Platform
        </div>
      </div>
    </div>
  );
};

export default Sidebar;