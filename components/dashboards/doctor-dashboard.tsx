'use client';

import { useState } from 'react';
import { useHospital } from '@/lib/hospital-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  UserCheck,
  Clock,
  Pill,
  BedDouble,
  ArrowRight,
  Stethoscope,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrescriptionItem } from '@/lib/types';

export function DoctorDashboard({ activeTab }: { activeTab: string }) {
  const { 
    patients, 
    doctors, 
    medicines, 
    callNextPatient, 
    completeConsultation,
    createPrescription,
    admitPatient,
    getWaitingTime 
  } = useHospital();
  
  // Assume logged in as Dr. Smith (D001) for demo
  const currentDoctor = doctors.find(d => d.id === 'D001') || doctors[0];
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [showAdmitDialog, setShowAdmitDialog] = useState(false);
  const [selectedBedType, setSelectedBedType] = useState<'general' | 'icu' | 'emergency'>('general');

  const queuePatients = patients.filter(
    p => p.assignedDoctor === currentDoctor.id && p.status === 'waiting'
  );
  const currentPatient = patients.find(
    p => p.assignedDoctor === currentDoctor.id && p.status === 'in-consultation'
  );

  const handleCallNext = () => {
    callNextPatient(currentDoctor.id);
  };

  const handleAddMedicine = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine && !prescriptionItems.find(i => i.medicineId === medicineId)) {
      setPrescriptionItems(prev => [...prev, {
        medicineId,
        medicineName: medicine.name,
        dosage: '1 tablet twice daily',
        quantity: 10,
      }]);
    }
  };

  const handleRemoveMedicine = (medicineId: string) => {
    setPrescriptionItems(prev => prev.filter(i => i.medicineId !== medicineId));
  };

  const handleUpdateDosage = (medicineId: string, dosage: string) => {
    setPrescriptionItems(prev => prev.map(i => 
      i.medicineId === medicineId ? { ...i, dosage } : i
    ));
  };

  const handleUpdateQuantity = (medicineId: string, quantity: number) => {
    setPrescriptionItems(prev => prev.map(i => 
      i.medicineId === medicineId ? { ...i, quantity } : i
    ));
  };

  const handlePrescribe = () => {
    if (currentPatient && prescriptionItems.length > 0) {
      createPrescription(currentPatient.id, currentDoctor.id, prescriptionItems);
      completeConsultation(currentDoctor.id, 'prescribe');
      setPrescriptionItems([]);
      setShowPrescriptionDialog(false);
    }
  };

  const handleAdmit = () => {
    if (currentPatient) {
      admitPatient(currentPatient.id, selectedBedType);
      completeConsultation(currentDoctor.id, 'admit');
      setShowAdmitDialog(false);
    }
  };

  if (activeTab === 'queue') {
    return (
      <div className="space-y-6">
        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                In Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{queuePatients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Est. Clear Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {queuePatients.length * currentDoctor.avgConsultationTime} min
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Emergency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-critical">
                {queuePatients.filter(p => p.classification === 'emergency').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Today Seen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {patients.filter(p => 
                  p.assignedDoctor === currentDoctor.id && 
                  ['pharmacy', 'admitted', 'discharged'].includes(p.status) &&
                  new Date(p.registeredAt).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Patient Queue</CardTitle>
                <CardDescription>Patients waiting for consultation</CardDescription>
              </div>
              <Button 
                onClick={handleCallNext} 
                disabled={queuePatients.length === 0 || currentPatient !== undefined}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Call Next Patient
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {queuePatients.length > 0 ? (
              <div className="space-y-2">
                {queuePatients.map((patient, index) => (
                  <div 
                    key={patient.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border transition-all',
                      index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card',
                      patient.classification === 'emergency' && 'border-destructive/50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                        index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{patient.name}</span>
                          <Badge variant="outline" className="font-mono">#{patient.tokenNumber}</Badge>
                          {patient.classification === 'emergency' && (
                            <Badge variant="destructive">Emergency</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient.age} yrs, {patient.gender} | {patient.symptoms.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">~{getWaitingTime(patient.id)} min wait</p>
                      <p className="text-xs text-muted-foreground">
                        Registered: {new Date(patient.registeredAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No patients in queue</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'patient') {
    return (
      <div className="space-y-6">
        {currentPatient ? (
          <>
            {/* Current Patient Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{currentPatient.name}</CardTitle>
                      <CardDescription>
                        Patient ID: {currentPatient.id} | Token: #{currentPatient.tokenNumber}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={
                    currentPatient.classification === 'emergency' ? 'destructive' :
                    currentPatient.classification === 'specialist' ? 'secondary' : 'default'
                  } className="text-sm px-4 py-1">
                    {currentPatient.classification.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="text-lg font-semibold">{currentPatient.age} years</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="text-lg font-semibold capitalize">{currentPatient.gender}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="text-lg font-semibold">{currentPatient.mobile}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Registered</p>
                    <p className="text-lg font-semibold">
                      {new Date(currentPatient.registeredAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Symptoms / Chief Complaints
                  </h4>
                  <p className="text-muted-foreground">{currentPatient.symptoms}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Consultation Actions</CardTitle>
                <CardDescription>Complete the consultation with one of these actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Prescribe */}
                  <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
                    <DialogTrigger asChild>
                      <Button className="h-auto py-6 flex-col gap-2 bg-transparent" variant="outline">
                        <Pill className="h-8 w-8" />
                        <span>Prescribe Medicine</span>
                        <span className="text-xs text-muted-foreground">Send to pharmacy</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Prescription</DialogTitle>
                        <DialogDescription>
                          Select medicines for {currentPatient.name}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* Medicine Selection */}
                        <div>
                          <Label>Available Medicines</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-auto">
                            {medicines.filter(m => m.stock > 0).map(medicine => (
                              <div 
                                key={medicine.id}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                                  prescriptionItems.find(i => i.medicineId === medicine.id)
                                    ? 'bg-primary/10 border-primary'
                                    : 'hover:bg-muted'
                                )}
                                onClick={() => 
                                  prescriptionItems.find(i => i.medicineId === medicine.id)
                                    ? handleRemoveMedicine(medicine.id)
                                    : handleAddMedicine(medicine.id)
                                }
                              >
                                <Checkbox 
                                  checked={!!prescriptionItems.find(i => i.medicineId === medicine.id)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{medicine.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Stock: {medicine.stock} {medicine.unit}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Selected Items */}
                        {prescriptionItems.length > 0 && (
                          <div>
                            <Label>Prescription Details</Label>
                            <div className="space-y-2 mt-2">
                              {prescriptionItems.map(item => (
                                <div key={item.medicineId} className="flex items-center gap-2 p-2 rounded bg-muted">
                                  <div className="flex-1">
                                    <p className="font-medium">{item.medicineName}</p>
                                  </div>
                                  <Input
                                    placeholder="Dosage"
                                    value={item.dosage}
                                    onChange={(e) => handleUpdateDosage(item.medicineId, e.target.value)}
                                    className="w-40"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateQuantity(item.medicineId, parseInt(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => handleRemoveMedicine(item.medicineId)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handlePrescribe} disabled={prescriptionItems.length === 0}>
                          <Pill className="h-4 w-4 mr-2" />
                          Create Prescription
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Refer */}
                  <Button 
                    className="h-auto py-6 flex-col gap-2 bg-transparent" 
                    variant="outline"
                    onClick={() => completeConsultation(currentDoctor.id, 'refer')}
                  >
                    <ArrowRight className="h-8 w-8" />
                    <span>Refer to Specialist</span>
                    <span className="text-xs text-muted-foreground">Transfer to another doctor</span>
                  </Button>

                  {/* Admit */}
                  <Dialog open={showAdmitDialog} onOpenChange={setShowAdmitDialog}>
                    <DialogTrigger asChild>
                      <Button className="h-auto py-6 flex-col gap-2 bg-transparent" variant="outline">
                        <BedDouble className="h-8 w-8" />
                        <span>Admit Patient</span>
                        <span className="text-xs text-muted-foreground">Allocate bed</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Admit Patient</DialogTitle>
                        <DialogDescription>
                          Select bed type for {currentPatient.name}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          {(['general', 'icu', 'emergency'] as const).map(type => (
                            <div
                              key={type}
                              className={cn(
                                'p-4 rounded-lg border-2 cursor-pointer text-center transition-all',
                                selectedBedType === type 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-primary/50'
                              )}
                              onClick={() => setSelectedBedType(type)}
                            >
                              <BedDouble className={cn(
                                'h-8 w-8 mx-auto mb-2',
                                type === 'icu' && 'text-warning',
                                type === 'emergency' && 'text-destructive'
                              )} />
                              <p className="font-medium capitalize">{type}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdmitDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAdmit}>
                          <BedDouble className="h-4 w-4 mr-2" />
                          Confirm Admission
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Stethoscope className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Patient in Consultation</h3>
              <p className="text-muted-foreground mb-4">
                {queuePatients.length > 0 
                  ? `${queuePatients.length} patients waiting in queue`
                  : 'No patients in queue'
                }
              </p>
              {queuePatients.length > 0 && (
                <Button onClick={handleCallNext}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Call Next Patient
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
