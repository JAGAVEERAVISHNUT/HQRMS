'use client';

import { useHospital } from '@/lib/hospital-context';
import { LoginPage } from '@/components/login-page';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ReceptionDashboard } from '@/components/dashboards/reception-dashboard';
import { DoctorDashboard } from '@/components/dashboards/doctor-dashboard';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { PharmacyDashboard } from '@/components/dashboards/pharmacy-dashboard';
import { CityDashboard } from '@/components/dashboards/city-dashboard';

export default function Home() {
  const { currentUser } = useHospital();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout>
      {(activeTab) => {
        switch (currentUser.role) {
          case 'reception':
            return <ReceptionDashboard activeTab={activeTab} />;
          case 'doctor':
            return <DoctorDashboard activeTab={activeTab} />;
          case 'admin':
            return <AdminDashboard activeTab={activeTab} />;
          case 'pharmacy':
            return <PharmacyDashboard activeTab={activeTab} />;
          case 'city':
            return <CityDashboard />;
          default:
            return null;
        }
      }}
    </DashboardLayout>
  );
}
