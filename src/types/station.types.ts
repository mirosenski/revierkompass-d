export type StationType = 'praesidium' | 'revier'

export interface Station {
  /** Eindeutige Kennung der Station */
  id: string
  /** Name des Präsidiums oder Reviers */
  name: string
  /** Art der Station: Präsidium oder Revier */
  type: 'praesidium' | 'revier'
  /** Stadt, in der die Station liegt */
  city: string
  /** Vollständige Straßenadresse */
  address: string
  /** Koordinaten in der Form [lat, lng] */
  coordinates: [number, number]
  /** Telefonnummer der Station */
  telefon: string
  /** E-Mail-Adresse der Station */
  email?: string
  /** Rund-um-die-Uhr-Erreichbarkeit */
  notdienst24h: boolean
  /** Steuerung der Sichtbarkeit im Frontend oder Adminbereich */
  isActive: boolean
  /** Zeitpunkt der letzten Änderung (für Audit-Logs) */
  lastModified: string
  /** Optional: ID des übergeordneten Präsidiums */
  parentId?: string
  /** Optional: Emergency-Flag */
  isEmergency?: boolean
}
