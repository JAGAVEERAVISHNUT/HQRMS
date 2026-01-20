// User roles
export type UserRole = 'admin' | 'reception' | 'doctor' | 'pharmacy' | 'city';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department?: string;
}

// Patient types
export type PatientClassification = 'general' | 'specialist' | 'emergency';
export type PatientStatus = 'registered' | 'waiting' | 'in-consultation' | 'admitted' | 'discharged' | 'pharmacy';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  symptoms: string;
  classification: PatientClassification;
  status: PatientStatus;
  registeredAt: Date;
  assignedDoctor?: string;
  tokenNumber?: number;
  prescription?: Prescription;
  bedId?: string;
}

// Doctor types
export type DoctorStatus = 'available' | 'busy' | 'break' | 'offline';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  status: DoctorStatus;
  avgConsultationTime: number; // in minutes
  currentPatientId?: string;
  queue: string[]; // patient IDs
}

// Bed types
export type BedType = 'general' | 'icu' | 'emergency';
export type BedStatus = 'available' | 'occupied' | 'maintenance';

export interface Bed {
  id: string;
  type: BedType;
  status: BedStatus;
  patientId?: string;
  ward: string;
}

// Prescription & Medicine
export interface Medicine {
  id: string;
  name: string;
  stock: number;
  unit: string;
  lowStockThreshold: number;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  quantity: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  items: PrescriptionItem[];
  issuedAt: Date;
  dispensed: boolean;
}

// Analytics
export interface HourlyStats {
  hour: number;
  patientCount: number;
}

export interface BedUtilization {
  type: BedType;
  total: number;
  occupied: number;
  percentage: number;
}

// City Dashboard
export type HospitalLoadStatus = 'low' | 'medium' | 'high';

export interface HospitalSummary {
  id: string;
  name: string;
  availableBeds: number;
  totalBeds: number;
  icuAvailable: number;
  icuTotal: number;
  opdLoad: HospitalLoadStatus;
  emergencyCapacity: number;
}
