import type {
  User,
  Patient,
  Doctor,
  Bed,
  Medicine,
  Prescription,
  PatientClassification,
  HourlyStats,
  HospitalSummary,
} from './types';

// Generate unique IDs
let patientCounter = 1000;
let prescriptionCounter = 1;

export function generatePatientId(): string {
  return `P${++patientCounter}`;
}

export function generatePrescriptionId(): string {
  return `RX${String(++prescriptionCounter).padStart(5, '0')}`;
}

// Mock Users
export const mockUsers: User[] = [
  { id: 'U001', name: 'Dr. Admin', role: 'admin' },
  { id: 'U002', name: 'Sarah (Reception)', role: 'reception' },
  { id: 'U003', name: 'Dr. Smith', role: 'doctor', department: 'General Medicine' },
  { id: 'U004', name: 'Mike (Pharmacy)', role: 'pharmacy' },
  { id: 'U005', name: 'City Health Officer', role: 'city' },
];

// Initial Doctors
export const initialDoctors: Doctor[] = [
  {
    id: 'D001',
    name: 'Dr. Smith',
    specialization: 'General Medicine',
    status: 'available',
    avgConsultationTime: 15,
    queue: [],
  },
  {
    id: 'D002',
    name: 'Dr. Johnson',
    specialization: 'Cardiology',
    status: 'available',
    avgConsultationTime: 20,
    queue: [],
  },
  {
    id: 'D003',
    name: 'Dr. Williams',
    specialization: 'Orthopedics',
    status: 'available',
    avgConsultationTime: 18,
    queue: [],
  },
  {
    id: 'D004',
    name: 'Dr. Brown',
    specialization: 'Emergency',
    status: 'available',
    avgConsultationTime: 12,
    queue: [],
  },
  {
    id: 'D005',
    name: 'Dr. Davis',
    specialization: 'Neurology',
    status: 'busy',
    avgConsultationTime: 25,
    queue: [],
  },
];

// Initial Beds
export const initialBeds: Bed[] = [
  // General beds
  { id: 'B001', type: 'general', status: 'available', ward: 'Ward A' },
  { id: 'B002', type: 'general', status: 'occupied', ward: 'Ward A', patientId: 'P001' },
  { id: 'B003', type: 'general', status: 'available', ward: 'Ward A' },
  { id: 'B004', type: 'general', status: 'occupied', ward: 'Ward B', patientId: 'P002' },
  { id: 'B005', type: 'general', status: 'available', ward: 'Ward B' },
  { id: 'B006', type: 'general', status: 'maintenance', ward: 'Ward B' },
  { id: 'B007', type: 'general', status: 'available', ward: 'Ward C' },
  { id: 'B008', type: 'general', status: 'available', ward: 'Ward C' },
  // ICU beds
  { id: 'B009', type: 'icu', status: 'available', ward: 'ICU' },
  { id: 'B010', type: 'icu', status: 'occupied', ward: 'ICU', patientId: 'P003' },
  { id: 'B011', type: 'icu', status: 'available', ward: 'ICU' },
  { id: 'B012', type: 'icu', status: 'occupied', ward: 'ICU', patientId: 'P004' },
  // Emergency beds
  { id: 'B013', type: 'emergency', status: 'available', ward: 'Emergency' },
  { id: 'B014', type: 'emergency', status: 'occupied', ward: 'Emergency', patientId: 'P005' },
  { id: 'B015', type: 'emergency', status: 'available', ward: 'Emergency' },
];

// Initial Medicines
export const initialMedicines: Medicine[] = [
  { id: 'M001', name: 'Paracetamol 500mg', stock: 500, unit: 'tablets', lowStockThreshold: 100 },
  { id: 'M002', name: 'Amoxicillin 250mg', stock: 200, unit: 'capsules', lowStockThreshold: 50 },
  { id: 'M003', name: 'Omeprazole 20mg', stock: 150, unit: 'capsules', lowStockThreshold: 40 },
  { id: 'M004', name: 'Cetirizine 10mg', stock: 300, unit: 'tablets', lowStockThreshold: 60 },
  { id: 'M005', name: 'Metformin 500mg', stock: 80, unit: 'tablets', lowStockThreshold: 100 },
  { id: 'M006', name: 'Atorvastatin 10mg', stock: 45, unit: 'tablets', lowStockThreshold: 50 },
  { id: 'M007', name: 'Aspirin 75mg', stock: 400, unit: 'tablets', lowStockThreshold: 80 },
  { id: 'M008', name: 'Ibuprofen 400mg', stock: 250, unit: 'tablets', lowStockThreshold: 60 },
  { id: 'M009', name: 'Azithromycin 500mg', stock: 30, unit: 'tablets', lowStockThreshold: 40 },
  { id: 'M010', name: 'Pantoprazole 40mg', stock: 180, unit: 'tablets', lowStockThreshold: 45 },
];

// Initial Patients (pre-existing)
export const initialPatients: Patient[] = [
  {
    id: 'P001',
    name: 'John Doe',
    age: 45,
    gender: 'male',
    mobile: '555-0101',
    symptoms: 'Fever, headache',
    classification: 'general',
    status: 'admitted',
    registeredAt: new Date(Date.now() - 86400000),
    bedId: 'B002',
  },
  {
    id: 'P002',
    name: 'Jane Smith',
    age: 62,
    gender: 'female',
    mobile: '555-0102',
    symptoms: 'Chest pain, shortness of breath',
    classification: 'specialist',
    status: 'admitted',
    registeredAt: new Date(Date.now() - 172800000),
    bedId: 'B004',
  },
  {
    id: 'P003',
    name: 'Robert Wilson',
    age: 70,
    gender: 'male',
    mobile: '555-0103',
    symptoms: 'Severe cardiac arrest recovery',
    classification: 'emergency',
    status: 'admitted',
    registeredAt: new Date(Date.now() - 259200000),
    bedId: 'B010',
  },
  {
    id: 'P004',
    name: 'Mary Johnson',
    age: 55,
    gender: 'female',
    mobile: '555-0104',
    symptoms: 'Post-surgery monitoring',
    classification: 'specialist',
    status: 'admitted',
    registeredAt: new Date(Date.now() - 345600000),
    bedId: 'B012',
  },
  {
    id: 'P005',
    name: 'James Brown',
    age: 30,
    gender: 'male',
    mobile: '555-0105',
    symptoms: 'Trauma from accident',
    classification: 'emergency',
    status: 'admitted',
    registeredAt: new Date(Date.now() - 43200000),
    bedId: 'B014',
  },
];

// Classification Rules
export function classifyPatient(symptoms: string, age: number): PatientClassification {
  const lowerSymptoms = symptoms.toLowerCase();
  
  // Emergency keywords
  const emergencyKeywords = [
    'chest pain', 'heart attack', 'stroke', 'unconscious', 'severe bleeding',
    'accident', 'trauma', 'breathing difficulty', 'seizure', 'poisoning',
    'severe', 'critical', 'emergency', 'collapse'
  ];
  
  if (emergencyKeywords.some(keyword => lowerSymptoms.includes(keyword))) {
    return 'emergency';
  }
  
  // Specialist keywords
  const specialistKeywords = [
    'cardiac', 'heart', 'neuro', 'brain', 'ortho', 'bone', 'fracture',
    'surgery', 'chronic', 'diabetes', 'cancer', 'kidney', 'liver'
  ];
  
  if (specialistKeywords.some(keyword => lowerSymptoms.includes(keyword)) || age > 65) {
    return 'specialist';
  }
  
  return 'general';
}

// Calculate waiting time
export function calculateWaitingTime(
  patientsAhead: number,
  avgConsultationTime: number,
  availableDoctors: number
): number {
  if (availableDoctors === 0) return -1; // Indicates no doctors available
  return Math.ceil((patientsAhead * avgConsultationTime) / availableDoctors);
}

// Generate mock hourly stats
export function generateHourlyStats(): HourlyStats[] {
  const stats: HourlyStats[] = [];
  const currentHour = new Date().getHours();
  
  for (let i = 0; i < 12; i++) {
    const hour = (currentHour - 11 + i + 24) % 24;
    let baseCount = 10;
    
    // Peak hours: 9-11 AM and 4-6 PM
    if ((hour >= 9 && hour <= 11) || (hour >= 16 && hour <= 18)) {
      baseCount = 25 + Math.floor(Math.random() * 15);
    } else if (hour >= 6 && hour <= 20) {
      baseCount = 12 + Math.floor(Math.random() * 10);
    } else {
      baseCount = 3 + Math.floor(Math.random() * 5);
    }
    
    stats.push({ hour, patientCount: baseCount });
  }
  
  return stats;
}

// City-level hospital data
export const cityHospitals: HospitalSummary[] = [
  {
    id: 'H001',
    name: 'HQRMS Central Hospital',
    availableBeds: 6,
    totalBeds: 15,
    icuAvailable: 2,
    icuTotal: 4,
    opdLoad: 'medium',
    emergencyCapacity: 67,
  },
  {
    id: 'H002',
    name: 'City General Hospital',
    availableBeds: 12,
    totalBeds: 30,
    icuAvailable: 4,
    icuTotal: 8,
    opdLoad: 'low',
    emergencyCapacity: 80,
  },
  {
    id: 'H003',
    name: 'Metro Care Medical Center',
    availableBeds: 2,
    totalBeds: 25,
    icuAvailable: 0,
    icuTotal: 6,
    opdLoad: 'high',
    emergencyCapacity: 15,
  },
  {
    id: 'H004',
    name: 'Sunrise Hospital',
    availableBeds: 8,
    totalBeds: 20,
    icuAvailable: 3,
    icuTotal: 5,
    opdLoad: 'low',
    emergencyCapacity: 90,
  },
  {
    id: 'H005',
    name: 'Unity Medical Center',
    availableBeds: 0,
    totalBeds: 18,
    icuAvailable: 1,
    icuTotal: 4,
    opdLoad: 'high',
    emergencyCapacity: 25,
  },
];

// Medicine usage tracking (for analytics)
export const medicineUsageData = [
  { name: 'Paracetamol', mon: 45, tue: 52, wed: 38, thu: 61, fri: 55, sat: 30, sun: 22 },
  { name: 'Amoxicillin', mon: 22, tue: 18, wed: 25, thu: 20, fri: 28, sat: 15, sun: 10 },
  { name: 'Omeprazole', mon: 15, tue: 18, wed: 12, thu: 20, fri: 16, sat: 10, sun: 8 },
  { name: 'Cetirizine', mon: 30, tue: 25, wed: 35, thu: 28, fri: 32, sat: 20, sun: 15 },
  { name: 'Ibuprofen', mon: 25, tue: 30, wed: 22, thu: 35, fri: 28, sat: 18, sun: 12 },
];
