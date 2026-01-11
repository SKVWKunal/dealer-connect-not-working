/**
 * Validation Utilities
 * 
 * Common validation helpers for forms throughout the application.
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (10 digits for India)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// VIN validation (17 characters, alphanumeric, no I, O, Q)
export const isValidVIN = (vin: string): boolean => {
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return vinRegex.test(vin);
};

// Registration number validation (Indian format)
export const isValidRegistrationNo = (regNo: string): boolean => {
  const regNoRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i;
  return regNoRegex.test(regNo.replace(/\s/g, ''));
};

// Damage part number validation (A-Z0-9 only, no spaces/special chars)
export const isValidPartNumber = (partNo: string): boolean => {
  const partNoRegex = /^[A-Z0-9]+$/i;
  return partNoRegex.test(partNo);
};

// DISS Ticket number validation (numeric)
export const isValidDISSTicket = (ticketNo: string): boolean => {
  return /^\d+$/.test(ticketNo);
};

// KVPS (Dealer Workshop Code) validation (5-digit unique)
export const isValidKVPS = (kvps: string): boolean => {
  return /^\d{5}$/.test(kvps);
};

// Positive integer validation
export const isPositiveInteger = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num > 0;
};

// Date validation (must be in past)
export const isDateInPast = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date < new Date();
};

// Date validation (must be today or past)
export const isDateNotFuture = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
};

// File size validation (in MB)
export const isValidFileSize = (sizeInBytes: number, maxSizeMB: number): boolean => {
  return sizeInBytes <= maxSizeMB * 1024 * 1024;
};

// Required field validation
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// OTP validation (6 digits)
export const isValidOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Generic form validator
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, (value: any) => string | null>
): ValidationResult => {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(rules)) {
    const error = (validator as any)(data[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
