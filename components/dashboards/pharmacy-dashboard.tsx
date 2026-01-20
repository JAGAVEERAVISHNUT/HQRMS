'use client';

import { useHospital } from '@/lib/hospital-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pill,
  Search,
  TrendingDown,
  User,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function PharmacyDashboard({ activeTab }: { activeTab: string }) {
  const { patients, doctors, medicines, prescriptions, dispensePrescription } = useHospital();
  const [searchTerm, setSearchTerm] = useState('');

  const pendingPrescriptions = prescriptions.filter(p => !p.dispensed);
  const dispensedToday = prescriptions.filter(
    p => p.dispensed && new Date(p.issuedAt).toDateString() === new Date().toDateString()
  );
  const lowStockMedicines = medicines.filter(m => m.stock <= m.lowStockThreshold);

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeTab === 'prescriptions') {
    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{pendingPrescriptions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Dispensed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{dispensedToday.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{lowStockMedicines.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Total Medicines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{medicines.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Pending Prescriptions
            </CardTitle>
            <CardDescription>Prescriptions waiting to be dispensed</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPrescriptions.length > 0 ? (
              <div className="space-y-4">
                {pendingPrescriptions.map(prescription => {
                  const patient = patients.find(p => p.id === prescription.patientId);
                  const doctor = doctors.find(d => d.id === prescription.doctorId);
                  
                  return (
                    <div 
                      key={prescription.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono">
                              {prescription.id}
                            </Badge>
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(prescription.issuedAt).toLocaleTimeString()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {patient?.name || 'Unknown'} ({patient?.id})
                            </span>
                            <span className="flex items-center gap-1">
                              <Stethoscope className="h-4 w-4" />
                              {doctor?.name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <Button onClick={() => dispensePrescription(prescription.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Dispense
                        </Button>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-2">Medicines</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medicine</TableHead>
                              <TableHead>Dosage</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Stock</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {prescription.items.map(item => {
                              const medicine = medicines.find(m => m.id === item.medicineId);
                              const isLowStock = medicine && medicine.stock < item.quantity;
                              
                              return (
                                <TableRow key={item.medicineId}>
                                  <TableCell className="font-medium">{item.medicineName}</TableCell>
                                  <TableCell>{item.dosage}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>
                                    <span className={cn(
                                      isLowStock ? 'text-destructive' : 'text-success'
                                    )}>
                                      {medicine?.stock || 0} {medicine?.unit}
                                    </span>
                                    {isLowStock && (
                                      <AlertTriangle className="h-4 w-4 inline ml-1 text-destructive" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" />
                <p>All prescriptions have been dispensed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Dispensed */}
        {dispensedToday.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recently Dispensed</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prescription ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispensedToday.map(prescription => {
                    const patient = patients.find(p => p.id === prescription.patientId);
                    const doctor = doctors.find(d => d.id === prescription.doctorId);
                    
                    return (
                      <TableRow key={prescription.id}>
                        <TableCell className="font-mono">{prescription.id}</TableCell>
                        <TableCell>{patient?.name || 'Unknown'}</TableCell>
                        <TableCell>{doctor?.name || 'Unknown'}</TableCell>
                        <TableCell>{prescription.items.length} items</TableCell>
                        <TableCell>{new Date(prescription.issuedAt).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (activeTab === 'inventory') {
    return (
      <div className="space-y-6">
        {/* Low Stock Alert */}
        {lowStockMedicines.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockMedicines.map(medicine => (
                  <Badge key={medicine.id} variant="destructive">
                    {medicine.name}: {medicine.stock} left
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Medicine Inventory
            </CardTitle>
            <CardDescription>Current stock levels and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map(medicine => {
                  const stockPercentage = (medicine.stock / (medicine.lowStockThreshold * 5)) * 100;
                  const isLow = medicine.stock <= medicine.lowStockThreshold;
                  const isCritical = medicine.stock <= medicine.lowStockThreshold / 2;
                  
                  return (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-mono">{medicine.id}</TableCell>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.stock}</TableCell>
                      <TableCell>{medicine.unit}</TableCell>
                      <TableCell className="w-32">
                        <Progress 
                          value={Math.min(stockPercentage, 100)} 
                          className={cn(
                            'h-2',
                            isCritical && '[&>div]:bg-destructive',
                            isLow && !isCritical && '[&>div]:bg-warning'
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        {isCritical ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <TrendingDown className="h-3 w-3" />
                            Critical
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="secondary" className="bg-warning text-warning-foreground flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-success text-success-foreground flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Daily Usage Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage Summary</CardTitle>
            <CardDescription>Medicines dispensed today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {medicines.slice(0, 8).map(medicine => {
                // Simulate usage count
                const usageCount = Math.floor(Math.random() * 20) + 5;
                
                return (
                  <div key={medicine.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium truncate">{medicine.name}</p>
                    <p className="text-2xl font-bold">{usageCount}</p>
                    <p className="text-xs text-muted-foreground">{medicine.unit} dispensed</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
