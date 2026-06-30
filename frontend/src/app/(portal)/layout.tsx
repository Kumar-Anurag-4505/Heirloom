'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Shield, 
  LayoutDashboard, 
  Database, 
  Users, 
  Sliders, 
  LogOut, 
  Activity, 
  User as UserIcon,
  Bell,
  ShieldAlert
} from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
    { name: 'Asset Vault', href: '/portal/assets', icon: Database },
    { name: 'Emergency Contacts', href: '/portal/contacts', icon: Users },
    { name: 'Policy Builder', href: '/portal/policies', icon: Sliders },
    { name: 'Emergency Requests', href: '/portal/requests', icon: ShieldAlert },
  ];

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/v1/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      router.push('/');
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-blue-600/30">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-neutral-950 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand Logo Container */}
          <div className="h-16 border-b border-white/5 px-6 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-md font-bold tracking-tight text-white">Heirloom</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;



              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
                      : 'text-neutral-400 hover:text-white hover:bg-white/2px'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Session Details Bottom Card */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-900/30 border border-blue-500/20 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Rahul Sharma</p>
              <p className="text-[10px] text-neutral-500 truncate">rahul@heirloom.io</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-white/5 hover:bg-red-950/20 hover:border-red-500/30 text-xs font-semibold text-neutral-400 hover:text-red-400 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main View Shell */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-white/5 bg-neutral-950 px-8 flex items-center justify-between flex-shrink-0">
          <div className="text-sm font-semibold text-white tracking-tight">
            Owner Portal
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Developer Console Shortcut */}
            <Link
              href="/developer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-950/30 rounded-md border border-blue-500/20 hover:bg-blue-900/20 transition-all"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Developer Telemetry
            </Link>

            {/* Notification Bell */}
            <button className="p-2 rounded-lg border border-white/5 text-neutral-400 hover:text-white transition-all hover:bg-white/2px">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-grow overflow-y-auto bg-black p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
