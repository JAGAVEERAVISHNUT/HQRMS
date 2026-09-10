'use client';

import React, { useState } from 'react';
import { useHospital } from '@/lib/hospital-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Stethoscope,
  ArrowRightLeft,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientFormData {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  symptoms: string;
  department: string;
  preferredDoctorId: string;
}

const initialFormData: PatientFormData = {
  name: '',
  age: '',
  gender: 'male',
  mobile: '',
  symptoms: '',
  department: 'auto',
  preferredDoctorId: 'auto',
};

interface RegistrationSuccessInfo {
  id: string;
  token: number;
  classification: string;
  doctorName: string;
  doctorSpecialization: string;
  queuePosition: number;
}

export function ReceptionDashboard({ activeTab }: { activeTab: string }) {
  const { patients, doctors, registerPatient, assignDoctorToPatient, getWaitingTime, getQueuePosition } = useHospital();
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [registrationSuccess, setRegistrationSuccess] = useState<RegistrationSuccessInfo | null>(null);
  const [transferringPatientId, setTransferringPatientId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const patient = registerPatient({
      name: formData.name.trim(),
      age: parseInt(formData.age, 10),
      gender: formData.gender,
      mobile: formData.mobile.trim(),
      symptoms: formData.symptoms.trim(),
      department: formData.department !== 'auto' ? formData.department : undefined,
      preferredDoctorId: formData.preferredDoctorId !== 'auto' ? formData.preferredDoctorId : undefined,
    });

    const assignedDoc = doctors.find(d => d.id === patient.assignedDoctor);

    setRegistrationSuccess({
      id: patient.id,
      token: patient.tokenNumber || 0,
      classification: patient.classification,
      doctorName: assignedDoc ? assignedDoc.name : 'Assigned Doctor',
      doctorSpecialization: assignedDoc ? assignedDoc.specialization : 'General',
      queuePosition: getQueuePosition(patient.id) || 1,
    });

    setFormData(initialFormData);
    setTimeout(() => setRegistrationSuccess(null), 8000);
  };

  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const emergencyPatients = patients.filter(p => p.classification === 'emergency' && p.status !== 'discharged');

  // Filter available doctors for the department selected
  const availableDoctorsForDept = formData.department === 'auto'
    ? doctors
    : doctors.filter(d => d.specialization.toLowerCase() === formData.department.toLowerCase());

  if (activeTab === 'registration') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Patient Registration & Doctor Queue Routing
              </CardTitle>
              <CardDescription>
                Register a new OPD patient. The data automatically routes to the chosen doctor&apos;s queue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Age in years"
                      min="0"
                      max="125"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: 'male' | 'female' | 'other') =>
                        setFormData(prev => ({ ...prev, gender: value }))
                      }
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>
                </div>

                {/* Routing & Doctor Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-1.5 text-xs font-semibold">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Target Department
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, department: value, preferredDoctorId: 'auto' }))
                      }
                    >
                      <SelectTrigger id="department" className="bg-background text-xs">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-Detect from Symptoms</SelectItem>
                        <SelectItem value="General Medicine">General Medicine</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredDoctor" className="flex items-center gap-1.5 text-xs font-semibold">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      Assign Doctor
                    </Label>
                    <Select
                      value={formData.preferredDoctorId}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, preferredDoctorId: value }))
                      }
                    >
                      <SelectTrigger id="preferredDoctor" className="bg-background text-xs">
                        <SelectValue placeholder="Auto-assign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-Assign (Least Waiting Queue)</SelectItem>
                        {availableDoctorsForDept.map(doctor => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name} ({doctor.specialization} &bull; {doctor.queue.length} waiting)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms & Clinical Complaints *</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Describe patient symptoms (e.g. Acute chest discomfort, high fever and dry cough...)"
                    rows={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Keywords like &quot;chest pain&quot;, &quot;accident&quot;, or &quot;emergency&quot; will auto-classify as Emergency.
                  </p>
                </div>

                <Button type="submit" className="w-full text-sm font-medium">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Patient & Forward to Doctor
                </Button>
              </form>

              {/* Success Message */}
              {registrationSuccess && (
                <div className="mt-5 p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Patient Registered & Dispatched to Doctor Queue!</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-background/80 p-2.5 rounded border">
                      <p className="text-muted-foreground">Patient ID</p>
                      <p className="font-mono font-bold text-sm text-foreground">{registrationSuccess.id}</p>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded border">
                      <p className="text-muted-foreground">Token Number</p>
                      <p className="font-mono font-bold text-sm text-primary">#{registrationSuccess.token}</p>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded border">
                      <p className="text-muted-foreground">Assigned Doctor</p>
                      <p className="font-semibold text-foreground truncate">{registrationSuccess.doctorName}</p>
                      <p className="text-[11px] text-muted-foreground">{registrationSuccess.doctorSpecialization}</p>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded border">
                      <p className="text-muted-foreground">Queue Position</p>
                      <p className="font-semibold text-foreground">Position #{registrationSuccess.queuePosition}</p>
                      <Badge variant={
                        registrationSuccess.classification === 'emergency' ? 'destructive' :
                        registrationSuccess.classification === 'specialist' ? 'secondary' : 'default'
                      } className="text-[10px] mt-1">
                        {registrationSuccess.classification.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Info & Doctor Roster */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today&apos;s OPD Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {patients.filter(p =>
                    new Date(p.registeredAt).toDateString() === new Date().toDateString()
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {waitingPatients.length} currently waiting for consultation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Hospital Doctor Queues</span>
                  <Badge variant="outline" className="text-xs">{doctors.length} Doctors</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {doctors.map(doctor => (
                    <div
                      key={doctor.id}
                      className="p-2.5 rounded-lg bg-muted/40 border flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
                          {doctor.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{doctor.specialization}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={doctor.queue.length > 0 ? 'secondary' : 'outline'} className="text-[11px]">
                          {doctor.queue.length} in queue
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'queue') {
    return (
      <div className="space-y-6">
        {/* Queue Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Total Waiting in OPD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{waitingPatients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Avg Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {waitingPatients.length > 0
                  ? Math.round(waitingPatients.reduce((acc, p) => acc + getWaitingTime(p.id), 0) / waitingPatients.length)
                  : 0} min
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-emerald-500" />
                Currently in Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">
                {patients.filter(p => p.status === 'in-consultation').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {doctors.map(doctor => {
            const doctorPatients = patients.filter(p => p.assignedDoctor === doctor.id && p.status === 'waiting');
            const currentPatient = patients.find(p => p.id === doctor.currentPatientId || (p.assignedDoctor === doctor.id && p.status === 'in-consultation'));

            return (
              <Card key={doctor.id} className="border hover:border-primary/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      {doctor.name}
                    </CardTitle>
                    <Badge variant={
                      doctor.status === 'available' ? 'default' :
                      doctor.status === 'busy' ? 'secondary' : 'outline'
                    }>
                      {doctor.status}
                    </Badge>
                  </div>
                  <CardDescription>{doctor.specialization} &bull; ~{doctor.avgConsultationTime} min/patient</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentPatient && (
                    <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground">In Consultation Now</p>
                        <p className="font-semibold text-foreground text-sm">{currentPatient.name} (#{currentPatient.tokenNumber})</p>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
                    </div>
                  )}

                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Waiting Queue ({doctorPatients.length})
                  </div>

                  {doctorPatients.length > 0 ? (
                    <div className="space-y-1.5">
                      {doctorPatients.map((patient, index) => (
                        <div
                          key={patient.id}
                          className={cn(
                            'flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded text-xs border',
                            index === 0 ? 'bg-primary/10 border-primary/30' : 'bg-muted/40'
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-primary">#{patient.tokenNumber}</span>
                              <span className="font-medium text-foreground truncate">{patient.name}</span>
                              {patient.classification === 'emergency' && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">Emergency</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{patient.symptoms}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
                            <span className="text-muted-foreground text-[11px]">
                              ~{getWaitingTime(patient.id)} min
                            </span>

                            {/* Transfer Doctor Option */}
                            {transferringPatientId === patient.id ? (
                              <Select
                                onValueChange={(newDocId) => {
                                  assignDoctorToPatient(patient.id, newDocId);
                                  setTransferringPatientId(null);
                                }}
                              >
                                <SelectTrigger className="h-7 text-[11px] w-36">
                                  <SelectValue placeholder="Move to doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {doctors.filter(d => d.id !== doctor.id).map(d => (
                                    <SelectItem key={d.id} value={d.id} className="text-xs">
                                      {d.name} ({d.queue.length})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setTransferringPatientId(patient.id)}
                                className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
                                title="Reassign to another doctor"
                              >
                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                Reassign
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2 italic text-center">
                      No patients currently waiting in this doctor&apos;s queue
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'emergency') {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency Cases Queue
            </CardTitle>
            <CardDescription>Priority patients requiring immediate medical attention</CardDescription>
          </CardHeader>
          <CardContent>
            {emergencyPatients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Symptoms</TableHead>
                    <TableHead>Doctor Assigned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emergencyPatients.map(patient => {
                    const doc = doctors.find(d => d.id === patient.assignedDoctor);
                    return (
                      <TableRow key={patient.id}>
                        <TableCell className="font-mono font-bold text-primary">#{patient.tokenNumber}</TableCell>
                        <TableCell className="font-mono">{patient.id}</TableCell>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{patient.symptoms}</TableCell>
                        <TableCell>
                          {doc ? `${doc.name} (${doc.specialization})` : 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            patient.status === 'admitted' ? 'default' :
                            patient.status === 'in-consultation' ? 'secondary' : 'destructive'
                          }>
                            {patient.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(patient.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                <p>No emergency cases currently pending</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
