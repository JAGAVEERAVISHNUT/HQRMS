'use client';

import React from "react"

import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientFormData {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  symptoms: string;
}

const initialFormData: PatientFormData = {
  name: '',
  age: '',
  gender: 'male',
  mobile: '',
  symptoms: '',
};

export function ReceptionDashboard({ activeTab }: { activeTab: string }) {
  const { patients, doctors, registerPatient, getWaitingTime, getQueuePosition } = useHospital();
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [registrationSuccess, setRegistrationSuccess] = useState<{ id: string; token: number; classification: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const patient = registerPatient({
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      mobile: formData.mobile,
      symptoms: formData.symptoms,
    });

    setRegistrationSuccess({
      id: patient.id,
      token: patient.tokenNumber || 0,
      classification: patient.classification,
    });

    setFormData(initialFormData);

    setTimeout(() => setRegistrationSuccess(null), 5000);
  };

  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const emergencyPatients = patients.filter(p => p.classification === 'emergency' && p.status !== 'discharged');

  if (activeTab === 'registration') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Patient Registration
              </CardTitle>
              <CardDescription>Register a new patient for OPD consultation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter patient name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Age"
                      min="0"
                      max="150"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: 'male' | 'female' | 'other') => 
                        setFormData(prev => ({ ...prev, gender: value }))
                      }
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="555-0000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms / Complaints</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Describe the patient's symptoms..."
                    rows={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Keywords like &quot;chest pain&quot;, &quot;accident&quot;, or &quot;emergency&quot; will auto-classify as emergency
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Patient
                </Button>
              </form>

              {/* Success Message */}
              {registrationSuccess && (
                <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-success mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Patient Registered Successfully!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Patient ID</p>
                      <p className="font-mono font-bold">{registrationSuccess.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Token Number</p>
                      <p className="font-mono font-bold text-primary">#{registrationSuccess.token}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Classification</p>
                      <Badge variant={
                        registrationSuccess.classification === 'emergency' ? 'destructive' :
                        registrationSuccess.classification === 'specialist' ? 'secondary' : 'default'
                      }>
                        {registrationSuccess.classification}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today&apos;s Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {patients.filter(p => 
                    new Date(p.registeredAt).toDateString() === new Date().toDateString()
                  ).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Available Doctors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {doctors.filter(d => d.status === 'available').map(doctor => (
                    <div key={doctor.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{doctor.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{doctor.specialization}</Badge>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Waiting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{waitingPatients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {waitingPatients.length > 0 
                  ? Math.round(waitingPatients.reduce((acc, p) => acc + getWaitingTime(p.id), 0) / waitingPatients.length)
                  : 0} min
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                In Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {patients.filter(p => p.status === 'in-consultation').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {doctors.map(doctor => {
            const doctorPatients = patients.filter(p => p.assignedDoctor === doctor.id && p.status === 'waiting');
            const currentPatient = patients.find(p => p.assignedDoctor === doctor.id && p.status === 'in-consultation');
            
            return (
              <Card key={doctor.id}>
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
                  <CardDescription>{doctor.specialization}</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentPatient && (
                    <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground">Currently with</p>
                      <p className="font-medium">{currentPatient.name} (#{currentPatient.tokenNumber})</p>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    Queue: {doctorPatients.length} patients
                  </div>
                  
                  {doctorPatients.length > 0 ? (
                    <div className="space-y-1">
                      {doctorPatients.slice(0, 5).map((patient, index) => (
                        <div 
                          key={patient.id}
                          className={cn(
                            'flex items-center justify-between p-2 rounded text-sm',
                            index === 0 ? 'bg-accent' : 'bg-muted/50'
                          )}
                        >
                          <span>
                            <span className="font-mono text-primary">#{patient.tokenNumber}</span>
                            {' '}{patient.name}
                          </span>
                          <span className="text-muted-foreground">
                            ~{getWaitingTime(patient.id)} min
                          </span>
                        </div>
                      ))}
                      {doctorPatients.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{doctorPatients.length - 5} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No patients waiting</p>
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
              Emergency Cases
            </CardTitle>
            <CardDescription>Priority patients requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {emergencyPatients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Symptoms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emergencyPatients.map(patient => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono">{patient.id}</TableCell>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{patient.symptoms}</TableCell>
                      <TableCell>
                        <Badge variant={
                          patient.status === 'admitted' ? 'default' :
                          patient.status === 'in-consultation' ? 'secondary' : 'destructive'
                        }>
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(patient.registeredAt).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                <p>No emergency cases at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
