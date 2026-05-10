import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wallet,
  Calendar, Settings, LogOut
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/members', icon: Users, label: 'Membres' },
  { to: '/tontines', icon: Wallet, label: 'Tontines' },
  { to: '/seances', icon: Calendar, label: 'Séances' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar() {
  const { membre, logout } = useAuthStore();

  return (
    <div className="w-52 min-h-screen bg-[#161b27] border-r border-[#2e3a50] flex flex-col">

      {/* Logo */}
      <div className="p-5 border-b border-[#2e3a50]">
        <h1 className="text-lg font-bold text-white">Digi-Réunion</h1>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          v1.0
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition
              ${isActive
                ? 'bg-blue-900/40 text-blue-400 border border-blue-800/30'
                : 'text-gray-400 hover:bg-[#1e2535] hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Profil + Déconnexion */}
      <div className="p-3 border-t border-[#2e3a50]">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-white truncate">
            {membre?.nom}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {membre?.role}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 w-full transition"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}