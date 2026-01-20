'use client';

import React from "react"

import { useHospital } from '@/lib/hospital-context';
import type { UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserCog, 
  Users, 
  Stethoscope, 
  Pill, 
  Building2,
  Activity
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Activity className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">HQRMS</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Real-Time Predictive Hospital Operations & City-Level Healthcare Intelligence System
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((roleItem) => (
            <Card 
              key={roleItem.role}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 group"
              onClick={() => login(roleItem.role)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {roleItem.icon}
                  </div>
                  <CardTitle className="text-lg">{roleItem.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {roleItem.description}
                </CardDescription>
                <Button 
                  className="w-full mt-4 transition-all bg-transparent"
                  variant="outline"
                >
                  Login as {roleItem.label}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Select a role to access the dashboard</p>
        </div>
      </div>
    </div>
  );
}
