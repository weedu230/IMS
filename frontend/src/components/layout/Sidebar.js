import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, Tags, Truck, Warehouse,
  BarChart3, ShoppingCart, ClipboardList, Users,
  LogOut, Menu, X, TrendingUp, ChevronRight, History, GitBranch,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',        label: 'Dashboard',        icon: LayoutDashboard, roles: ['admin','manager','staff','viewer'] },
  { to: '/products',         label: 'Products',         icon: Package,         roles: ['admin','manager','staff','viewer'] },
  { to: '/categories',       label: 'Categories',       icon: Tags,            roles: ['admin','manager'] },
  { to: '/suppliers',        label: 'Suppliers',        icon: Truck,           roles: ['admin','manager'] },
  { to: '/warehouses',       label: 'Warehouses',       icon: Warehouse,       roles: ['admin','manager'] },
  { to: '/stock',            label: 'Stock',            icon: BarChart3,       roles: ['admin','manager','staff','viewer'] },
  { to: '/purchase-orders',  label: 'Purchase Orders',  icon: ClipboardList,   roles: ['admin','manager','staff'] },
  { to: '/orders',           label: 'Sales Orders',     icon: ShoppingCart,    roles: ['admin','manager','staff'] },
  { to: '/reports',          label: 'Reports',          icon: TrendingUp,      roles: ['admin','manager','viewer'] },
  { to: '/architecture-uml', label: 'Reverse UML',      icon: GitBranch,       roles: ['admin','manager'] },
  { to: '/audit-logs',       label: 'Audit Logs',       icon: History,         roles: ['admin'] },
  { to: '/employees',        label: 'Employees',        icon: Users,           roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = NAV.filter(n => hasRole(...n.roles));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-indigo-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Package size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">IMS Pro</p>
            <p className="text-indigo-300 text-xs">Inventory System</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-indigo-700 mx-2 mt-2 rounded-lg bg-indigo-700/40">
        <p className="text-white text-sm font-medium truncate">{user?.name}</p>
        <p className="text-indigo-300 text-xs capitalize">{user?.role}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
               ${isActive
                 ? 'bg-white text-indigo-700 shadow-sm'
                 : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'}`
            }>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-indigo-700">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-indigo-200 hover:text-white hover:bg-indigo-700 rounded-lg transition-all">
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-indigo-800 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile burger */}
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-indigo-800 text-white rounded-lg shadow-lg">
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-indigo-800 z-50 lg:hidden">
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-indigo-300 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
