import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Coordinate validation
const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
});

export const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
  role: z.enum(['admin', 'user']).default('user'),
});

// Station schemas
export const createStationSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  zipCode: z.string().regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben'),
  coordinates: coordinatesSchema,
  type: z.enum(['präsidium', 'revier']),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  openingHours: z.string().optional(),
  isEmergency: z.boolean().default(false),
  responsibilityArea: z.string().optional(),
  praesidiumId: z.string().uuid().optional(),
});

export const updateStationSchema = createStationSchema.partial();

// Address schemas
export const createAddressSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  street: z.string().min(1, 'Straße ist erforderlich'),
  zipCode: z.string().regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  coordinates: coordinatesSchema,
});

export const updateAddressSchema = createAddressSchema.partial();

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
  role: z.enum(['admin', 'user']).default('user'),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
});

// Validation middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validierungsfehler',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Query parameter validation
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validierungsfehler in Query-Parametern',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
