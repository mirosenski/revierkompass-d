export const PROFILE_DISPLAY_NAMES: Record<string, string> = {
  emergency_fast: 'Einsatzfahrt (Schnellste)',
  police_patrol: 'Polizei-Streife (Standard)',
  pedestrian_safe: 'Fußweg (Sicherste)',
  bicycle_patrol: 'Fahrrad-Streife',
  public_transport: 'ÖPNV'
};

export function getProfileDisplayName(profile: string): string {
  return PROFILE_DISPLAY_NAMES[profile] || profile;
}

export interface DefaultRouteProfile {
  id: string;
  name: string;
  mode: string;
  costing: string;
  description: string;
  icon: string;
  useCase: string;
}

export const DEFAULT_ROUTE_PROFILES: DefaultRouteProfile[] = [
  {
    id: 'police_patrol',
    name: PROFILE_DISPLAY_NAMES['police_patrol'],
    mode: 'auto',
    costing: 'auto',
    description: 'Standard-Routing für Polizeistreifen',
    icon: '🚔',
    useCase: 'Routine-Patrouillen'
  },
  {
    id: 'emergency_fast',
    name: PROFILE_DISPLAY_NAMES['emergency_fast'],
    mode: 'emergency',
    costing: 'auto',
    description: 'Optimiert für Einsatzfahrten',
    icon: '🚨',
    useCase: 'Notfall-Einsätze'
  },
  {
    id: 'pedestrian_safe',
    name: PROFILE_DISPLAY_NAMES['pedestrian_safe'],
    mode: 'pedestrian',
    costing: 'pedestrian',
    description: 'Sichere Fußwege',
    icon: '🚶',
    useCase: 'Fußstreife'
  }
];
