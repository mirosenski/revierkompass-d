// utils/addressValidation.ts
import DOMPurify from 'dompurify';

export class AddressValidator {
  // PLZ-Validierung für Deutschland
  static isValidGermanZipCode(zipCode: string): boolean {
    const zipRegex = /^[0-9]{5}$/;
    return zipRegex.test(zipCode);
  }

  // Koordinaten-Validierung
  static isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // XSS-Schutz für Texteingaben
  static sanitizeInput(input: string): string {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    }).trim();
  }

  // Vollständige Adress-Validierung
  static validateAddress(address: {
    name: string;
    street: string;
    zipCode: string;
    city: string;
    coordinates?: [number, number];
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name validieren
    if (!address.name || address.name.length < 2) {
      errors.push('Name muss mindestens 2 Zeichen lang sein');
    }
    if (address.name.length > 100) {
      errors.push('Name darf maximal 100 Zeichen lang sein');
    }

    // Straße validieren
    if (!address.street || address.street.length < 5) {
      errors.push('Straße muss mindestens 5 Zeichen lang sein');
    }
    if (!/\d/.test(address.street)) {
      errors.push('Straße sollte eine Hausnummer enthalten');
    }

    // PLZ validieren
    if (!this.isValidGermanZipCode(address.zipCode)) {
      errors.push('PLZ muss 5 Ziffern haben');
    }

    // Stadt validieren
    if (!address.city || address.city.length < 2) {
      errors.push('Stadt muss mindestens 2 Zeichen lang sein');
    }

    // Koordinaten validieren (falls vorhanden)
    if (address.coordinates) {
      if (!this.isValidCoordinate(address.coordinates[0], address.coordinates[1])) {
        errors.push('Ungültige Koordinaten');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // SQL Injection Prevention (für Backend)
  static escapeSQL(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/"/g, '""')
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z');
  }
}

// hooks/useAddressValidation.ts
import { useState, useCallback } from 'react';
import { AddressValidator } from '../utils/addressValidation';

interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
}

export function useAddressValidation() {
  const [validation, setValidation] = useState<ValidationState>({
    isValid: true,
    errors: {}
  });

  const validateField = useCallback((field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'name':
        if (!value || value.length < 2) {
          error = 'Name muss mindestens 2 Zeichen lang sein';
        } else if (value.length > 100) {
          error = 'Name darf maximal 100 Zeichen lang sein';
        }
        break;
      
      case 'street':
        if (!value || value.length < 5) {
          error = 'Straße muss mindestens 5 Zeichen lang sein';
        } else if (!/\d/.test(value)) {
          error = 'Straße sollte eine Hausnummer enthalten';
        }
        break;
      
      case 'zipCode':
        if (!AddressValidator.isValidGermanZipCode(value)) {
          error = 'PLZ muss 5 Ziffern haben';
        }
        break;
      
      case 'city':
        if (!value || value.length < 2) {
          error = 'Stadt muss mindestens 2 Zeichen lang sein';
        }
        break;
    }

    setValidation(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error
      }
    }));

    return error === '';
  }, []);

  const validateAll = useCallback((address: any) => {
    const result = AddressValidator.validateAddress(address);
    const errorMap: Record<string, string> = {};

    // Errors zu Field-Map konvertieren
    result.errors.forEach(error => {
      if (error.includes('Name')) errorMap.name = error;
      else if (error.includes('Straße')) errorMap.street = error;
      else if (error.includes('PLZ')) errorMap.zipCode = error;
      else if (error.includes('Stadt')) errorMap.city = error;
      else if (error.includes('Koordinaten')) errorMap.coordinates = error;
    });

    setValidation({
      isValid: result.isValid,
      errors: errorMap
    });

    return result.isValid;
  }, []);

  const clearErrors = useCallback(() => {
    setValidation({
      isValid: true,
      errors: {}
    });
  }, []);

  return {
    validation,
    validateField,
    validateAll,
    clearErrors,
    sanitize: AddressValidator.sanitizeInput
  };
}