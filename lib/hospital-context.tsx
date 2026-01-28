'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  User,
  Patient,
  Doctor,
  Bed,
  Medicine,
  Prescription,
  PatientClassification,
  PatientStatus,
  DoctorStatus,
  BedStatus,
} from './types';
import {
  mockUsers,
  initialDoctors,
  initialBeds,
  initialMedicines,
  initialPatients,
  generatePatientId,
  generatePrescriptionId,
  classifyPatient,
  calculateWaitingTime,
} from './store';

interface HospitalContextType {
  // Auth
  currentUser: User | null;
  login: (role: User['role']) => void;
  logout: () => void;

  // Patients
  patients: Patient[];
  registerPatient: (data: Omit<Patient, 'id' | 'classification' | 'status' | 'registeredAt' | 'tokenNumber'>) => Patient;
  updatePatientStatus: (patientId: string, status: PatientStatus) => void;
  assignDoctorToPatient: (patientId: string, doctorId: string) => void;

  // Doctors
  doctors: Doctor[];
  updateDoctorStatus: (doctorId: string, status: DoctorStatus) => void;
  callNextPatient: (doctorId: string) => Patient | null;
  completeConsultation: (doctorId: string, action: 'prescribe' | 'refer' | 'admit') => void;

  // Beds
  beds: Bed[];
  admitPatient: (patientId: string, bedType: Bed['type']) => Bed | null;
  dischargePatient: (bedId: string) => void;
  updateBedStatus: (bedId: string, status: BedStatus) => void;

  // Medicines & Prescriptions
  medicines: Medicine[];
  prescriptions: Prescription[];
  createPrescription: (patientId: string, doctorId: string, items: Prescription['items']) => Prescription;
  dispensePrescription: (prescriptionId: string) => void;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  updateMedicineStock: (medicineId: string, newStock: number) => void;

  // Utilities
  getWaitingTime: (patientId: string) => number;
  getQueuePosition: (patientId: string) => number;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

let tokenCounter = 100;

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [beds, setBeds] = useState<Bed[]>(initialBeds);
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Auth
  const login = useCallback((role: User['role']) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Patient Registration
  const registerPatient = useCallback((data: Omit<Patient, 'id' | 'classification' | 'status' | 'registeredAt' | 'tokenNumber'>) => {
    const classification = classifyPatient(data.symptoms, data.age);
    const tokenNumber = ++tokenCounter;

    const newPatient: Patient = {
      ...data,
      id: generatePatientId(),
      classification,
      status: 'registered',
      registeredAt: new Date(),
      tokenNumber,
    };

    // Auto-assign to available doctor based on classification
    const availableDoctor = doctors.find(d => {
      if (classification === 'emergency') return d.specialization === 'Emergency' && d.status === 'available';
      if (classification === 'specialist') return d.specialization !== 'General Medicine' && d.specialization !== 'Emergency' && d.status === 'available';
      return d.specialization === 'General Medicine' && d.status === 'available';
    }) || doctors.find(d => d.status === 'available');

    if (availableDoctor) {
      newPatient.assignedDoctor = availableDoctor.id;
      newPatient.status = classification === 'emergency' ? 'waiting' : 'waiting';

      setDoctors(prev => prev.map(d =>
        d.id === availableDoctor.id
          ? { ...d, queue: [...d.queue, newPatient.id] }
          : d
      ));
    }

    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  }, [doctors]);

  const updatePatientStatus = useCallback((patientId: string, status: PatientStatus) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, status } : p
    ));
  }, []);

  const assignDoctorToPatient = useCallback((patientId: string, doctorId: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, assignedDoctor: doctorId, status: 'waiting' } : p
    ));
    setDoctors(prev => prev.map(d =>
      d.id === doctorId ? { ...d, queue: [...d.queue, patientId] } : d
    ));
  }, []);

  // Doctor Operations
  const updateDoctorStatus = useCallback((doctorId: string, status: DoctorStatus) => {
    setDoctors(prev => prev.map(d =>
      d.id === doctorId ? { ...d, status } : d
    ));
  }, []);

  const callNextPatient = useCallback((doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor || doctor.queue.length === 0) return null;

    const nextPatientId = doctor.queue[0];
    const patient = patients.find(p => p.id === nextPatientId);

    if (patient) {
      setDoctors(prev => prev.map(d =>
        d.id === doctorId
          ? { ...d, queue: d.queue.slice(1), currentPatientId: nextPatientId, status: 'busy' }
          : d
      ));
      setPatients(prev => prev.map(p =>
        p.id === nextPatientId ? { ...p, status: 'in-consultation' } : p
      ));
    }

    return patient || null;
  }, [doctors, patients]);

  const completeConsultation = useCallback((doctorId: string, action: 'prescribe' | 'refer' | 'admit') => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor || !doctor.currentPatientId) return;

    const patientId = doctor.currentPatientId;

    setDoctors(prev => prev.map(d =>
      d.id === doctorId
        ? { ...d, currentPatientId: undefined, status: 'available' }
        : d
    ));

    if (action === 'prescribe') {
      setPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, status: 'pharmacy' } : p
      ));
    } else if (action === 'admit') {
      // Patient will be admitted through bed management
      setPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, status: 'registered' } : p
      ));
    }
  }, [doctors]);

  // Bed Management
  const admitPatient = useCallback((patientId: string, bedType: Bed['type']) => {
    const availableBed = beds.find(b => b.type === bedType && b.status === 'available');
    if (!availableBed) return null;

    setBeds(prev => prev.map(b =>
      b.id === availableBed.id ? { ...b, status: 'occupied', patientId } : b
    ));
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, status: 'admitted', bedId: availableBed.id } : p
    ));

    return availableBed;
  }, [beds]);

  const dischargePatient = useCallback((bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || !bed.patientId) return;

    setPatients(prev => prev.map(p =>
      p.id === bed.patientId ? { ...p, status: 'discharged', bedId: undefined } : p
    ));
    setBeds(prev => prev.map(b =>
      b.id === bedId ? { ...b, status: 'available', patientId: undefined } : b
    ));
  }, [beds]);

  const updateBedStatus = useCallback((bedId: string, status: BedStatus) => {
    setBeds(prev => prev.map(b =>
      b.id === bedId ? { ...b, status } : b
    ));
  }, []);

  // Pharmacy Operations
  const createPrescription = useCallback((patientId: string, doctorId: string, items: Prescription['items']) => {
    const prescription: Prescription = {
      id: generatePrescriptionId(),
      patientId,
      doctorId,
      items,
      issuedAt: new Date(),
      dispensed: false,
    };

    setPrescriptions(prev => [...prev, prescription]);
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, prescription, status: 'pharmacy' } : p
    ));

    return prescription;
  }, []);

  const dispensePrescription = useCallback((prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;

    // Deduct stock
    setMedicines(prev => prev.map(m => {
      const item = prescription.items.find(i => i.medicineId === m.id);
      if (item) {
        return { ...m, stock: Math.max(0, m.stock - item.quantity) };
      }
      return m;
    }));

    setPrescriptions(prev => prev.map(p =>
      p.id === prescriptionId ? { ...p, dispensed: true } : p
    ));

    setPatients(prev => prev.map(p =>
      p.id === prescription.patientId ? { ...p, status: 'discharged' } : p
    ));
  }, [prescriptions]);

  const addMedicine = useCallback((medicine: Omit<Medicine, 'id'>) => {
    const newMedicine: Medicine = {
      ...medicine,
      id: `MED${Date.now()}`, // Simple ID generation
    };
    setMedicines(prev => [...prev, newMedicine]);
  }, []);

  const updateMedicineStock = useCallback((medicineId: string, newStock: number) => {
    setMedicines(prev => prev.map(m =>
      m.id === medicineId ? { ...m, stock: newStock } : m
    ));
  }, []);

  // Utilities
  const getWaitingTime = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.assignedDoctor) return -1;

    const doctor = doctors.find(d => d.id === patient.assignedDoctor);
    if (!doctor) return -1;

    const position = doctor.queue.indexOf(patientId);
    if (position === -1) return 0;

    const availableDoctorsCount = doctors.filter(d =>
      d.status === 'available' && d.specialization === doctor.specialization
    ).length || 1;

    return calculateWaitingTime(position, doctor.avgConsultationTime, availableDoctorsCount);
  }, [patients, doctors]);

  const getQueuePosition = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.assignedDoctor) return -1;

    const doctor = doctors.find(d => d.id === patient.assignedDoctor);
    if (!doctor) return -1;

    return doctor.queue.indexOf(patientId) + 1;
  }, [patients, doctors]);

  return (
    <HospitalContext.Provider value={{
      currentUser,
      login,
      logout,
      patients,
      registerPatient,
      updatePatientStatus,
      assignDoctorToPatient,
      doctors,
      updateDoctorStatus,
      callNextPatient,
      completeConsultation,
      beds,
      admitPatient,
      dischargePatient,
      updateBedStatus,
      medicines,
      prescriptions,
      createPrescription,
      dispensePrescription,
      addMedicine,
      updateMedicineStock,
      getWaitingTime,
      getQueuePosition,
    }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
}
