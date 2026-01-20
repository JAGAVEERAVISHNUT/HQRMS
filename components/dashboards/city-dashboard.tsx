'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  BedDouble,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingUp,
  Shield,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cityHospitals } from '@/lib/store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function CityDashboard() {
  // Calculate city-wide stats
  const totalBeds = cityHospitals.reduce((acc, h) => acc + h.totalBeds, 0);
  const availableBeds = cityHospitals.reduce((acc, h) => acc + h.availableBeds, 0);
  const totalICU = cityHospitals.reduce((acc, h) => acc + h.icuTotal, 0);
  const availableICU = cityHospitals.reduce((acc, h) => acc + h.icuAvailable, 0);
  
  const criticalHospitals = cityHospitals.filter(h => h.opdLoad === 'high' || h.emergencyCapacity < 30);
  const avgEmergencyCapacity = Math.round(
    cityHospitals.reduce((acc, h) => acc + h.emergencyCapacity, 0) / cityHospitals.length
  );

  const chartData = cityHospitals.map(h => ({
    name: h.name.split(' ')[0],
    available: h.availableBeds,
    occupied: h.totalBeds - h.availableBeds,
  }));

  const getLoadColor = (load: string) => {
    switch (load) {
      case 'low': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCapacityColor = (capacity: number) => {
    if (capacity >= 70) return 'text-success';
    if (capacity >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-primary">Read-Only Dashboard</p>
              <p className="text-sm text-muted-foreground">
                This dashboard shows aggregated operational data only. No patient-level or medical data is displayed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* City-Wide Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Hospitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cityHospitals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered healthcare facilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              City Bed Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{availableBeds}</div>
            <Progress value={(availableBeds / totalBeds) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              of {totalBeds} total beds ({Math.round((availableBeds / totalBeds) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              ICU Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', availableICU < 5 ? 'text-warning' : 'text-success')}>
              {availableICU}
            </div>
            <Progress 
              value={(availableICU / totalICU) * 100} 
              className={cn('mt-2', availableICU < 5 && '[&>div]:bg-warning')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              of {totalICU} ICU beds available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Avg Emergency Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', getCapacityColor(avgEmergencyCapacity))}>
              {avgEmergencyCapacity}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalHospitals.length} hospitals at high load
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bed Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            City-Wide Bed Distribution
          </CardTitle>
          <CardDescription>Available vs occupied beds across hospitals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
                <Bar dataKey="available" fill="hsl(var(--success))" name="Available" stackId="a" />
                <Bar dataKey="occupied" fill="hsl(var(--muted))" name="Occupied" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hospital Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Hospital Status Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cityHospitals.map(hospital => {
            const bedPercentage = (hospital.availableBeds / hospital.totalBeds) * 100;
            const icuPercentage = hospital.icuTotal > 0 
              ? (hospital.icuAvailable / hospital.icuTotal) * 100 
              : 0;
            
            return (
              <Card 
                key={hospital.id}
                className={cn(
                  'transition-all hover:shadow-md',
                  hospital.opdLoad === 'high' && 'border-destructive/50',
                  hospital.opdLoad === 'low' && 'border-success/50'
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{hospital.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        Hospital ID: {hospital.id}
                      </CardDescription>
                    </div>
                    <Badge className={getLoadColor(hospital.opdLoad)}>
                      {hospital.opdLoad === 'low' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {hospital.opdLoad === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {hospital.opdLoad.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bed Availability */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-4 w-4" />
                        General Beds
                      </span>
                      <span className={cn(
                        'font-medium',
                        bedPercentage > 50 ? 'text-success' : bedPercentage > 20 ? 'text-warning' : 'text-destructive'
                      )}>
                        {hospital.availableBeds}/{hospital.totalBeds}
                      </span>
                    </div>
                    <Progress 
                      value={bedPercentage}
                      className={cn(
                        'h-2',
                        bedPercentage <= 20 && '[&>div]:bg-destructive',
                        bedPercentage > 20 && bedPercentage <= 50 && '[&>div]:bg-warning'
                      )}
                    />
                  </div>

                  {/* ICU Availability */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        ICU Beds
                      </span>
                      <span className={cn(
                        'font-medium',
                        icuPercentage > 50 ? 'text-success' : icuPercentage > 0 ? 'text-warning' : 'text-destructive'
                      )}>
                        {hospital.icuAvailable}/{hospital.icuTotal}
                      </span>
                    </div>
                    <Progress 
                      value={icuPercentage}
                      className={cn(
                        'h-2',
                        icuPercentage === 0 && '[&>div]:bg-destructive',
                        icuPercentage > 0 && icuPercentage <= 50 && '[&>div]:bg-warning'
                      )}
                    />
                  </div>

                  {/* Emergency Capacity */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Emergency Capacity
                    </span>
                    <span className={cn(
                      'text-lg font-bold',
                      getCapacityColor(hospital.emergencyCapacity)
                    )}>
                      {hospital.emergencyCapacity}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalHospitals.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hospitals Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalHospitals.map(hospital => (
                <div 
                  key={hospital.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div>
                    <p className="font-medium">{hospital.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hospital.opdLoad === 'high' && 'High OPD load'}
                      {hospital.emergencyCapacity < 30 && ' | Low emergency capacity'}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {hospital.emergencyCapacity}% capacity
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-success" />
              <span className="text-sm">Available (Good capacity)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-warning" />
              <span className="text-sm">Limited (Medium load)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive" />
              <span className="text-sm">Critical (High load / Full)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
