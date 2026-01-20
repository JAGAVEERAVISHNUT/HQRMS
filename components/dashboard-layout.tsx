'use client';

import React from "react"

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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  const { currentUser, logout, patients, beds, doctors } = useHospital();
  const [activeTab, setActiveTab] = useState(roleNavItems[currentUser?.role || 'admin'][0].id);

  if (!currentUser) return null;

  const navItems = roleNavItems[currentUser.role];
  
  // Calculate real-time stats
  const waitingPatients = patients.filter(p => p.status === 'waiting').length;
  const emergencyCount = patients.filter(p => p.classification === 'emergency' && p.status !== 'discharged').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const availableDoctors = doctors.filter(d => d.status === 'available').length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sidebar-primary/10">
              <Activity className="h-6 w-6 text-sidebar-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">HQRMS</h1>
              <p className="text-xs text-sidebar-foreground/60">Healthcare Intelligence</p>
            </div>
          </div>
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
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
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
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Switch Role
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              {navItems.find(item => item.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {emergencyCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {emergencyCount} Emergency
              </Badge>
            )}
            <Badge variant="secondary">
              Live
              <span className="ml-1 h-2 w-2 rounded-full bg-success animate-pulse inline-block" />
            </Badge>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children(activeTab)}
        </div>
      </main>
    </div>
  );
}
