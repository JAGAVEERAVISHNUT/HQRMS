'use client';

import React, { useState, useEffect } from 'react';
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
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  admin: <UserCog className="h-4 w-4" />,
  reception: <Users className="h-4 w-4" />,
  doctor: <Stethoscope className="h-4 w-4" />,
  pharmacy: <Pill className="h-4 w-4" />,
  city: <Building2 className="h-4 w-4" />,
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Hospital Admin',
  reception: 'Reception / OPD',
  doctor: 'Doctor Panel',
  pharmacy: 'Pharmacy Staff',
  city: 'City Authority',
};

const rolesList: UserRole[] = ['reception', 'doctor', 'pharmacy', 'admin', 'city'];

interface DashboardLayoutProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const {
    currentUser,
    login,
    logout,
    patients,
    beds,
    doctors,
    prescriptions,
    resetToInitialData,
  } = useHospital();

  const [activeTab, setActiveTab] = useState<string>(() => {
    const role = currentUser?.role || 'reception';
    return roleNavItems[role]?.[0]?.id || 'registration';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synchronize activeTab whenever currentUser role changes
  useEffect(() => {
    if (currentUser?.role) {
      const validTabs = roleNavItems[currentUser.role];
      if (validTabs && !validTabs.some(t => t.id === activeTab)) {
        setActiveTab(validTabs[0].id);
      }
    }
  }, [currentUser?.role, activeTab]);

  if (!currentUser) return null;

  const navItems = roleNavItems[currentUser.role] || roleNavItems.reception;
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

  const handleQuickRoleSwitch = (role: UserRole) => {
    login(role);
    const validTabs = roleNavItems[role];
    if (validTabs && validTabs.length > 0) {
      setActiveTab(validTabs[0].id);
    }
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
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sidebar-primary/10">
              <Activity className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-sidebar-foreground">HQRMS</h1>
              <p className="text-[11px] text-sidebar-foreground/60">Hospital Intelligence</p>
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

        {/* User Info & Role Dropdown */}
        <div className="p-3.5 border-b border-sidebar-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground shrink-0">
                {roleIcons[currentUser.role]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-sidebar-foreground truncate">{currentUser.name}</p>
                <p className="text-[11px] text-sidebar-foreground/60 truncate">{roleLabels[currentUser.role]}</p>
              </div>
            </div>

            {/* Quick Switch Dropdown */}
            <Select value={currentUser.role} onValueChange={(val) => handleQuickRoleSwitch(val as UserRole)}>
              <SelectTrigger className="h-7 text-[11px] w-28 bg-background/50 border-sidebar-border text-sidebar-foreground">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs">
                {rolesList.map(role => (
                  <SelectItem key={role} value={role} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {roleLabels[role]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-[10px] uppercase font-bold tracking-wider text-sidebar-foreground/40 px-3 mb-2">
            {roleLabels[currentUser.role]} Navigation
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isPrescriptionsTab = item.id === 'prescriptions';
              const showBadge = isPrescriptionsTab && currentUser.role === 'pharmacy' && pendingPrescriptionsCount > 0;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      activeTab === item.id
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-2xs'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {showBadge && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold animate-pulse text-[10px] px-1.5 py-0">
                        {pendingPrescriptionsCount} new
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Stats */}
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] uppercase font-bold tracking-wider text-sidebar-foreground/40 px-1 mb-2">
            Hospital Vitals
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-2 rounded-md bg-sidebar-accent/50 border border-sidebar-border/40">
              <p className="text-sidebar-foreground/60 text-[10px]">Waiting OPD</p>
              <p className="font-bold text-sidebar-foreground">{waitingPatients}</p>
            </div>
            <div className="p-2 rounded-md bg-sidebar-accent/50 border border-sidebar-border/40">
              <p className="text-sidebar-foreground/60 text-[10px]">Emergency</p>
              <p className={cn("font-bold", emergencyCount > 0 ? "text-rose-500" : "text-sidebar-foreground")}>
                {emergencyCount}
              </p>
            </div>
            <div className="p-2 rounded-md bg-sidebar-accent/50 border border-sidebar-border/40">
              <p className="text-sidebar-foreground/60 text-[10px]">Beds Free</p>
              <p className="font-bold text-emerald-500">{availableBeds}</p>
            </div>
            <div className="p-2 rounded-md bg-sidebar-accent/50 border border-sidebar-border/40">
              <p className="text-sidebar-foreground/60 text-[10px]">Rx Pending</p>
              <p className={cn("font-bold", pendingPrescriptionsCount > 0 ? "text-amber-500" : "text-sidebar-foreground")}>
                {pendingPrescriptionsCount}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-sidebar-border space-y-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground justify-start h-8"
            onClick={() => {
              if (window.confirm('Reset all demo patient and prescription data to initial state?')) {
                resetToInitialData();
              }
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Reset Demo Data
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent justify-start h-8 text-xs"
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-card-foreground hover:bg-muted shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-card-foreground truncate">
                  {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h2>
                <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                  {roleLabels[currentUser.role]}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                HQRMS Live Synchronized Clinical Workspace
              </p>
            </div>
          </div>

          {/* Role Pill Switcher Bar */}
          <div className="hidden lg:flex items-center bg-muted/60 p-1 rounded-lg border text-xs gap-1">
            {rolesList.map(role => {
              const isActive = currentUser.role === role;
              return (
                <button
                  key={role}
                  onClick={() => handleQuickRoleSwitch(role)}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5',
                    isActive
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  )}
                >
                  {roleIcons[role]}
                  <span className="capitalize">{role}</span>
                  {role === 'pharmacy' && pendingPrescriptionsCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-2 shrink-0">
            {emergencyCount > 0 && (
              <Badge variant="destructive" className="animate-pulse text-[11px] px-2 py-0.5">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>{emergencyCount} Emergency</span>
              </Badge>
            )}

            {pendingPrescriptionsCount > 0 && currentUser.role !== 'pharmacy' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickRoleSwitch('pharmacy')}
                className="h-7 text-[11px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
              >
                <Pill className="h-3 w-3 mr-1 text-amber-500" />
                {pendingPrescriptionsCount} Rx Ready
              </Button>
            )}

            <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
              Sync Active
              <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            </Badge>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 w-full max-w-full">
          {children(activeTab, setActiveTab)}
        </div>
      </main>
    </div>
  );
}
