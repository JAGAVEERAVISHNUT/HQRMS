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
  Plus,
  PenSquare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function PharmacyDashboard({ activeTab }: { activeTab: string }) {
  const { patients, doctors, medicines, prescriptions, dispensePrescription, addMedicine, updateMedicineStock } = useHospital();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [newMedicine, setNewMedicine] = useState({ name: '', stock: 0, unit: 'tablets', lowStockThreshold: 10 });
  const [editingStock, setEditingStock] = useState<{ id: string, name: string, stock: number } | null>(null);

  const handleAddMedicine = () => {
    if (newMedicine.name && newMedicine.stock >= 0) {
      addMedicine(newMedicine);
      setIsAddMedicineOpen(false);
      setNewMedicine({ name: '', stock: 0, unit: 'tablets', lowStockThreshold: 10 });
    }
  };

  const handleUpdateStock = () => {
    if (editingStock) {
      updateMedicineStock(editingStock.id, editingStock.stock);
      setEditingStock(null);
    }
  };

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

        {/* Add Medicine Dialog */}
        <Dialog open={isAddMedicineOpen} onOpenChange={setIsAddMedicineOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
              <DialogDescription>Add a new medicine to the hospital inventory.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newMedicine.stock}
                  onChange={(e) => setNewMedicine({ ...newMedicine, stock: parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unit</Label>
                <Input
                  id="unit"
                  value={newMedicine.unit}
                  onChange={(e) => setNewMedicine({ ...newMedicine, unit: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g. tablets, bottles"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="threshold" className="text-right">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newMedicine.lowStockThreshold}
                  onChange={(e) => setNewMedicine({ ...newMedicine, lowStockThreshold: parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMedicine}>Add Medicine</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Stock Dialog */}
        <Dialog open={!!editingStock} onOpenChange={(open) => !open && setEditingStock(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock</DialogTitle>
              <DialogDescription>Update stock count for {editingStock?.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-stock" className="text-right">New Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={editingStock?.stock || 0}
                  onChange={(e) => setEditingStock(prev => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateStock}>Update Stock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Medicine Inventory
            </CardTitle>
            <CardDescription>Current stock levels and alerts</CardDescription>
            <Button size="sm" onClick={() => setIsAddMedicineOpen(true)} className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
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
                  <TableHead>Action</TableHead>
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingStock({ id: medicine.id, name: medicine.name, stock: medicine.stock })}
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
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
              {medicines.map(medicine => {
                // Calculate real usage from dispensed prescriptions today
                const usageCount = dispensedToday.reduce((total, prescription) => {
                  const item = prescription.items.find(i => i.medicineId === medicine.id);
                  return total + (item ? item.quantity : 0);
                }, 0);

                if (usageCount === 0) return null;

                return (
                  <div key={medicine.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium truncate">{medicine.name}</p>
                    <p className="text-2xl font-bold">{usageCount}</p>
                    <p className="text-xs text-muted-foreground">{medicine.unit} dispensed</p>
                  </div>
                );
              })}
            </div>
            {dispensedToday.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No medicines dispensed today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div >
    );
  }

  return null;
}
