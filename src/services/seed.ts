/**
 * Seed Data Service
 * 
 * Initializes the application with sample data for testing.
 */

import { User, Dealer, PCCSubmission } from '@/types';
import { userStorage, dealerStorage, pccStorage, configStorage } from './storage';

const SEED_COMPLETE_KEY = 'seed_complete';

export async function seedData(): Promise<void> {
  // Check if already seeded
  if (configStorage.get<boolean>(SEED_COMPLETE_KEY)) {
    return;
  }

  // Create sample dealer
  const dealer: Dealer = {
    id: 'dealer_001',
    code: 'DLR001',
    name: 'Premium Motors Delhi',
    city: 'New Delhi',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh.kumar@premiummotors.in',
    phone: '9876543210',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  await dealerStorage.create(dealer);

  // Create Super Admin
  const superAdmin: User = {
    id: 'user_superadmin',
    email: 'superadmin@vw.in',
    employeeId: 'VW-SA-001',
    name: 'System Administrator',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  await userStorage.create(superAdmin);
  configStorage.set('password_user_superadmin', 'admin123');

  // Create Manufacturer Admin
  const admin: User = {
    id: 'user_admin',
    email: 'admin@vw.in',
    employeeId: 'VW-AD-001',
    name: 'Manufacturer Admin',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  await userStorage.create(admin);
  configStorage.set('password_user_admin', 'admin123');

  // Create Dealer Users
  const dealerUsers: User[] = [
    {
      id: 'user_mt',
      email: 'mt@premiummotors.in',
      employeeId: 'PM-MT-001',
      name: 'Amit Singh',
      role: 'master_technician',
      dealerId: 'dealer_001',
      dealerName: 'Premium Motors Delhi',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_sm',
      email: 'sm@premiummotors.in',
      employeeId: 'PM-SM-001',
      name: 'Priya Sharma',
      role: 'service_manager',
      dealerId: 'dealer_001',
      dealerName: 'Premium Motors Delhi',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_sh',
      email: 'sh@premiummotors.in',
      employeeId: 'PM-SH-001',
      name: 'Vikram Patel',
      role: 'service_head',
      dealerId: 'dealer_001',
      dealerName: 'Premium Motors Delhi',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user_wm',
      email: 'wm@premiummotors.in',
      employeeId: 'PM-WM-001',
      name: 'Neha Gupta',
      role: 'warranty_manager',
      dealerId: 'dealer_001',
      dealerName: 'Premium Motors Delhi',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  for (const user of dealerUsers) {
    await userStorage.create(user);
    configStorage.set(`password_${user.id}`, 'dealer123');
  }

  // Create sample PCC submissions
  const samplePCCs: PCCSubmission[] = [
    {
      id: 'pcc_001',
      referenceNumber: 'PCC-IN-2024-1001',
      status: 'approved',
      dealerId: 'dealer_001',
      dealerCode: 'DLR001',
      dealerName: 'Premium Motors Delhi',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh.kumar@premiummotors.in',
      brand: 'volkswagen',
      model: 'Virtus',
      vin: 'WVWZZZ3CZWE123456',
      registrationNo: 'DL01AB1234',
      productionDate: '2023-06-15',
      conditionType: 'warranty_cases',
      warrantyPeriod: 'lte_2_years',
      numberOfClaims: 5,
      faultCode: 'P0299',
      topic: 'dealer_pcc',
      subtopic: 'engine',
      escalatedToBrand: false,
      engineCode: 'CZDA',
      gearboxCode: 'DQ200',
      mileage: 25000,
      repairDate: '2024-01-10',
      partDescription: 'Turbocharger Assembly',
      damagePartNumber: '04E145721B',
      repeatedRepair: false,
      breakdown: false,
      attachments: [],
      declarationAccepted: true,
      createdBy: 'user_mt',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-12T14:30:00Z',
      statusHistory: [
        { status: 'submitted', changedBy: 'user_mt', changedAt: '2024-01-10T10:00:00Z' },
        { status: 'under_review', changedBy: 'user_admin', changedAt: '2024-01-11T09:00:00Z' },
        { status: 'approved', changedBy: 'user_admin', changedAt: '2024-01-12T14:30:00Z' }
      ]
    },
    {
      id: 'pcc_002',
      referenceNumber: 'PCC-IN-2024-1002',
      status: 'under_review',
      dealerId: 'dealer_001',
      dealerCode: 'DLR001',
      dealerName: 'Premium Motors Delhi',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh.kumar@premiummotors.in',
      brand: 'skoda',
      model: 'Slavia',
      vin: 'TMBJC9NE9N0123456',
      registrationNo: 'DL02CD5678',
      productionDate: '2023-08-20',
      conditionType: 'repeat_repairs',
      warrantyPeriod: 'any',
      numberOfClaims: 3,
      faultCode: 'U0428',
      numberOfRepairs: 3,
      topic: 'dealer_pcc',
      subtopic: 'electrical',
      escalatedToBrand: true,
      escalationNotes: 'Recurring issue with infotainment system',
      engineCode: 'CWVA',
      gearboxCode: 'MQ250',
      mileage: 15000,
      repairDate: '2024-01-15',
      partDescription: 'Infotainment Unit',
      damagePartNumber: '6V0035874',
      repeatedRepair: true,
      breakdown: false,
      attachments: [],
      declarationAccepted: true,
      createdBy: 'user_sm',
      createdAt: '2024-01-15T11:30:00Z',
      updatedAt: '2024-01-16T09:00:00Z',
      statusHistory: [
        { status: 'submitted', changedBy: 'user_sm', changedAt: '2024-01-15T11:30:00Z' },
        { status: 'under_review', changedBy: 'user_admin', changedAt: '2024-01-16T09:00:00Z' }
      ]
    },
    {
      id: 'pcc_003',
      referenceNumber: 'PCC-IN-2024-1003',
      status: 'more_info_required',
      dealerId: 'dealer_001',
      dealerCode: 'DLR001',
      dealerName: 'Premium Motors Delhi',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh.kumar@premiummotors.in',
      brand: 'volkswagen',
      model: 'Taigun',
      vin: 'WVWZZZ5NZXE654321',
      registrationNo: 'DL03EF9012',
      productionDate: '2023-04-10',
      conditionType: 'breakdown_cases',
      warrantyPeriod: 'any',
      numberOfClaims: 3,
      faultCode: 'C1234',
      topic: 'long_term_pcc',
      subtopic: 'suspension',
      escalatedToBrand: false,
      engineCode: 'DPCA',
      gearboxCode: 'DQ381',
      mileage: 45000,
      repairDate: '2024-01-18',
      partDescription: 'Front Shock Absorber',
      damagePartNumber: '2GS413031A',
      repeatedRepair: false,
      breakdown: true,
      attachments: [],
      declarationAccepted: true,
      createdBy: 'user_wm',
      createdAt: '2024-01-18T14:00:00Z',
      updatedAt: '2024-01-19T10:00:00Z',
      statusHistory: [
        { status: 'submitted', changedBy: 'user_wm', changedAt: '2024-01-18T14:00:00Z' },
        { status: 'more_info_required', changedBy: 'user_admin', changedAt: '2024-01-19T10:00:00Z', notes: 'Please provide photos of the damaged component' }
      ]
    }
  ];

  for (const pcc of samplePCCs) {
    await pccStorage.create(pcc);
  }

  // Mark seed as complete
  configStorage.set(SEED_COMPLETE_KEY, true);
}

export function resetSeedData(): void {
  localStorage.clear();
}
