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

export function DoctorDashboard({ activeTab, onNavigateTab }: { activeTab: string; onNavigateTab?: (tab: string) => void }) {
  const {
    patients,
    doctors,
    medicines,
    prescriptions,
    callNextPatient,
    completeConsultation,
    createPrescription,
    admitPatient,
    updatePatientStatus,
    getWaitingTime,
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

  // Admission, Referral & Toast state
  const [showAdmitDialog, setShowAdmitDialog] = useState(false);
  const [selectedBedType, setSelectedBedType] = useState<'general' | 'icu' | 'emergency'>('general');
  const [showReferDialog, setShowReferDialog] = useState(false);
  const [selectedReferralDoctorId, setSelectedReferralDoctorId] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);

  const queuePatients = patients.filter(
    p => p.assignedDoctor === currentDoctor.id && p.status === 'waiting'
  );

  const currentPatient = patients.find(
    p => p.id === currentDoctor.currentPatientId ||
      (p.assignedDoctor === currentDoctor.id && p.status === 'in-consultation')
  );

  const displayedPrescriptions = showAllPrescriptions
    ? prescriptions
    : prescriptions.filter(p => p.doctorId === currentDoctor.id);

  const handleCallNext = () => {
    const called = callNextPatient(currentDoctor.id);
    if (called) {
      setSuccessToast(`Now consulting ${called.name} (Token #${called.tokenNumber})`);
      setTimeout(() => setSuccessToast(null), 4000);
      if (onNavigateTab) {
        onNavigateTab('patient');
      }
    } else {
      setSuccessToast('No waiting patients found for this doctor.');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleConsultSpecificPatient = (patientId: string) => {
    const p = callNextPatient(currentDoctor.id, patientId);
    if (p) {
      setSuccessToast(`Now consulting ${p.name} (Token #${p.tokenNumber})`);
      setTimeout(() => setSuccessToast(null), 4000);
      if (onNavigateTab) {
        onNavigateTab('patient');
      }
    }
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
        instructions: 'Take after meals',
      }]);
    }
  };

  const handleAddCustomMedicine = () => {
    if (!customMedName.trim()) return;
    const newId = `CUSTOM_${Date.now().toString().slice(-4)}`;
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

      setSuccessToast(`Prescription #${rx.id} issued & dispatched to Pharmacy Staff Dashboard!`);
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
      setShowAdmitDialog(false);
      setSuccessToast(`Patient ${currentPatient.name} admitted to ${selectedBedType.toUpperCase()} ward.`);
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  const handleReferralSubmit = () => {
    if (currentPatient && selectedReferralDoctorId) {
      const refDoctor = doctors.find(d => d.id === selectedReferralDoctorId);
      completeConsultation(currentDoctor.id, 'refer', selectedReferralDoctorId);
      setShowReferDialog(false);
      setSuccessToast(`Patient ${currentPatient.name} transferred to ${refDoctor?.name || 'Specialist'}.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setSelectedReferralDoctorId('');
    }
  };

  const handleDischargeWithoutPrescription = () => {
    if (currentPatient) {
      updatePatientStatus(currentPatient.id, 'discharged');
      completeConsultation(currentDoctor.id, 'prescribe');
      setSuccessToast(`Patient ${currentPatient.name} marked healthy and discharged.`);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(medSearch.toLowerCase())
  );

  const filteredDoctorPrescriptions = displayedPrescriptions.filter(p => {
    const q = prescriptionSearch.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      (p.patientName && p.patientName.toLowerCase().includes(q)) ||
      p.patientId.toLowerCase().includes(q) ||
      (p.doctorName && p.doctorName.toLowerCase().includes(q)) ||
      p.items.some(i => i.medicineName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Banner */}
      {successToast && (
        <div className="p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-medium">{successToast}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSuccessToast(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Doctor Switch Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-3.5 rounded-lg border shadow-xs">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <div>
            <span className="font-semibold text-sm">Consultation Panel</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({queuePatients.length} patient{queuePatients.length !== 1 ? 's' : ''} waiting in queue)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Doctor Profile:</span>
          <Select value={currentDoctor.id} onValueChange={setSelectedDoctorId}>
            <SelectTrigger className="w-full sm:w-[320px]">
              <SelectValue placeholder="Select Doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name} &bull; {doctor.specialization} ({doctor.queue.length} in queue)
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
                  Completed Today
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
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Patient Queue ({queuePatients.length})
                  </CardTitle>
                  <CardDescription>Patients waiting for consultation with {currentDoctor.name}</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleCallNext}
                    disabled={queuePatients.length === 0}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Call Next Patient
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Active consultation indicator if any */}
              {currentPatient && (
                <div className="mb-4 p-3.5 rounded-lg bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Currently in Consultation</p>
                      <p className="font-semibold text-sm text-foreground">
                        {currentPatient.name} &bull; Token #{currentPatient.tokenNumber} ({currentPatient.age} yrs, {currentPatient.gender})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onNavigateTab && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateTab('patient')}
                        className="text-xs h-8"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Patient Details
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => openPrescribeModal(currentPatient)}
                      className="bg-primary hover:bg-primary/90 text-xs h-8 w-full sm:w-auto"
                    >
                      <Pill className="h-3.5 w-3.5 mr-1" /> Prescribe & Complete
                    </Button>
                  </div>
                </div>
              )}

              {queuePatients.length > 0 ? (
                <div className="space-y-2.5">
                  {queuePatients.map((patient, index) => (
                    <div
                      key={patient.id}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-all',
                        index === 0 ? 'bg-primary/5 border-primary/25 shadow-2xs' : 'bg-card',
                        patient.classification === 'emergency' && 'border-destructive/50 bg-destructive/5'
                      )}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                          index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          #{index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{patient.name}</span>
                            <Badge variant="outline" className="font-mono text-xs">Token #{patient.tokenNumber}</Badge>
                            {patient.classification === 'emergency' && (
                              <Badge variant="destructive" className="text-xs">Emergency</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {patient.age} yrs, {patient.gender} &bull; <span className="text-foreground/80">{patient.symptoms}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 justify-between sm:justify-end">
                        <div>
                          <p className="text-xs font-semibold text-foreground">~{getWaitingTime(patient.id)} min wait</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(patient.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 ml-2">
                          <Button
                            size="sm"
                            onClick={() => handleConsultSpecificPatient(patient.id)}
                            className="text-xs h-8"
                          >
                            <Stethoscope className="h-3.5 w-3.5 mr-1" />
                            Consult
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPrescribeModal(patient)}
                            className="text-xs h-8"
                          >
                            <Pill className="h-3.5 w-3.5 mr-1 text-primary" />
                            Prescribe
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500/70" />
                  <p className="font-medium text-foreground">No patients waiting in {currentDoctor.name}&apos;s queue</p>
                  {doctors.filter(d => d.id !== currentDoctor.id && d.queue.length > 0).length > 0 ? (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <p className="text-xs text-muted-foreground w-full">Patients waiting for other doctors:</p>
                      {doctors.filter(d => d.id !== currentDoctor.id && d.queue.length > 0).map(doc => (
                        <Button
                          key={doc.id}
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className="text-xs"
                        >
                          <Stethoscope className="h-3.5 w-3.5 mr-1 text-primary" />
                          Switch to {doc.name} ({doc.queue.length} waiting)
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      When reception registers a patient for this doctor, they appear here instantly.
                    </p>
                  )}
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
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="h-7 w-7 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl sm:text-2xl truncate">{currentPatient.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Patient ID: {currentPatient.id} &bull; Token: #{currentPatient.tokenNumber}
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
                    <div className="p-3 rounded-lg bg-muted/60 border">
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="text-base sm:text-lg font-semibold">{currentPatient.age} years</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/60 border">
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p className="text-base sm:text-lg font-semibold capitalize">{currentPatient.gender}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/60 border">
                      <p className="text-xs text-muted-foreground">Mobile</p>
                      <p className="text-base sm:text-lg font-semibold">{currentPatient.mobile}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/60 border">
                      <p className="text-xs text-muted-foreground">Registered</p>
                      <p className="text-base sm:text-lg font-semibold">
                        {new Date(currentPatient.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/40 border">
                    <h4 className="font-semibold mb-1 text-sm flex items-center gap-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Prescribe Action Button */}
                    <Button
                      className="h-auto py-5 flex-col gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary shadow-xs"
                      variant="outline"
                      onClick={() => openPrescribeModal(currentPatient)}
                    >
                      <Pill className="h-7 w-7 text-primary" />
                      <span className="font-semibold text-sm">Issue Prescription</span>
                      <span className="text-[11px] text-muted-foreground">Directly sends to Pharmacy Staff</span>
                    </Button>

                    {/* Refer */}
                    <Button
                      className="h-auto py-5 flex-col gap-2 bg-transparent"
                      variant="outline"
                      onClick={() => setShowReferDialog(true)}
                    >
                      <ArrowRight className="h-7 w-7" />
                      <span className="font-semibold text-sm">Refer to Specialist</span>
                      <span className="text-[11px] text-muted-foreground">Transfer to another doctor queue</span>
                    </Button>

                    {/* Admit */}
                    <Button
                      className="h-auto py-5 flex-col gap-2 bg-transparent"
                      variant="outline"
                      onClick={() => setShowAdmitDialog(true)}
                    >
                      <BedDouble className="h-7 w-7" />
                      <span className="font-semibold text-sm">Admit Patient</span>
                      <span className="text-[11px] text-muted-foreground">Allocate inpatient bed</span>
                    </Button>

                    {/* Complete & Discharge */}
                    <Button
                      className="h-auto py-5 flex-col gap-2 bg-transparent hover:bg-emerald-500/10 hover:border-emerald-500/30"
                      variant="outline"
                      onClick={handleDischargeWithoutPrescription}
                    >
                      <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-sm">Discharge Patient</span>
                      <span className="text-[11px] text-muted-foreground">Consultation complete, no meds</span>
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
                <p className="text-muted-foreground mb-4 text-center max-w-md text-sm">
                  {queuePatients.length > 0
                    ? `${queuePatients.length} patient(s) waiting in your queue. Call the next patient to begin.`
                    : 'Your queue is currently clear. You can call patients from the queue tab.'}
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
                    Issued Prescriptions Log ({displayedPrescriptions.length})
                  </CardTitle>
                  <CardDescription>
                    Digital prescriptions and their real-time pharmacy fulfillment status
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    size="sm"
                    variant={showAllPrescriptions ? 'secondary' : 'outline'}
                    onClick={() => setShowAllPrescriptions(!showAllPrescriptions)}
                    className="text-xs"
                  >
                    {showAllPrescriptions ? 'Showing All Hospital Prescriptions' : `Filter: ${currentDoctor.name} Only`}
                  </Button>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search prescription..."
                      value={prescriptionSearch}
                      onChange={(e) => setPrescriptionSearch(e.target.value)}
                      className="pl-8 text-xs h-9"
                    />
                  </div>
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
                          <span className="font-semibold text-base text-foreground">{rx.patientName || rx.patientId}</span>
                          <span className="text-xs text-muted-foreground">
                            Prescribed by {rx.doctorName || 'Doctor'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(rx.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {rx.dispensed ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Dispensed by Pharmacy
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs animate-pulse">
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
                            <div key={i} className="p-2.5 rounded bg-muted/40 text-xs border">
                              <p className="font-semibold text-foreground">{item.medicineName}</p>
                              <p className="text-muted-foreground text-[11px]">Dosage: {item.dosage}</p>
                              <p className="text-muted-foreground text-[11px]">Quantity: {item.quantity}</p>
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
                  <p>No prescriptions found matching search filter.</p>
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
              Issue Digital Prescription
            </DialogTitle>
            <DialogDescription>
              Prescribe medication for <strong className="text-foreground">{targetPatient?.name || currentPatient?.name}</strong>. It will immediately appear on the Pharmacy Staff Dashboard for dispensing.
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
                  size="sm"
                  variant={showCustomMed ? 'secondary' : 'outline'}
                  onClick={() => setShowCustomMed(!showCustomMed)}
                  className="text-xs h-7"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {showCustomMed ? 'Cancel Custom Entry' : '+ Add Custom Medicine'}
                </Button>
              </div>

              {/* Custom Medicine Form toggle */}
              {showCustomMed && (
                <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Custom Medicine Entry
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Medicine Name</Label>
                      <Input
                        placeholder="e.g. Azithromycin 500mg"
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
                        onChange={(e) => setCustomQty(parseInt(e.target.value, 10) || 1)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Special Instructions</Label>
                      <Input
                        placeholder="e.g. For 5 days"
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
                      <Checkbox checked={isSelected} />
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
                            onChange={(e) => handleUpdateQuantity(item.medicineId, parseInt(e.target.value, 10) || 1)}
                            className="text-xs h-8 bg-background"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Special Note</Label>
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
                Select medicines from the list above or add custom entries to compile the prescription.
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
                  <p className="font-medium capitalize text-sm">{type}</p>
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

      {/* REFERRAL DIALOG */}
      <Dialog open={showReferDialog} onOpenChange={setShowReferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Refer Patient to Specialist
            </DialogTitle>
            <DialogDescription>
              Transfer <strong className="text-foreground">{currentPatient?.name}</strong> to another department or doctor queue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Select Specialist Doctor</Label>
              <Select value={selectedReferralDoctorId} onValueChange={setSelectedReferralDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose specialist doctor..." />
                </SelectTrigger>
                <SelectContent>
                  {doctors.filter(d => d.id !== currentDoctor.id).map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} &bull; {doc.specialization} ({doc.queue.length} in queue)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReferDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReferralSubmit}
              disabled={!selectedReferralDoctorId}
              className="bg-primary hover:bg-primary/90"
            >
              Transfer Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
