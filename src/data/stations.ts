import { Station } from '@/types/station.types'

// Lokale Stationsdaten als Fallback
export const localStationsData: Station[] = [
  {
    id: 'stuttgart-praesidium',
    name: 'Polizeipräsidium Stuttgart',
    type: 'praesidium',
    city: 'Stuttgart',
    address: 'Hahnemannstraße 1',
    coordinates: [48.810460, 9.186860],
    telefon: '0711 8990-0',
    email: 'stuttgart.pp@polizei.bwl.de',
    notdienst24h: true,
    isActive: true,
    lastModified: new Date().toISOString(),
    parentId: undefined
  }
] 