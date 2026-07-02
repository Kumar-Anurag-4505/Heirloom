'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  ShieldAlert,
  FolderLock,
  Clock,
  UserCheck,
  History,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/trusted-connections/notifications');
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchNotifications();
      // Poll notifications every 10 seconds for real-time legacy updates
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user, isLoading, router]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.put(`/trusted-connections/notifications/${id}/read`);
      if (res.success) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mySpaceItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Assets', href: '/assets', icon: Database },
    { name: 'Emergency Contacts', href: '/contacts', icon: Users },
    { name: 'Financial Nominees', href: '/nominees', icon: UserIcon },
    { name: 'Policy Builder', href: '/policies', icon: Sliders },
    { name: 'Emergency Requests', href: '/requests', icon: ShieldAlert },
  ];

  const trustedAccessItems = [
    { name: 'Shared Assets', href: '/shared-assets', icon: FolderLock },
    { name: 'My Access Requests', href: '/my-requests', icon: Clock },
    { name: 'Trusted Connections', href: '/trusted-connections', icon: UserCheck },
    { name: 'Access History', href: '/access-history', icon: History },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen bg-black items-center justify-center text-neutral-500 space-y-3 flex-col">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-mono">Verifying credentials session scopes...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-blue-600/30">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-neutral-950 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
        <div>
          {/* Brand Logo Container */}
          <div className="h-16 border-b border-white/5 px-6 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-md font-bold tracking-tight text-white">Heirloom</span>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6">
            <div>
              <p className="px-3 mb-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">My Space</p>
              <nav className="space-y-1">
                {mySpaceItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
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

            <div>
              <p className="px-3 mb-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Trusted Access</p>
              <nav className="space-y-1">
                {trustedAccessItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
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
          </div>
        </div>

        {/* User Session Details Bottom Card */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-900/30 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
              {user.avatar}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
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
        <header className="h-16 border-b border-white/5 bg-neutral-950 px-8 flex items-center justify-between flex-shrink-0 relative">
          <div className="text-sm font-semibold text-white tracking-tight">
            Digital Legacy Portal
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

            {/* Notification Bell with Dropdown Popover */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-lg border border-white/5 text-neutral-400 hover:text-white transition-all hover:bg-white/5 relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-neutral-950" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-neutral-950 border border-white/10 rounded-xl shadow-2xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-white tracking-tight">Notifications ({unreadCount} unread)</span>
                    <button 
                      onClick={() => setIsNotifOpen(false)}
                      className="text-neutral-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-neutral-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            notif.isRead 
                              ? 'bg-neutral-900/20 border-white/2px text-neutral-400' 
                              : 'bg-blue-950/10 border-blue-500/10 hover:border-blue-500/20 text-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[11px] font-bold tracking-tight">{notif.title}</span>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">{notif.message}</p>
                          <span className="text-[8px] text-neutral-500 block mt-2 font-mono">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-grow overflow-y-auto bg-black p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
