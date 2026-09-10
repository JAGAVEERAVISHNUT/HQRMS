'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
  initialPrescriptions,
  classifyPatient,
  calculateWaitingTime,
} from './store';

interface RegisterPatientInput extends Omit<Patient, 'id' | 'classification' | 'status' | 'registeredAt' | 'tokenNumber'> {
  preferredDoctorId?: string;
  department?: string;
}

interface HospitalContextType {
  // Auth
  currentUser: User | null;
  login: (role: User['role']) => void;
  logout: () => void;

  // Patients
  patients: Patient[];
  registerPatient: (data: RegisterPatientInput) => Patient;
  updatePatientStatus: (patientId: string, status: PatientStatus) => void;
  assignDoctorToPatient: (patientId: string, doctorId: string) => void;

  // Doctors
  doctors: Doctor[];
  updateDoctorStatus: (doctorId: string, status: DoctorStatus) => void;
  callNextPatient: (doctorId: string, targetPatientId?: string) => Patient | null;
  completeConsultation: (doctorId: string, action: 'prescribe' | 'refer' | 'admit', referralDoctorId?: string) => void;

  // Beds
  beds: Bed[];
  admitPatient: (patientId: string, bedType: Bed['type']) => Bed | null;
  dischargePatient: (bedId: string) => void;
  updateBedStatus: (bedId: string, status: BedStatus) => void;

  // Medicines & Prescriptions
  medicines: Medicine[];
  prescriptions: Prescription[];
  createPrescription: (patientId: string, doctorId: string, items: Prescription['items'], notes?: string) => Prescription;
  dispensePrescription: (prescriptionId: string) => void;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  updateMedicineStock: (medicineId: string, newStock: number) => void;

  // Utilities
  getWaitingTime: (patientId: string) => number;
  getQueuePosition: (patientId: string) => number;
  resetToInitialData: () => void;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PATIENTS: 'hqrms_patients_v2',
  DOCTORS: 'hqrms_doctors_v2',
  BEDS: 'hqrms_beds_v2',
  MEDICINES: 'hqrms_medicines_v2',
  PRESCRIPTIONS: 'hqrms_prescriptions_v2',
  USER: 'hqrms_user_v2',
};

// ID generator helpers
function getNextPatientId(list: Patient[]): string {
  let maxId = 1000;
  for (const p of list) {
    const match = p.id.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    }
  }
  return `P${maxId + 1}`;
}

function getNextTokenNumber(list: Patient[]): number {
  let maxToken = 100;
  for (const p of list) {
    if (p.tokenNumber && p.tokenNumber > maxToken) {
      maxToken = p.tokenNumber;
    }
  }
  return maxToken + 1;
}

function getNextPrescriptionId(list: Prescription[]): string {
  let maxRx = 1;
  for (const rx of list) {
    const match = rx.id.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxRx) maxRx = num;
    }
  }
  return `RX${String(maxRx + 1).padStart(5, '0')}`;
}

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [beds, setBeds] = useState<Bed[]>(initialBeds);
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      const savedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (savedPatients) {
        const parsed: Patient[] = JSON.parse(savedPatients);
        setPatients(parsed.map(p => ({
          ...p,
          registeredAt: new Date(p.registeredAt),
          prescription: p.prescription ? {
            ...p.prescription,
            issuedAt: new Date(p.prescription.issuedAt),
            dispensedAt: p.prescription.dispensedAt ? new Date(p.prescription.dispensedAt) : undefined,
          } : undefined,
        })));
      }

      const savedDoctors = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      if (savedDoctors) {
        setDoctors(JSON.parse(savedDoctors));
      }

      const savedBeds = localStorage.getItem(STORAGE_KEYS.BEDS);
      if (savedBeds) {
        setBeds(JSON.parse(savedBeds));
      }

      const savedMedicines = localStorage.getItem(STORAGE_KEYS.MEDICINES);
      if (savedMedicines) {
        setMedicines(JSON.parse(savedMedicines));
      }

      const savedPrescriptions = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
      if (savedPrescriptions) {
        const parsed: Prescription[] = JSON.parse(savedPrescriptions);
        setPrescriptions(parsed.map(rx => ({
          ...rx,
          issuedAt: new Date(rx.issuedAt),
          dispensedAt: rx.dispensedAt ? new Date(rx.dispensedAt) : undefined,
        })));
      }
    } catch (e) {
      console.error('Failed to load HQRMS state from localStorage', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever state changes after initial hydration
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    } catch (e) {
      console.error('Error saving patients', e);
    }
  }, [patients, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    } catch (e) {
      console.error('Error saving doctors', e);
    }
  }, [doctors, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.BEDS, JSON.stringify(beds));
    } catch (e) {
      console.error('Error saving beds', e);
    }
  }, [beds, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    } catch (e) {
      console.error('Error saving medicines', e);
    }
  }, [medicines, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
    } catch (e) {
      console.error('Error saving prescriptions', e);
    }
  }, [prescriptions, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error('Error saving user', e);
    }
  }, [currentUser, isHydrated]);

  // BroadcastChannel for cross-tab synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel('hqrms_sync_channel');

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'SYNC_ALL' || data.type === 'PATIENT_UPDATED' || data.type === 'PRESCRIPTION_UPDATED') {
        if (data.patients) {
          setPatients(data.patients.map((p: Patient) => ({
            ...p,
            registeredAt: new Date(p.registeredAt),
            prescription: p.prescription ? {
              ...p.prescription,
              issuedAt: new Date(p.prescription.issuedAt),
              dispensedAt: p.prescription.dispensedAt ? new Date(p.prescription.dispensedAt) : undefined,
            } : undefined,
          })));
        }
        if (data.doctors) setDoctors(data.doctors);
        if (data.prescriptions) {
          setPrescriptions(data.prescriptions.map((rx: Prescription) => ({
            ...rx,
            issuedAt: new Date(rx.issuedAt),
            dispensedAt: rx.dispensedAt ? new Date(rx.dispensedAt) : undefined,
          })));
        }
        if (data.medicines) setMedicines(data.medicines);
        if (data.beds) setBeds(data.beds);
      } else if (data.type === 'RESET_DEMO') {
        setPatients(initialPatients);
        setDoctors(initialDoctors);
        setBeds(initialBeds);
        setMedicines(initialMedicines);
        setPrescriptions(initialPrescriptions);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const broadcastSync = useCallback((payload: Record<string, unknown>) => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('hqrms_sync_channel');
      channel.postMessage(payload);
      channel.close();
    } catch (e) {
      console.error('Broadcast sync error', e);
    }
  }, []);

  // Auth
  const login = useCallback((role: User['role']) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Patient Registration with Smart Doctor Auto-Assignment
  const registerPatient = useCallback((data: RegisterPatientInput): Patient => {
    const classification = classifyPatient(data.symptoms, data.age);
    const id = getNextPatientId(patients);
    const tokenNumber = getNextTokenNumber(patients);

    // 1. Determine assigned doctor:
    let targetDoctor: Doctor | undefined;

    // A. Explicitly preferred doctor
    if (data.preferredDoctorId) {
      targetDoctor = doctors.find(d => d.id === data.preferredDoctorId);
    }

    // B. Explicit Department
    if (!targetDoctor && data.department && data.department !== 'auto') {
      const deptDoctors = doctors.filter(d =>
        d.specialization.toLowerCase() === data.department?.toLowerCase()
      );
      if (deptDoctors.length > 0) {
        // Pick doctor with shortest queue
        targetDoctor = [...deptDoctors].sort((a, b) => a.queue.length - b.queue.length)[0];
      }
    }

    // C. Classification-based Auto Assignment
    if (!targetDoctor) {
      if (classification === 'emergency') {
        targetDoctor = doctors.find(d => d.specialization === 'Emergency') ||
          [...doctors].sort((a, b) => a.queue.length - b.queue.length)[0];
      } else if (classification === 'specialist') {
        const lowerSym = data.symptoms.toLowerCase();
        let targetSpecialty = '';
        if (lowerSym.includes('cardiac') || lowerSym.includes('heart') || lowerSym.includes('chest')) {
          targetSpecialty = 'Cardiology';
        } else if (lowerSym.includes('ortho') || lowerSym.includes('bone') || lowerSym.includes('fracture')) {
          targetSpecialty = 'Orthopedics';
        } else if (lowerSym.includes('neuro') || lowerSym.includes('brain') || lowerSym.includes('headache')) {
          targetSpecialty = 'Neurology';
        }

        const specialistDoctors = doctors.filter(d =>
          targetSpecialty ? d.specialization === targetSpecialty : d.specialization !== 'General Medicine' && d.specialization !== 'Emergency'
        );

        if (specialistDoctors.length > 0) {
          targetDoctor = [...specialistDoctors].sort((a, b) => a.queue.length - b.queue.length)[0];
        }
      }
    }

    // D. Default fallback: General Medicine doctor with shortest queue
    if (!targetDoctor) {
      const generalDoctors = doctors.filter(d => d.specialization === 'General Medicine');
      if (generalDoctors.length > 0) {
        targetDoctor = [...generalDoctors].sort((a, b) => a.queue.length - b.queue.length)[0];
      } else {
        targetDoctor = [...doctors].sort((a, b) => a.queue.length - b.queue.length)[0];
      }
    }

    const assignedDoctorId = targetDoctor ? targetDoctor.id : 'D001';
    const assignedDept = targetDoctor ? targetDoctor.specialization : (data.department || 'General Medicine');

    const newPatient: Patient = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      mobile: data.mobile,
      symptoms: data.symptoms,
      id,
      classification,
      status: 'waiting',
      registeredAt: new Date(),
      tokenNumber,
      assignedDoctor: assignedDoctorId,
      department: assignedDept,
    };

    const updatedPatients = [...patients, newPatient];
    const updatedDoctors = doctors.map(d =>
      d.id === assignedDoctorId
        ? { ...d, queue: [...d.queue, newPatient.id] }
        : d
    );

    setPatients(updatedPatients);
    setDoctors(updatedDoctors);

    broadcastSync({
      type: 'PATIENT_UPDATED',
      patients: updatedPatients,
      doctors: updatedDoctors,
    });

    return newPatient;
  }, [patients, doctors, broadcastSync]);

  const updatePatientStatus = useCallback((patientId: string, status: PatientStatus) => {
    setPatients(prev => {
      const updated = prev.map(p => (p.id === patientId ? { ...p, status } : p));
      broadcastSync({ type: 'PATIENT_UPDATED', patients: updated });
      return updated;
    });
  }, [broadcastSync]);

  const assignDoctorToPatient = useCallback((patientId: string, doctorId: string) => {
    setPatients(prevPatients => {
      const updatedPatients = prevPatients.map(p =>
        p.id === patientId ? { ...p, assignedDoctor: doctorId, status: 'waiting' as PatientStatus } : p
      );
      setDoctors(prevDoctors => {
        const updatedDoctors = prevDoctors.map(d => {
          // Remove from old queues
          const filteredQueue = d.queue.filter(id => id !== patientId);
          // Add to new doctor's queue
          if (d.id === doctorId) {
            return { ...d, queue: [...filteredQueue, patientId] };
          }
          return { ...d, queue: filteredQueue };
        });
        broadcastSync({ type: 'PATIENT_UPDATED', patients: updatedPatients, doctors: updatedDoctors });
        return updatedDoctors;
      });
      return updatedPatients;
    });
  }, [broadcastSync]);

  // Doctor Operations
  const updateDoctorStatus = useCallback((doctorId: string, status: DoctorStatus) => {
    setDoctors(prev => {
      const updated = prev.map(d => (d.id === doctorId ? { ...d, status } : d));
      broadcastSync({ type: 'PATIENT_UPDATED', doctors: updated });
      return updated;
    });
  }, [broadcastSync]);

  const callNextPatient = useCallback((doctorId: string, targetPatientId?: string): Patient | null => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor || doctor.queue.length === 0) return null;

    const nextPatientId = targetPatientId || doctor.queue[0];
    const patient = patients.find(p => p.id === nextPatientId);
    if (!patient) return null;

    // Remove called patient from queue
    const updatedQueue = doctor.queue.filter(id => id !== nextPatientId);

    const updatedDoctors = doctors.map(d =>
      d.id === doctorId
        ? { ...d, queue: updatedQueue, currentPatientId: nextPatientId, status: 'busy' as DoctorStatus }
        : d
    );

    const updatedPatients = patients.map(p => {
      // If there was a previous patient in consultation with this doctor that wasn't finished, keep them safe
      if (doctor.currentPatientId && p.id === doctor.currentPatientId && p.id !== nextPatientId && p.status === 'in-consultation') {
        return { ...p, status: 'waiting' as PatientStatus };
      }
      if (p.id === nextPatientId) {
        return { ...p, status: 'in-consultation' as PatientStatus };
      }
      return p;
    });

    setDoctors(updatedDoctors);
    setPatients(updatedPatients);

    broadcastSync({
      type: 'PATIENT_UPDATED',
      patients: updatedPatients,
      doctors: updatedDoctors,
    });

    return patient;
  }, [doctors, patients, broadcastSync]);

  const completeConsultation = useCallback((
    doctorId: string,
    action: 'prescribe' | 'refer' | 'admit',
    referralDoctorId?: string
  ) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return;

    const patientId = doctor.currentPatientId;

    let updatedDoctors = doctors.map(d =>
      d.id === doctorId
        ? { ...d, currentPatientId: undefined, status: 'available' as DoctorStatus }
        : d
    );

    let updatedPatients = patients;

    if (patientId) {
      if (action === 'prescribe') {
        updatedPatients = patients.map(p =>
          p.id === patientId ? { ...p, status: 'pharmacy' as PatientStatus } : p
        );
      } else if (action === 'admit') {
        updatedPatients = patients.map(p =>
          p.id === patientId ? { ...p, status: 'admitted' as PatientStatus } : p
        );
      } else if (action === 'refer') {
        const refDoctor = referralDoctorId ? doctors.find(d => d.id === referralDoctorId) : undefined;
        const newDoctorId = refDoctor ? refDoctor.id : 'D002'; // default cardiology/specialist

        updatedPatients = patients.map(p =>
          p.id === patientId
            ? { ...p, assignedDoctor: newDoctorId, status: 'waiting' as PatientStatus }
            : p
        );

        updatedDoctors = updatedDoctors.map(d =>
          d.id === newDoctorId
            ? { ...d, queue: [...d.queue.filter(id => id !== patientId), patientId] }
            : d
        );
      }
    }

    setDoctors(updatedDoctors);
    setPatients(updatedPatients);

    broadcastSync({
      type: 'PATIENT_UPDATED',
      patients: updatedPatients,
      doctors: updatedDoctors,
    });
  }, [doctors, patients, broadcastSync]);

  // Bed Management
  const admitPatient = useCallback((patientId: string, bedType: Bed['type']) => {
    const availableBed = beds.find(b => b.type === bedType && b.status === 'available');
    if (!availableBed) return null;

    const updatedBeds = beds.map(b =>
      b.id === availableBed.id ? { ...b, status: 'occupied' as BedStatus, patientId } : b
    );
    const updatedPatients = patients.map(p =>
      p.id === patientId ? { ...p, status: 'admitted' as PatientStatus, bedId: availableBed.id } : p
    );

    // Also clear from doctor consultation if active
    const updatedDoctors = doctors.map(d =>
      d.currentPatientId === patientId ? { ...d, currentPatientId: undefined, status: 'available' as DoctorStatus } : d
    );

    setBeds(updatedBeds);
    setPatients(updatedPatients);
    setDoctors(updatedDoctors);

    broadcastSync({
      type: 'PATIENT_UPDATED',
      beds: updatedBeds,
      patients: updatedPatients,
      doctors: updatedDoctors,
    });

    return availableBed;
  }, [beds, patients, doctors, broadcastSync]);

  const dischargePatient = useCallback((bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || !bed.patientId) return;

    const patientId = bed.patientId;
    const updatedPatients = patients.map(p =>
      p.id === patientId ? { ...p, status: 'discharged' as PatientStatus, bedId: undefined } : p
    );
    const updatedBeds = beds.map(b =>
      b.id === bedId ? { ...b, status: 'available' as BedStatus, patientId: undefined } : b
    );

    setPatients(updatedPatients);
    setBeds(updatedBeds);

    broadcastSync({
      type: 'PATIENT_UPDATED',
      patients: updatedPatients,
      beds: updatedBeds,
    });
  }, [beds, patients, broadcastSync]);

  const updateBedStatus = useCallback((bedId: string, status: BedStatus) => {
    setBeds(prev => {
      const updated = prev.map(b => (b.id === bedId ? { ...b, status } : b));
      broadcastSync({ type: 'PATIENT_UPDATED', beds: updated });
      return updated;
    });
  }, [broadcastSync]);

  // Pharmacy Operations: Create Prescription and Dispatch to Pharmacy Staff Dashboard
  const createPrescription = useCallback((
    patientId: string,
    doctorId: string,
    items: Prescription['items'],
    notes?: string
  ): Prescription => {
    const patient = patients.find(p => p.id === patientId);
    const doctor = doctors.find(d => d.id === doctorId);

    const newRxId = getNextPrescriptionId(prescriptions);
    const prescription: Prescription = {
      id: newRxId,
      patientId,
      patientName: patient?.name || 'Patient',
      doctorId,
      doctorName: doctor?.name || 'Doctor',
      items,
      issuedAt: new Date(),
      dispensed: false,
      notes,
    };

    const updatedPrescriptions = [prescription, ...prescriptions];

    // Update patient status to 'pharmacy' and attach prescription
    const updatedPatients = patients.map(p =>
      p.id === patientId
        ? { ...p, prescription, status: 'pharmacy' as PatientStatus }
        : p
    );

    // Free the doctor if this was their active patient, and remove from queue
    const updatedDoctors = doctors.map(d => {
      const cleanedQueue = d.queue.filter(id => id !== patientId);
      if (d.id === doctorId || d.currentPatientId === patientId) {
        return {
          ...d,
          queue: cleanedQueue,
          currentPatientId: d.currentPatientId === patientId ? undefined : d.currentPatientId,
          status: d.currentPatientId === patientId ? ('available' as DoctorStatus) : d.status,
        };
      }
      return { ...d, queue: cleanedQueue };
    });

    setPrescriptions(updatedPrescriptions);
    setPatients(updatedPatients);
    setDoctors(updatedDoctors);

    broadcastSync({
      type: 'PRESCRIPTION_UPDATED',
      prescriptions: updatedPrescriptions,
      patients: updatedPatients,
      doctors: updatedDoctors,
    });

    return prescription;
  }, [patients, doctors, prescriptions, broadcastSync]);

  // Dispense Prescription and Deduct Stock
  const dispensePrescription = useCallback((prescriptionId: string) => {
    const rx = prescriptions.find(p => p.id === prescriptionId);
    if (!rx) return;

    // Deduct stock for each prescribed item
    const updatedMedicines = medicines.map(m => {
      const item = rx.items.find(i =>
        i.medicineId === m.id || i.medicineName.trim().toLowerCase() === m.name.trim().toLowerCase()
      );
      if (item) {
        return { ...m, stock: Math.max(0, m.stock - item.quantity) };
      }
      return m;
    });

    const now = new Date();
    const updatedPrescriptions = prescriptions.map(p =>
      p.id === prescriptionId ? { ...p, dispensed: true, dispensedAt: now } : p
    );

    const updatedPatients = patients.map(p => {
      if (p.id === rx.patientId) {
        return {
          ...p,
          status: 'discharged' as PatientStatus,
          prescription: p.prescription ? { ...p.prescription, dispensed: true, dispensedAt: now } : undefined,
        };
      }
      return p;
    });

    setMedicines(updatedMedicines);
    setPrescriptions(updatedPrescriptions);
    setPatients(updatedPatients);

    broadcastSync({
      type: 'PRESCRIPTION_UPDATED',
      medicines: updatedMedicines,
      prescriptions: updatedPrescriptions,
      patients: updatedPatients,
    });
  }, [prescriptions, medicines, patients, broadcastSync]);

  const addMedicine = useCallback((medicine: Omit<Medicine, 'id'>) => {
    const newMedicine: Medicine = {
      ...medicine,
      id: `MED${Date.now().toString().slice(-4)}`,
    };
    setMedicines(prev => {
      const updated = [...prev, newMedicine];
      broadcastSync({ type: 'PRESCRIPTION_UPDATED', medicines: updated });
      return updated;
    });
  }, [broadcastSync]);

  const updateMedicineStock = useCallback((medicineId: string, newStock: number) => {
    setMedicines(prev => {
      const updated = prev.map(m => (m.id === medicineId ? { ...m, stock: newStock } : m));
      broadcastSync({ type: 'PRESCRIPTION_UPDATED', medicines: updated });
      return updated;
    });
  }, [broadcastSync]);

  // Utilities
  const getWaitingTime = useCallback((patientId: string): number => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.assignedDoctor) return 0;

    const doctor = doctors.find(d => d.id === patient.assignedDoctor);
    if (!doctor) return 0;

    const position = doctor.queue.indexOf(patientId);
    if (position === -1) return 0;

    const availableDoctorsCount = doctors.filter(d =>
      d.specialization === doctor.specialization
    ).length || 1;

    return calculateWaitingTime(position, doctor.avgConsultationTime, availableDoctorsCount);
  }, [patients, doctors]);

  const getQueuePosition = useCallback((patientId: string): number => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.assignedDoctor) return 0;

    const doctor = doctors.find(d => d.id === patient.assignedDoctor);
    if (!doctor) return 0;

    const pos = doctor.queue.indexOf(patientId);
    return pos >= 0 ? pos + 1 : 0;
  }, [patients, doctors]);

  const resetToInitialData = useCallback(() => {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    }
    setPatients(initialPatients);
    setDoctors(initialDoctors);
    setBeds(initialBeds);
    setMedicines(initialMedicines);
    setPrescriptions(initialPrescriptions);

    broadcastSync({ type: 'RESET_DEMO' });
  }, [broadcastSync]);

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
      resetToInitialData,
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
