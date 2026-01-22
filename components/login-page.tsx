'use client';

import React from "react"

import { useHospital } from '@/lib/hospital-context';
import type { UserRole } from '@/lib/types';
import { ParticlesBackground } from '@/components/particles-background';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UserCog,
  Users,
  Stethoscope,
  Pill,
  Building2,
  Activity,
  HeartPulse
} from 'lucide-react';

const roles: { role: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    role: 'admin',
    label: 'Hospital Admin',
    description: 'Manage beds, view analytics, and oversee operations',
    icon: <UserCog className="h-8 w-8" />
  },
  {
    role: 'reception',
    label: 'Reception / OPD Staff',
    description: 'Register patients and manage OPD queues',
    icon: <Users className="h-8 w-8" />
  },
  {
    role: 'doctor',
    label: 'Doctor',
    description: 'View patient queue and provide consultations',
    icon: <Stethoscope className="h-8 w-8" />
  },
  {
    role: 'pharmacy',
    label: 'Pharmacy Staff',
    description: 'Manage prescriptions and inventory',
    icon: <Pill className="h-8 w-8" />
  },
  {
    role: 'city',
    label: 'City Authority',
    description: 'View city-wide healthcare data (read-only)',
    icon: <Building2 className="h-8 w-8" />
  },
];

export function LoginPage() {
  const { login } = useHospital();

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ParticlesBackground />

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none z-0" />

      <div className="w-full max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6 relative">
            <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full w-24 h-24 mx-auto -z-10 animate-pulse" />
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 backdrop-blur-md shadow-2xl shadow-primary/20">
              <Activity className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-accent drop-shadow-sm">
              HQRMS
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light tracking-wide">
            Real-Time Predictive <span className="text-foreground font-medium">Hospital Operations</span> & <span className="text-foreground font-medium">City-Level Healthcare</span> Intelligence
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {roles.map((roleItem) => (
            <Card
              key={roleItem.role}
              className="relative overflow-hidden cursor-pointer group border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30"
              onClick={() => login(roleItem.role)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary border border-white/10 group-hover:scale-110 group-hover:text-accent transition-all duration-300 shadow-inner">
                    {roleItem.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                    {roleItem.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-muted-foreground/80 text-base leading-relaxed group-hover:text-muted-foreground transition-colors">
                  {roleItem.description}
                </CardDescription>
                <div className="mt-6 flex items-center text-primary text-sm font-medium opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Access Portal <span className="ml-2">→</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
            Secure Healthcare Intelligence Network
          </p>
        </div>
      </div>
    </div>
  );
}
