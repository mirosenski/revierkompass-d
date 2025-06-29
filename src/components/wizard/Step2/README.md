# Step2 - Polizeistationen & Eigene Adressen Auswahl

## 📁 Verzeichnisstruktur

```
Step2/
├── README.md                    # Diese Dokumentation
├── index.ts                     # Module Exports
├── Step2.tsx                    # Hauptkomponente
├── components/                  # UI-Komponenten
│   ├── PraesidiumCard.tsx      # Präsidium-Karte mit Revieren
│   ├── ViewSwitcher.tsx        # Ansichts-Umschalter (Grid/List/Compact/Map)
│   ├── SearchBar.tsx           # Suchleiste mit Sprachsteuerung
│   ├── CommandDialog.tsx       # Befehls-Palette
│   ├── CustomAddressForm.tsx   # Formular für eigene Adressen
│   ├── FloatingActionPanel.tsx # Schwebendes Aktions-Panel
│   └── TabContent.tsx          # Tab-Inhalte (Stationen/Custom)
├── types/                       # TypeScript-Definitionen
│   └── index.ts                # Alle Interfaces und Types
├── animations/                  # Framer Motion Animationen
│   └── variants.ts             # Animation-Variants
├── utils/                       # Utility-Funktionen
│   └── mapUtils.ts             # Map-bezogene Hilfsfunktionen
└── hooks/                       # Custom Hooks
    └── useStep2Logic.ts        # Hauptlogik-Hook
```

## 🎯 Funktionalität

### Hauptfeatures:
- **Polizeistationen-Auswahl**: Präsidien und Reviere auswählen
- **Eigene Adressen**: Custom Adressen hinzufügen und verwalten
- **4 Ansichtsmodi**: Grid, Liste, Kompakt und Karte
- **Erweiterte Suche**: Nach Namen, Städten und Adressen
- **Sprachsteuerung**: Voice Commands für bessere UX
- **Befehls-Palette**: Schnellaktionen über ⌘+K
- **Keyboard Shortcuts**: Vollständige Tastatur-Navigation
- **Responsive Design**: Optimiert für alle Bildschirmgrößen

### Ansichtsmodi:
1. **Grid**: Karten-Layout mit erweiterbaren Präsidien
2. **List**: Listenansicht mit Fortschrittsbalken
3. **Compact**: Kompakte Übersicht für schnelle Auswahl
4. **Map**: Interaktive Karte mit Routenberechnung

## 🧩 Komponenten-Übersicht

### Hauptkomponenten:

#### `Step2.tsx` - Hauptkomponente
- Orchestriert alle Sub-Komponenten
- Verwaltet Keyboard-Shortcuts
- Koordiniert State-Management

#### `PraesidiumCard.tsx` - Präsidium-Karte
- Zeigt Präsidium-Informationen
- Erweiterbare Revier-Liste
- Auswahl-Status und Fortschritt

#### `ViewSwitcher.tsx` - Ansichts-Umschalter
- 4 Ansichtsmodi (Grid/List/Compact/Map)
- Visuelle Icons für jede Ansicht
- Smooth Transitions

#### `SearchBar.tsx` - Suchleiste
- Volltext-Suche
- Sprachsteuerung-Button
- Responsive Design

#### `CommandDialog.tsx` - Befehls-Palette
- Schnellaktionen
- Präsidium-Auswahl
- Keyboard-Navigation

#### `CustomAddressForm.tsx` - Adress-Formular
- Validierung
- Responsive Grid-Layout
- Smooth Animations

#### `FloatingActionPanel.tsx` - Schwebendes Panel
- Drag & Drop Interface
- Auswahl-Übersicht
- Quick Actions

#### `TabContent.tsx` - Tab-Inhalte
- Stationen-Tab
- Custom-Adressen-Tab
- View-spezifische Rendering

### Utility-Komponenten:

#### `useStep2Logic.ts` - Custom Hook
- Zentrale Business-Logik
- State-Management
- API-Calls (OSRM Routing)
- Event-Handler

#### `types/index.ts` - TypeScript-Definitionen
- Interfaces für alle Komponenten
- Type-Safety
- Dokumentation

#### `animations/variants.ts` - Animationen
- Framer Motion Variants
- Konsistente Animationen
- Performance-optimiert

#### `utils/mapUtils.ts` - Map-Utilities
- Marker-Generierung
- Koordinaten-Verarbeitung
- Route-Formatierung

## 🎨 Design-System

### Farben:
- **Blau**: Primärfarbe für Polizeistationen
- **Grün**: Sekundärfarbe für Custom-Adressen
- **Grau**: Neutrale UI-Elemente
- **Purple**: Sprachsteuerung

### Animationen:
- **Stagger**: Gestaffelte Einblendung
- **Hover**: Scale-Effekte
- **Transitions**: Smooth State-Änderungen
- **Drag**: Floating Panel

### Responsive Breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## ⌨️ Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `⌘/Ctrl + K` | Befehls-Palette öffnen |
| `⌘/Ctrl + /` | Suchleiste fokussieren |
| `⌘/Ctrl + 1-4` | Ansichtsmodi wechseln |
| `⌘/Ctrl + A` | Alle sichtbaren auswählen |
| `Escape` | Modals schließen |

## 🔧 Technische Details

### Dependencies:
- **React**: 18+
- **TypeScript**: 4.9+
- **Framer Motion**: Animationen
- **Lucide React**: Icons
- **React Hot Toast**: Notifications

### Performance-Optimierungen:
- **Memoization**: React.memo für Komponenten
- **Lazy Loading**: Komponenten bei Bedarf
- **Debouncing**: Such-Eingaben
- **Rate Limiting**: API-Calls (OSRM)

### Accessibility:
- **ARIA-Labels**: Screen Reader Support
- **Keyboard Navigation**: Vollständige Tastatur-Steuerung
- **Focus Management**: Logische Tab-Reihenfolge
- **Color Contrast**: WCAG 2.1 AA Compliance

## 🚀 Verwendung

### Import:
```typescript
import Step2 from '@/components/wizard/Step2';
```

### Integration:
```typescript
// In Wizard-Container
<Step2 />
```

### Props:
Die Komponente benötigt keine Props, da sie alle States über Stores verwaltet.

## 🔄 State Management

### Stores:
- **useStationStore**: Polizeistationen-Daten
- **useWizardStore**: Wizard-State (Auswahl)
- **useAppStore**: App-weite States

### Local State:
- Ansichtsmodi
- Such-Query
- Form-Daten
- UI-States (Modals, Panels)

## 🐛 Debugging

### Console-Logs:
- Stationen-Loading
- Routenberechnung
- Auswahl-Änderungen
- Performance-Metriken

### DevTools:
- React DevTools für State
- Redux DevTools für Stores
- Network Tab für API-Calls

## 📈 Performance-Metriken

### Optimierungen:
- **Bundle Size**: Code-Splitting
- **Render Performance**: React.memo
- **Memory Usage**: Cleanup in useEffect
- **Network**: Caching und Rate Limiting

### Monitoring:
- **Lighthouse**: Performance-Scores
- **Bundle Analyzer**: Bundle-Größe
- **React Profiler**: Render-Performance

## 🔮 Zukunft

### Geplante Features:
- **Offline Support**: Service Worker
- **PWA**: Progressive Web App
- **Advanced Search**: Filter und Sortierung
- **Bulk Operations**: Massen-Auswahl
- **Export**: PDF/Excel Export

### Technische Verbesserungen:
- **Virtual Scrolling**: Für große Listen
- **Web Workers**: Background Processing
- **IndexedDB**: Offline Storage
- **WebAssembly**: Performance-kritische Berechnungen

---

**Entwickelt mit ❤️ für die Polizei Baden-Württemberg** 