import { useMemo } from 'react'
import { StationFormData } from './types'

export const useFormValidation = (formData: StationFormData) => {
  return useMemo(() => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name?.trim()) {
      errors.name = 'Name ist erforderlich';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name muss mindestens 2 Zeichen lang sein';
    }

    // Address validation
    if (!formData.address?.trim()) {
      errors.address = 'Adresse ist erforderlich';
    } else if (formData.address.trim().length < 5) {
      errors.address = 'Adresse muss mindestens 5 Zeichen lang sein';
    }

    // City validation
    if (!formData.city?.trim()) {
      errors.city = 'Stadt ist erforderlich';
    } else if (formData.city.trim().length < 2) {
      errors.city = 'Stadt muss mindestens 2 Zeichen lang sein';
    }

    // Phone validation
    if (!formData.telefon?.trim()) {
      errors.telefon = 'Telefon ist erforderlich';
    }

    // Email validation (optional)
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ungültige E-Mail-Adresse';
    }

    // Coordinates validation
    const [lat, lng] = formData.coordinates;
    if (!lat || !lng) {
      errors.coordinates = 'Koordinaten sind erforderlich';
    } else if (lat < -90 || lat > 90) {
      errors.coordinates = 'Breitengrad muss zwischen -90 und 90 liegen';
    } else if (lng < -180 || lng > 180) {
      errors.coordinates = 'Längengrad muss zwischen -180 und 180 liegen';
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }, [formData]);
}; 