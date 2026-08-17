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
  Eye,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Prescription } from '@/lib/types';

export function PharmacyDashboard({ activeTab }: { activeTab: string }) {
  const { patients, doctors, medicines, prescriptions, dispensePrescription, addMedicine, updateMedicineStock } = useHospital();
  
  const [inventorySearch, setInventorySearch] = useState('');
  const [rxSearch, setRxSearch] = useState('');
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [newMedicine, setNewMedicine] = useState({ name: '', stock: 0, unit: 'tablets', lowStockThreshold: 10 });
  const [editingStock, setEditingStock] = useState<{ id: string, name: string, stock: number } | null>(null);
  
  // Prescription Preview & Toast
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [dispenseToast, setDispenseToast] = useState<string | null>(null);

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

  const handleDispense = (prescriptionId: string) => {
    const rx = prescriptions.find(p => p.id === prescriptionId);
    const patient = patients.find(p => p.id === rx?.patientId);
    
    dispensePrescription(prescriptionId);
    
    const patientName = rx?.patientName || patient?.name || 'Patient';
    setDispenseToast(`Prescription ${prescriptionId} successfully dispensed for ${patientName}. Inventory stock updated.`);
    setTimeout(() => setDispenseToast(null), 6000);
    
    if (selectedRx?.id === prescriptionId) {
      setSelectedRx(null);
    }
  };

  const pendingPrescriptions = prescriptions.filter(p => !p.dispensed);
  const dispensedToday = prescriptions.filter(
    p => p.dispensed && (
      !p.dispensedAt || new Date(p.dispensedAt).toDateString() === new Date().toDateString() ||
      new Date(p.issuedAt).toDateString() === new Date().toDateString()
    )
  );
  const lowStockMedicines = medicines.filter(m => m.stock <= m.lowStockThreshold);

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const filteredPendingPrescriptions = pendingPrescriptions.filter(rx => {
    const query = rxSearch.toLowerCase();
    const patient = patients.find(p => p.id === rx.patientId);
    const doctor = doctors.find(d => d.id === rx.doctorId);
    
    return (
      rx.id.toLowerCase().includes(query) ||
      (rx.patientName && rx.patientName.toLowerCase().includes(query)) ||
      (patient?.name && patient.name.toLowerCase().includes(query)) ||
      rx.patientId.toLowerCase().includes(query) ||
      (rx.doctorName && rx.doctorName.toLowerCase().includes(query)) ||
      (doctor?.name && doctor.name.toLowerCase().includes(query)) ||
      rx.items.some(item => item.medicineName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {activeTab === 'prescriptions' && (
        <>
          {/* Dispense Toast Notification */}
          {dispenseToast && (
            <div className="p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-sm font-medium">{dispenseToast}</p>
              </div>
              <Button size="xs" variant="ghost" onClick={() => setDispenseToast(null)} className="h-7 text-xs">
                Dismiss
              </Button>
            </div>
          )}

          {/* Live Pending Banner if doctor issued new prescriptions */}
          {pendingPrescriptions.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-500/20 animate-pulse">
                  <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {pendingPrescriptions.length} Prescription{pendingPrescriptions.length > 1 ? 's' : ''} Awaiting Fulfillment
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                    Doctor prescriptions are updated live in real time. Click Dispense to fulfill and deduct stock.
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500 text-white font-bold animate-pulse px-3 py-1 text-xs shrink-0">
                Live Feed Active
              </Badge>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pending Fulfillment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-amber-500">{pendingPrescriptions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Dispensed Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-500">{dispensedToday.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-rose-500">{lowStockMedicines.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  Total Medicines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{medicines.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Prescriptions */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Doctor Prescriptions Queue
                  </CardTitle>
                  <CardDescription>Prescriptions submitted by doctors waiting to be dispensed</CardDescription>
                </div>

                {/* Search Prescription */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Patient, Doctor, ID..."
                    value={rxSearch}
                    onChange={(e) => setRxSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPendingPrescriptions.length > 0 ? (
                <div className="space-y-4">
                  {filteredPendingPrescriptions.map(prescription => {
                    const patient = patients.find(p => p.id === prescription.patientId);
                    const doctor = doctors.find(d => d.id === prescription.doctorId);
                    const patientName = prescription.patientName || patient?.name || 'Unknown Patient';
                    const doctorName = prescription.doctorName || doctor?.name || 'Doctor';

                    return (
                      <div
                        key={prescription.id}
                        className="p-4 rounded-lg border bg-card hover:border-primary/40 transition-all shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b pb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <Badge variant="outline" className="font-mono text-xs bg-muted">
                                {prescription.id}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Issued: {new Date(prescription.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Badge>
                              {patient?.tokenNumber && (
                                <Badge variant="outline" className="text-xs">
                                  Token #{patient.tokenNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="font-semibold text-base text-foreground flex items-center gap-1.5">
                                <User className="h-4 w-4 text-primary" />
                                {patientName}
                                <span className="text-xs text-muted-foreground font-normal">({prescription.patientId})</span>
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                                Prescribed by {doctorName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRx(prescription)}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              View Receipt
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDispense(prescription.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Dispense Medicine
                            </Button>
                          </div>
                        </div>

                        {/* Doctor Notes */}
                        {prescription.notes && (
                          <div className="mb-3 text-xs bg-muted/60 p-2.5 rounded border">
                            <span className="font-semibold text-primary">Doctor Notes / Diagnosis: </span>
                            <span className="text-foreground/90">{prescription.notes}</span>
                          </div>
                        )}

                        {/* Medicines List */}
                        <div className="bg-muted/30 rounded-lg p-3 border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Prescribed Items ({prescription.items.length})</h4>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="text-xs">
                                  <TableHead>Medicine</TableHead>
                                  <TableHead>Dosage</TableHead>
                                  <TableHead>Quantity</TableHead>
                                  <TableHead>Special Note</TableHead>
                                  <TableHead className="text-right">Inventory Stock</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {prescription.items.map((item, idx) => {
                                  const medicine = medicines.find(m => m.id === item.medicineId || m.name.toLowerCase() === item.medicineName.toLowerCase());
                                  const currentStock = medicine ? medicine.stock : 0;
                                  const isLowStock = medicine && currentStock < item.quantity;
                                  const isOutOfStock = medicine && currentStock === 0;

                                  return (
                                    <TableRow key={idx} className="text-xs">
                                      <TableCell className="font-semibold">{item.medicineName}</TableCell>
                                      <TableCell>{item.dosage}</TableCell>
                                      <TableCell className="font-mono font-semibold">{item.quantity}</TableCell>
                                      <TableCell className="text-muted-foreground italic">
                                        {item.instructions || '—'}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {medicine ? (
                                          <span className={cn(
                                            isOutOfStock ? 'text-destructive font-bold' :
                                              isLowStock ? 'text-amber-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                          )}>
                                            {currentStock} {medicine.unit}
                                          </span>
                                        ) : (
                                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                            Custom Entry
                                          </Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500/70" />
                  <p className="font-medium text-foreground">No pending prescriptions matching filter</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When doctors issue prescriptions, they automatically appear here in real time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Dispensed Log */}
          {dispensedToday.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Completed / Dispensed Prescriptions Log ({dispensedToday.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Prescription ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Items Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispensedToday.map(prescription => {
                      const patient = patients.find(p => p.id === prescription.patientId);
                      const doctor = doctors.find(d => d.id === prescription.doctorId);

                      return (
                        <TableRow key={prescription.id} className="text-xs">
                          <TableCell className="font-mono font-semibold">{prescription.id}</TableCell>
                          <TableCell className="font-medium">{prescription.patientName || patient?.name || 'Unknown'}</TableCell>
                          <TableCell>{prescription.doctorName || doctor?.name || 'Unknown'}</TableCell>
                          <TableCell>{prescription.items.length} item(s)</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px]">
                              Dispensed
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="xs" variant="ghost" onClick={() => setSelectedRx(prescription)}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Slip
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 'inventory' && (
        <>
          {/* Low Stock Alert */}
          {lowStockMedicines.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert ({lowStockMedicines.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lowStockMedicines.map(medicine => (
                    <Badge key={medicine.id} variant="destructive" className="text-xs">
                      {medicine.name}: {medicine.stock} {medicine.unit} remaining
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
              placeholder="Search medicines inventory..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="pl-10 text-xs sm:text-sm"
            />
          </div>

          {/* Add Medicine Dialog */}
          <Dialog open={isAddMedicineOpen} onOpenChange={setIsAddMedicineOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Medicine to Inventory</DialogTitle>
                <DialogDescription>Enter medicine details and starting stock level.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-xs">Name</Label>
                  <Input
                    id="name"
                    value={newMedicine.name}
                    onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                    className="col-span-3 text-xs"
                    placeholder="e.g. Paracetamol 650mg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right text-xs">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newMedicine.stock}
                    onChange={(e) => setNewMedicine({ ...newMedicine, stock: parseInt(e.target.value) || 0 })}
                    className="col-span-3 text-xs"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right text-xs">Unit</Label>
                  <Input
                    id="unit"
                    value={newMedicine.unit}
                    onChange={(e) => setNewMedicine({ ...newMedicine, unit: e.target.value })}
                    className="col-span-3 text-xs"
                    placeholder="e.g. tablets, capsules, bottles"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="threshold" className="text-right text-xs">Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={newMedicine.lowStockThreshold}
                    onChange={(e) => setNewMedicine({ ...newMedicine, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="col-span-3 text-xs"
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
                <DialogTitle>Update Inventory Stock</DialogTitle>
                <DialogDescription>Update stock count for {editingStock?.name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-stock" className="text-right text-xs">New Stock</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingStock?.stock || 0}
                    onChange={(e) => setEditingStock(prev => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                    className="col-span-3 text-xs"
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Medicine Inventory
                  </CardTitle>
                  <CardDescription>Current stock levels and restocking alerts</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddMedicineOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medicine
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Medicine ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicines.map(medicine => {
                    const stockPercentage = (medicine.stock / (medicine.lowStockThreshold * 5)) * 100;
                    const isLow = medicine.stock <= medicine.lowStockThreshold;
                    const isCritical = medicine.stock <= medicine.lowStockThreshold / 2;

                    return (
                      <TableRow key={medicine.id} className="text-xs">
                        <TableCell className="font-mono">{medicine.id}</TableCell>
                        <TableCell className="font-medium">{medicine.name}</TableCell>
                        <TableCell className="font-semibold">{medicine.stock}</TableCell>
                        <TableCell>{medicine.unit}</TableCell>
                        <TableCell className="w-32">
                          <Progress
                            value={Math.min(stockPercentage, 100)}
                            className={cn(
                              'h-2',
                              isCritical && '[&>div]:bg-destructive',
                              isLow && !isCritical && '[&>div]:bg-amber-500'
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          {isCritical ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit text-[11px]">
                              <TrendingDown className="h-3 w-3" />
                              Critical
                            </Badge>
                          ) : isLow ? (
                            <Badge className="bg-amber-500 text-white flex items-center gap-1 w-fit text-[11px]">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500 text-white flex items-center gap-1 w-fit text-[11px]">
                              <CheckCircle2 className="h-3 w-3" />
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
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
        </>
      )}

      {/* PRESCRIPTION RECEIPT SLIP MODAL */}
      <Dialog open={!!selectedRx} onOpenChange={(open) => !open && setSelectedRx(null)}>
        {selectedRx && (
          <DialogContent className="max-w-2xl">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Prescription Slip #{selectedRx.id}
                </DialogTitle>
                <Badge variant={selectedRx.dispensed ? 'default' : 'outline'} className={selectedRx.dispensed ? 'bg-emerald-600' : 'text-amber-600 border-amber-600'}>
                  {selectedRx.dispensed ? 'Dispensed' : 'Pending Fulfillment'}
                </Badge>
              </div>
              <DialogDescription>
                Issued on {new Date(selectedRx.issuedAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/40 p-3 rounded-lg border">
                <div>
                  <p className="text-muted-foreground">Patient Details</p>
                  <p className="font-semibold text-sm text-foreground">{selectedRx.patientName || selectedRx.patientId}</p>
                  <p className="text-muted-foreground">ID: {selectedRx.patientId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prescribing Doctor</p>
                  <p className="font-semibold text-sm text-foreground">{selectedRx.doctorName || selectedRx.doctorId}</p>
                  <p className="text-muted-foreground">Doctor ID: {selectedRx.doctorId}</p>
                </div>
              </div>

              {selectedRx.notes && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                  <p className="font-semibold text-primary mb-1">Doctor's Diagnosis & Notes:</p>
                  <p className="text-foreground">{selectedRx.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prescribed Medicines</Label>
                <div className="mt-2 space-y-2">
                  {selectedRx.items.map((item, i) => (
                    <div key={i} className="p-3 rounded-md bg-card border flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{item.medicineName}</p>
                        <p className="text-muted-foreground">Dosage: {item.dosage}</p>
                        {item.instructions && <p className="text-primary italic mt-0.5">{item.instructions}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-3">
              <Button variant="outline" onClick={() => setSelectedRx(null)}>
                Close
              </Button>

              {!selectedRx.dispensed && (
                <Button onClick={() => handleDispense(selectedRx.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Dispense Prescription
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
