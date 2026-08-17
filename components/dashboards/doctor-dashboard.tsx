'use client';

import { useState } from 'react';
import { useHospital } from '@/lib/hospital-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  CheckCircle2,
  Search,
  Send,
  Sparkles,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrescriptionItem, Patient } from '@/lib/types';

export function DoctorDashboard({ activeTab }: { activeTab: string }) {
  const {
    patients,
    doctors,
    medicines,
    prescriptions,
    callNextPatient,
    completeConsultation,
    createPrescription,
    admitPatient,
    getWaitingTime
  } = useHospital();

  // Allow switching doctors for demo purposes
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('D001');
  const currentDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Prescription Form state
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>('');
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [targetPatient, setTargetPatient] = useState<Patient | null>(null);
  
  // Custom Medicine Input state
  const [medSearch, setMedSearch] = useState('');
  const [customMedName, setCustomMedName] = useState('');
  const [customDosage, setCustomDosage] = useState('1 tablet twice daily after meals');
  const [customQty, setCustomQty] = useState(10);
  const [customInstructions, setCustomInstructions] = useState('');
  const [showCustomMed, setShowCustomMed] = useState(false);

  // Admission & Toast state
  const [showAdmitDialog, setShowAdmitDialog] = useState(false);
  const [selectedBedType, setSelectedBedType] = useState<'general' | 'icu' | 'emergency'>('general');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [prescriptionSearch, setPrescriptionSearch] = useState('');

  const queuePatients = patients.filter(
    p => p.assignedDoctor === currentDoctor.id && p.status === 'waiting'
  );
  const currentPatient = patients.find(
    p => p.assignedDoctor === currentDoctor.id && p.status === 'in-consultation'
  );

  const doctorPrescriptions = prescriptions.filter(
    p => p.doctorId === currentDoctor.id
  );

  const handleCallNext = () => {
    callNextPatient(currentDoctor.id);
  };

  const openPrescribeModal = (patient: Patient) => {
    setTargetPatient(patient);
    setPrescriptionItems([]);
    setPrescriptionNotes('');
    setShowPrescriptionDialog(true);
  };

  const handleAddInventoryMedicine = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine && !prescriptionItems.find(i => i.medicineId === medicineId)) {
      setPrescriptionItems(prev => [...prev, {
        medicineId,
        medicineName: medicine.name,
        dosage: '1 tablet twice daily after meals',
        quantity: 10,
        instructions: 'Take with plenty of water',
      }]);
    }
  };

  const handleAddCustomMedicine = () => {
    if (!customMedName.trim()) return;
    const newId = `CUSTOM_${Date.now()}`;
    setPrescriptionItems(prev => [...prev, {
      medicineId: newId,
      medicineName: customMedName.trim(),
      dosage: customDosage || '1 tablet daily',
      quantity: customQty || 1,
      instructions: customInstructions || undefined,
    }]);
    setCustomMedName('');
    setCustomDosage('1 tablet twice daily after meals');
    setCustomQty(10);
    setCustomInstructions('');
    setShowCustomMed(false);
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

  const handleUpdateInstructions = (medicineId: string, instructions: string) => {
    setPrescriptionItems(prev => prev.map(i =>
      i.medicineId === medicineId ? { ...i, instructions } : i
    ));
  };

  const handlePrescribeSubmit = () => {
    const patientToPrescribe = targetPatient || currentPatient;
    if (patientToPrescribe && prescriptionItems.length > 0) {
      const rx = createPrescription(
        patientToPrescribe.id,
        currentDoctor.id,
        prescriptionItems,
        prescriptionNotes
      );
      
      if (currentPatient && currentPatient.id === patientToPrescribe.id) {
        completeConsultation(currentDoctor.id, 'prescribe');
      }

      setSuccessToast(`Prescription #${rx.id} successfully created and sent to Pharmacy Staff Dashboard!`);
      setTimeout(() => setSuccessToast(null), 6000);

      setPrescriptionItems([]);
      setPrescriptionNotes('');
      setShowPrescriptionDialog(false);
      setTargetPatient(null);
    }
  };

  const handleAdmit = () => {
    if (currentPatient) {
      admitPatient(currentPatient.id, selectedBedType);
      completeConsultation(currentDoctor.id, 'admit');
      setShowAdmitDialog(false);
      setSuccessToast(`Patient ${currentPatient.name} admitted to ${selectedBedType.toUpperCase()} ward.`);
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(medSearch.toLowerCase())
  );

  const filteredDoctorPrescriptions = doctorPrescriptions.filter(p => {
    const q = prescriptionSearch.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      (p.patientName && p.patientName.toLowerCase().includes(q)) ||
      p.patientId.toLowerCase().includes(q) ||
      p.items.some(i => i.medicineName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Banner */}
      {successToast && (
        <div className="p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-medium">{successToast}</p>
          </div>
          <Button size="xs" variant="ghost" onClick={() => setSuccessToast(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Doctor Switch Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-3.5 rounded-lg border shadow-xs">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Consultation Panel</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Viewing as:</span>
          <Select value={currentDoctor.id} onValueChange={setSelectedDoctorId}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Select Doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.specialization})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeTab === 'queue' && (
        <>
          {/* Queue Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  In Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{queuePatients.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Est. Clear Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">
                  {queuePatients.length * currentDoctor.avgConsultationTime} min
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Emergency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-destructive">
                  {queuePatients.filter(p => p.classification === 'emergency').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Today Seen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">
                  {patients.filter(p =>
                    p.assignedDoctor === currentDoctor.id &&
                    ['pharmacy', 'admitted', 'discharged'].includes(p.status)
                  ).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Queue */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Patient Queue ({queuePatients.length})</CardTitle>
                  <CardDescription>Patients waiting for consultation with {currentDoctor.name}</CardDescription>
                </div>
                <Button
                  onClick={handleCallNext}
                  disabled={queuePatients.length === 0 || currentPatient !== undefined}
                  className="w-full sm:w-auto"
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
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border transition-all min-w-0',
                        index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card',
                        patient.classification === 'emergency' && 'border-destructive/50'
                      )}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                          index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium truncate">{patient.name}</span>
                            <Badge variant="outline" className="font-mono text-xs">#{patient.tokenNumber}</Badge>
                            {patient.classification === 'emergency' && (
                              <Badge variant="destructive" className="text-xs">Emergency</Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {patient.age} yrs, {patient.gender} | {patient.symptoms}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div>
                          <p className="text-xs sm:text-sm font-medium">~{getWaitingTime(patient.id)} min wait</p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground">
                            Registered: {new Date(patient.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPrescribeModal(patient)}
                          className="ml-2"
                        >
                          <Pill className="h-3.5 w-3.5 mr-1 text-primary" />
                          Prescribe
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patients currently waiting in queue</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'patient' && (
        <>
          {currentPatient ? (
            <>
              {/* Current Patient Info */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl sm:text-2xl truncate">{currentPatient.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Patient ID: {currentPatient.id} | Token: #{currentPatient.tokenNumber}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={
                      currentPatient.classification === 'emergency' ? 'destructive' :
                        currentPatient.classification === 'specialist' ? 'secondary' : 'default'
                    } className="text-xs sm:text-sm px-3 py-1 self-start sm:self-auto">
                      {currentPatient.classification.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="text-base sm:text-lg font-semibold">{currentPatient.age} years</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p className="text-base sm:text-lg font-semibold capitalize">{currentPatient.gender}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Mobile</p>
                      <p className="text-base sm:text-lg font-semibold">{currentPatient.mobile}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Registered</p>
                      <p className="text-base sm:text-lg font-semibold">
                        {new Date(currentPatient.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <h4 className="font-medium mb-1 text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Symptoms & Chief Complaints
                    </h4>
                    <p className="text-sm text-foreground/90">{currentPatient.symptoms}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Consultation Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Consultation & Prescription Actions</CardTitle>
                  <CardDescription>Issue prescription or direct patient workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Prescribe Action Button */}
                    <Button
                      className="h-auto py-6 flex-col gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary hover:text-primary"
                      variant="outline"
                      onClick={() => openPrescribeModal(currentPatient)}
                    >
                      <Pill className="h-8 w-8 text-primary" />
                      <span className="font-semibold text-base">Give Prescription</span>
                      <span className="text-xs text-muted-foreground">Directly syncs to Pharmacy Staff Dashboard</span>
                    </Button>

                    {/* Refer */}
                    <Button
                      className="h-auto py-6 flex-col gap-2 bg-transparent"
                      variant="outline"
                      onClick={() => {
                        completeConsultation(currentDoctor.id, 'refer');
                        setSuccessToast(`Patient referred to specialist.`);
                        setTimeout(() => setSuccessToast(null), 4000);
                      }}
                    >
                      <ArrowRight className="h-8 w-8" />
                      <span className="font-semibold text-base">Refer to Specialist</span>
                      <span className="text-xs text-muted-foreground">Transfer to specialized doctor queue</span>
                    </Button>

                    {/* Admit */}
                    <Button
                      className="h-auto py-6 flex-col gap-2 bg-transparent"
                      variant="outline"
                      onClick={() => setShowAdmitDialog(true)}
                    >
                      <BedDouble className="h-8 w-8" />
                      <span className="font-semibold text-base">Admit Patient</span>
                      <span className="text-xs text-muted-foreground">Allocate inpatient bed</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Stethoscope className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Patient in Consultation</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  {queuePatients.length > 0
                    ? `${queuePatients.length} patient(s) currently waiting in your queue.`
                    : 'Your queue is empty right now.'
                  }
                </p>
                {queuePatients.length > 0 && (
                  <Button onClick={handleCallNext}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Call Next Patient ({queuePatients[0].name})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Issued Prescriptions Log ({doctorPrescriptions.length})
                  </CardTitle>
                  <CardDescription>
                    All prescriptions issued by {currentDoctor.name} and their real-time pharmacy status
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prescription / patient..."
                    value={prescriptionSearch}
                    onChange={(e) => setPrescriptionSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDoctorPrescriptions.length > 0 ? (
                <div className="space-y-4">
                  {filteredDoctorPrescriptions.map(rx => (
                    <div key={rx.id} className="p-4 rounded-lg border bg-card hover:border-primary/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs bg-muted">
                            {rx.id}
                          </Badge>
                          <span className="font-semibold text-base">{rx.patientName || rx.patientId}</span>
                          <span className="text-xs text-muted-foreground">
                            Patient ID: {rx.patientId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Issued: {new Date(rx.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {rx.dispensed ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Dispensed by Pharmacy
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 animate-pulse">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending at Pharmacy
                            </Badge>
                          )}
                        </div>
                      </div>

                      {rx.notes && (
                        <div className="mb-3 text-xs bg-muted/60 p-2.5 rounded border text-muted-foreground">
                          <span className="font-semibold text-foreground">Diagnosis / Doctor Notes: </span>
                          {rx.notes}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prescribed Medicines ({rx.items.length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {rx.items.map((item, i) => (
                            <div key={i} className="p-2 rounded bg-muted/40 text-xs border">
                              <p className="font-medium text-foreground">{item.medicineName}</p>
                              <p className="text-muted-foreground">Dosage: {item.dosage}</p>
                              <p className="text-muted-foreground">Qty: {item.quantity}</p>
                              {item.instructions && (
                                <p className="text-[11px] text-primary mt-0.5">Note: {item.instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Pill className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No prescriptions found for this search filter.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CREATE PRESCRIPTION DIALOG */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pill className="h-6 w-6 text-primary" />
              Give Prescription
            </DialogTitle>
            <DialogDescription>
              Create a digital prescription for <strong className="text-foreground">{targetPatient?.name || currentPatient?.name}</strong>. It will immediately show in the Pharmacy Staff Dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Doctor Diagnosis Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Diagnosis / Clinical Notes (Optional)</Label>
              <Textarea
                placeholder="e.g. Acute Viral Bronchitis & mild fever. Rest well and hydrate."
                value={prescriptionNotes}
                onChange={(e) => setPrescriptionNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Medicine Selection Mode */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Select Medicines from Hospital Stock</Label>
                <Button
                  size="xs"
                  variant={showCustomMed ? 'secondary' : 'outline'}
                  onClick={() => setShowCustomMed(!showCustomMed)}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {showCustomMed ? 'Cancel Custom Medicine' : '+ Add Custom Medicine'}
                </Button>
              </div>

              {/* Custom Medicine Form toggle */}
              {showCustomMed && (
                <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Custom Medicine Entry (Outside standard inventory)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Medicine Name</Label>
                      <Input
                        placeholder="e.g. Azithromycin 500mg syrup"
                        value={customMedName}
                        onChange={(e) => setCustomMedName(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Dosage & Frequency</Label>
                      <Input
                        placeholder="e.g. 1 tab twice daily after meals"
                        value={customDosage}
                        onChange={(e) => setCustomDosage(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={customQty}
                        onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Special Instructions</Label>
                      <Input
                        placeholder="e.g. Take after breakfast for 5 days"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button size="sm" onClick={handleAddCustomMedicine} disabled={!customMedName.trim()} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1" /> Add to Prescription
                  </Button>
                </div>
              )}

              {/* Standard Inventory Selector */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search available medicines..."
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {filteredMedicines.map(medicine => {
                  const isSelected = !!prescriptionItems.find(i => i.medicineId === medicine.id);
                  return (
                    <div
                      key={medicine.id}
                      className={cn(
                        'flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors text-xs',
                        isSelected
                          ? 'bg-primary/10 border-primary font-medium'
                          : medicine.stock === 0
                            ? 'opacity-60 bg-muted/30 cursor-not-allowed'
                            : 'hover:bg-muted'
                      )}
                      onClick={() => {
                        if (medicine.stock > 0 || isSelected) {
                          if (isSelected) {
                            handleRemoveMedicine(medicine.id);
                          } else {
                            handleAddInventoryMedicine(medicine.id);
                          }
                        }
                      }}
                    >
                      <Checkbox checked={isSelected} readOnly />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{medicine.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Stock: <span className={medicine.stock < medicine.lowStockThreshold ? 'text-destructive font-semibold' : ''}>{medicine.stock} {medicine.unit}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Prescription Items */}
            {prescriptionItems.length > 0 ? (
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Prescription Summary ({prescriptionItems.length} items)
                </Label>
                <div className="space-y-2.5">
                  {prescriptionItems.map(item => (
                    <div key={item.medicineId} className="p-3 rounded-lg bg-muted/60 border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{item.medicineName}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveMedicine(item.medicineId)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Dosage & Schedule</Label>
                          <Input
                            placeholder="e.g. 1 tab twice daily"
                            value={item.dosage}
                            onChange={(e) => handleUpdateDosage(item.medicineId, e.target.value)}
                            className="text-xs h-8 bg-background"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Quantity</Label>
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.medicineId, parseInt(e.target.value) || 1)}
                            className="text-xs h-8 bg-background"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Special Note (Optional)</Label>
                          <Input
                            placeholder="e.g. After meals"
                            value={item.instructions || ''}
                            onChange={(e) => handleUpdateInstructions(item.medicineId, e.target.value)}
                            className="text-xs h-8 bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                <Info className="h-5 w-5 mx-auto mb-1 opacity-50" />
                Select medicines above or add a custom medicine to populate the prescription.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrescribeSubmit} disabled={prescriptionItems.length === 0} className="bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4 mr-2" />
              Send Prescription to Pharmacy Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADMIT PATIENT DIALOG */}
      <Dialog open={showAdmitDialog} onOpenChange={setShowAdmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admit Patient</DialogTitle>
            <DialogDescription>
              Select bed type for {currentPatient?.name}
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
                    type === 'icu' && 'text-amber-500',
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
  );
}
