import { WebflowFormData } from '../types';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Should have at least 10 digits
  return digits.length >= 10;
}

export function validateDateRange(period: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}\s*-\s*\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(period);
}

export function validateFormData(data: WebflowFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields (now in English)
  // First name and last name are optional
  // if (!data.firstName?.trim()) errors.push('First name is required');
  // if (!data.lastName?.trim()) errors.push('Last name is required');
  if (!data.email) errors.push('Email is required');
  else if (!validateEmail(data.email)) errors.push('Invalid email format');

  // Phone is optional - validate only if provided
  if (data.phone && data.phone.trim() !== '') {
    if (!validatePhone(data.phone)) errors.push('Invalid phone number format');
  }

  if (!data.period) errors.push('Period is required');
  else if (!validateDateRange(data.period)) errors.push('Invalid date range format');

  if (typeof data.adults !== 'number' || data.adults < 1) errors.push('At least 1 adult is required');

  // Salutation is optional - users can choose "Not Specified"
  // Validate only if provided and not empty
  if (data.salutation && data.salutation.trim() !== '') {
    if (data.salutation !== 'Male' && data.salutation !== 'Female') {
      errors.push('Invalid salutation value');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
