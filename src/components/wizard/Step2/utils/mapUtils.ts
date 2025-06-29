import { RouteResult } from '@/lib/store/app-store';

// Hilfsfunktion für alle Marker (Präsidien + Reviere)
export function buildAllMapMarkers(stations: any[]): any[] {
  const praesidien = stations.filter(s => s.type === 'praesidium' && s.coordinates);
  const reviere = stations.filter(s => s.type === 'revier' && s.coordinates);

  return [
    ...praesidien.map(p => ({
      id: p.id,
      destinationId: p.id,
      destinationName: p.name,
      destinationType: 'station',
      address: p.address,
      coordinates: { lat: p.coordinates[0], lng: p.coordinates[1] },
      color: '#2563eb',
      distance: 0,
      duration: 0,
      estimatedFuel: 0,
      estimatedCost: 0,
      routeType: 'Schnellste',
      stationType: 'Präsidium',
      route: { coordinates: [[p.coordinates[1], p.coordinates[0]]], distance: 0, duration: 0 },
      provider: 'Direct'
    })),
    ...reviere.map(r => ({
      id: r.id,
      destinationId: r.id,
      destinationName: r.name,
      destinationType: 'station',
      address: r.address,
      coordinates: { lat: r.coordinates[0], lng: r.coordinates[1] },
      color: '#22c55e',
      distance: 0,
      duration: 0,
      estimatedFuel: 0,
      estimatedCost: 0,
      routeType: 'Schnellste',
      stationType: 'Revier',
      route: { coordinates: [[r.coordinates[1], r.coordinates[0]]], distance: 0, duration: 0 },
      provider: 'Direct'
    }))
  ];
} 