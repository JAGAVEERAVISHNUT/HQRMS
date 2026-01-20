'use client';

import { useHospital } from '@/lib/hospital-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BedDouble,
  Users,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Stethoscope,
  Pill,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateHourlyStats, medicineUsageData } from '@/lib/store';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function AdminDashboard({ activeTab }: { activeTab: string }) {
  const { patients, doctors, beds, medicines, dischargePatient, updateBedStatus } = useHospital();

  // Calculate stats
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const maintenanceBeds = beds.filter(b => b.status === 'maintenance').length;

  const generalBeds = beds.filter(b => b.type === 'general');
  const icuBeds = beds.filter(b => b.type === 'icu');
  const emergencyBeds = beds.filter(b => b.type === 'emergency');

  const waitingPatients = patients.filter(p => p.status === 'waiting').length;
  const admittedPatients = patients.filter(p => p.status === 'admitted').length;
  const todayPatients = patients.filter(p => 
    new Date(p.registeredAt).toDateString() === new Date().toDateString()
  ).length;

  const hourlyStats = generateHourlyStats();

  const bedUtilizationData = [
    { name: 'General', total: generalBeds.length, occupied: generalBeds.filter(b => b.status === 'occupied').length },
    { name: 'ICU', total: icuBeds.length, occupied: icuBeds.filter(b => b.status === 'occupied').length },
    { name: 'Emergency', total: emergencyBeds.length, occupied: emergencyBeds.filter(b => b.status === 'occupied').length },
  ];

  const pieData = [
    { name: 'Available', value: availableBeds, color: 'var(--color-success)' },
    { name: 'Occupied', value: occupiedBeds, color: 'var(--color-primary)' },
    { name: 'Maintenance', value: maintenanceBeds, color: 'var(--color-warning)' },
  ];

  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Today&apos;s Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayPatients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {waitingPatients} waiting, {admittedPatients} admitted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                Bed Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round((occupiedBeds / totalBeds) * 100)}%</div>
              <Progress value={(occupiedBeds / totalBeds) * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {availableBeds} of {totalBeds} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Active Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {doctors.filter(d => d.status !== 'offline').length}/{doctors.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {doctors.filter(d => d.status === 'available').length} available now
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {medicines.filter(m => m.stock <= m.lowStockThreshold).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Medicines need restocking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Patient Flow (Last 12 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(h) => `${h}:00`}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value} patients`, 'Count']}
                      labelFormatter={(label) => `${label}:00`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="patientCount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bed Distribution Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-primary" />
                Bed Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Status */}
        <Card>
          <CardHeader>
            <CardTitle>Doctor Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map(doctor => (
                <div 
                  key={doctor.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      doctor.status === 'available' ? 'bg-success/10 text-success' :
                      doctor.status === 'busy' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    )}>
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{doctor.name}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      doctor.status === 'available' ? 'default' :
                      doctor.status === 'busy' ? 'secondary' : 'outline'
                    }>
                      {doctor.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Queue: {doctor.queue.length}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'beds') {
    return (
      <div className="space-y-6">
        {/* Bed Type Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { type: 'General', beds: generalBeds, icon: BedDouble, color: 'text-primary' },
            { type: 'ICU', beds: icuBeds, icon: Activity, color: 'text-warning' },
            { type: 'Emergency', beds: emergencyBeds, icon: AlertTriangle, color: 'text-destructive' },
          ].map(({ type, beds: typeBeds, icon: Icon, color }) => {
            const available = typeBeds.filter(b => b.status === 'available').length;
            const occupied = typeBeds.filter(b => b.status === 'occupied').length;
            
            return (
              <Card key={type}>
                <CardHeader className="pb-2">
                  <CardTitle className={cn('text-sm font-medium flex items-center gap-2', color)}>
                    <Icon className="h-4 w-4" />
                    {type} Beds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-2">
                    <div className="text-3xl font-bold">{available}</div>
                    <div className="text-right text-sm text-muted-foreground">
                      of {typeBeds.length} total
                    </div>
                  </div>
                  <Progress 
                    value={(occupied / typeBeds.length) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-success">{available} Available</span>
                    <span className="text-primary">{occupied} Occupied</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bed Utilization Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bed Utilization by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bedUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--muted))" name="Total" />
                  <Bar dataKey="occupied" fill="hsl(var(--primary))" name="Occupied" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bed Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Beds</CardTitle>
            <CardDescription>Manage bed allocation and status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bed ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beds.map(bed => {
                  const patient = patients.find(p => p.id === bed.patientId);
                  
                  return (
                    <TableRow key={bed.id}>
                      <TableCell className="font-mono">{bed.id}</TableCell>
                      <TableCell>
                        <Badge variant={
                          bed.type === 'icu' ? 'secondary' :
                          bed.type === 'emergency' ? 'destructive' : 'default'
                        }>
                          {bed.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{bed.ward}</TableCell>
                      <TableCell>
                        <Badge variant={
                          bed.status === 'available' ? 'default' :
                          bed.status === 'occupied' ? 'secondary' : 'outline'
                        } className={cn(
                          bed.status === 'available' && 'bg-success text-success-foreground'
                        )}>
                          {bed.status === 'available' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {bed.status === 'maintenance' && <Wrench className="h-3 w-3 mr-1" />}
                          {bed.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {patient ? (
                          <span>{patient.name} ({patient.id})</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {bed.status === 'occupied' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => dischargePatient(bed.id)}
                          >
                            Discharge
                          </Button>
                        )}
                        {bed.status === 'available' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateBedStatus(bed.id, 'maintenance')}
                          >
                            <Wrench className="h-4 w-4" />
                          </Button>
                        )}
                        {bed.status === 'maintenance' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateBedStatus(bed.id, 'available')}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div className="space-y-6">
        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Patient Flow & Peak Hours
            </CardTitle>
            <CardDescription>
              Identify peak hours to optimize staffing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value} patients`, 'Count']}
                    labelFormatter={(label) => `${label}:00`}
                  />
                  <Bar 
                    dataKey="patientCount" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Peak Hours:</strong> 9:00 AM - 11:00 AM and 4:00 PM - 6:00 PM
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Medicine Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Weekly Medicine Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={medicineUsageData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="mon" fill="hsl(var(--chart-1))" name="Mon" />
                  <Bar dataKey="tue" fill="hsl(var(--chart-2))" name="Tue" />
                  <Bar dataKey="wed" fill="hsl(var(--chart-3))" name="Wed" />
                  <Bar dataKey="thu" fill="hsl(var(--chart-4))" name="Thu" />
                  <Bar dataKey="fri" fill="hsl(var(--chart-5))" name="Fri" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Daily Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">127</div>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">23 min</div>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                -5 min from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bed Turnover Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2.3</div>
              <p className="text-xs text-muted-foreground mt-1">
                patients per bed per day
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
