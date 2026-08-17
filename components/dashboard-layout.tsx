'use client';

import React, { useState } from "react";
import { useHospital } from '@/lib/hospital-context';
import type { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  LogOut,
  UserCog,
  Users,
  Stethoscope,
  Pill,
  Building2,
  BedDouble,
  BarChart3,
  ClipboardList,
  Package,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: string;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Overview', icon: <BarChart3 className="h-5 w-5" />, id: 'overview' },
    { label: 'Bed Management', icon: <BedDouble className="h-5 w-5" />, id: 'beds' },
    { label: 'Analytics', icon: <Activity className="h-5 w-5" />, id: 'analytics' },
  ],
  reception: [
    { label: 'Registration', icon: <ClipboardList className="h-5 w-5" />, id: 'registration' },
    { label: 'OPD Queue', icon: <Users className="h-5 w-5" />, id: 'queue' },
    { label: 'Emergency', icon: <AlertTriangle className="h-5 w-5" />, id: 'emergency' },
  ],
  doctor: [
    { label: 'My Queue', icon: <Users className="h-5 w-5" />, id: 'queue' },
    { label: 'Current Patient', icon: <Stethoscope className="h-5 w-5" />, id: 'patient' },
    { label: 'Issued Prescriptions', icon: <Pill className="h-5 w-5" />, id: 'prescriptions' },
  ],
  pharmacy: [
    { label: 'Prescriptions', icon: <ClipboardList className="h-5 w-5" />, id: 'prescriptions' },
    { label: 'Inventory', icon: <Package className="h-5 w-5" />, id: 'inventory' },
  ],
  city: [
    { label: 'City Dashboard', icon: <Building2 className="h-5 w-5" />, id: 'city' },
  ],
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <UserCog className="h-5 w-5" />,
  reception: <Users className="h-5 w-5" />,
  doctor: <Stethoscope className="h-5 w-5" />,
  pharmacy: <Pill className="h-5 w-5" />,
  city: <Building2 className="h-5 w-5" />,
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Hospital Admin',
  reception: 'Reception / OPD',
  doctor: 'Doctor',
  pharmacy: 'Pharmacy',
  city: 'City Authority',
};

interface DashboardLayoutProps {
  children: (activeTab: string) => React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, logout, patients, beds, doctors, prescriptions } = useHospital();
  const [activeTab, setActiveTab] = useState(roleNavItems[currentUser?.role || 'admin'][0].id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const navItems = roleNavItems[currentUser.role];
  const pendingPrescriptionsCount = prescriptions.filter(p => !p.dispensed).length;

  // Calculate real-time stats
  const waitingPatients = patients.filter(p => p.status === 'waiting').length;
  const emergencyCount = patients.filter(p => p.classification === 'emergency' && p.status !== 'discharged').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const availableDoctors = doctors.filter(d => d.status === 'available').length;

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row w-full overflow-x-hidden">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Responsive Drawer on Mobile, Fixed Sidebar on Desktop) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 shrink-0",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sidebar-primary/10">
              <Activity className="h-6 w-6 text-sidebar-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">HQRMS</h1>
              <p className="text-xs text-sidebar-foreground/60">Healthcare Intelligence</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              {roleIcons[currentUser.role]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sidebar-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-sidebar-foreground/60">{roleLabels[currentUser.role]}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isPrescriptionsTab = item.id === 'prescriptions';
              const showBadge = isPrescriptionsTab && currentUser.role === 'pharmacy' && pendingPrescriptionsCount > 0;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      activeTab === item.id
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {showBadge && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold animate-pulse text-xs px-2 py-0.5">
                        {pendingPrescriptionsCount}
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Stats */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-sidebar-accent">
              <p className="text-sidebar-foreground/60">Waiting</p>
              <p className="font-bold text-sidebar-foreground">{waitingPatients}</p>
            </div>
            <div className="p-2 rounded-lg bg-sidebar-accent">
              <p className="text-sidebar-foreground/60">Emergency</p>
              <p className="font-bold text-critical">{emergencyCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-sidebar-accent">
              <p className="text-sidebar-foreground/60">Beds</p>
              <p className="font-bold text-success">{availableBeds}</p>
            </div>
            <div className="p-2 rounded-lg bg-sidebar-accent">
              <p className="text-sidebar-foreground/60">Doctors</p>
              <p className="font-bold text-sidebar-foreground">{availableDoctors}</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="outline" 
            className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Switch Role
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-card-foreground hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-card-foreground truncate">
                {navItems.find(item => item.id === activeTab)?.label}
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {emergencyCount > 0 && (
              <Badge variant="destructive" className="animate-pulse text-xs px-2 py-0.5">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                <span>{emergencyCount} Emergency</span>
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              Live
              <span className="ml-1 h-2 w-2 rounded-full bg-success animate-pulse inline-block" />
            </Badge>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 w-full max-w-full">
          {children(activeTab)}
        </div>
      </main>
    </div>
  );
}

