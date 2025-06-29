# Animated Logo Component

Eine coole, animierte Logo-Komponente basierend auf den einzelnen SVG-Teilen aus dem `/public/images/LOGO/` Verzeichnis.

## 🚀 Live Demo

Um die Logo-Komponente live zu testen, fügen Sie `#logo-test` zur URL hinzu:

```
http://localhost:5174/#logo-test
```

## Features

- 🎨 **Mehrschichtige Animationen**: Verschiedene Teile rotieren mit unterschiedlichen Geschwindigkeiten
- ⭐ **Pulsierender Stern**: Der zentrale Kompass-Stern pulsiert sanft
- 💫 **Glühende Punkte**: Die zentralen Punkte leuchten abwechselnd
- 🎯 **Interaktiv**: Klick zum Pausieren/Fortsetzen der Animationen
- 🖱️ **Hover-Effekte**: Animationen beschleunigen sich beim Hover
- 📱 **Responsive**: Funktioniert auf allen Bildschirmgrößen
- 🎭 **Smooth Loading**: Elegante Einblend-Animation
- 🌟 **Varianten**: Default, Glow und Minimal-Varianten

## Verwendung

```tsx
import AnimatedLogo from './components/AnimatedLogo';

// Basis-Verwendung
<AnimatedLogo />

// Mit benutzerdefinierten Props
<AnimatedLogo 
  size={300} 
  variant="glow" 
  autoPlay={false} 
  className="my-custom-class" 
/>
```

## Props

| Prop | Typ | Standard | Beschreibung |
|------|-----|----------|--------------|
| `size` | `number` | `200` | Größe des Logos in Pixeln |
| `autoPlay` | `boolean` | `true` | Startet Animation automatisch |
| `variant` | `'default' \| 'glow' \| 'minimal'` | `'default'` | Stil-Variante des Logos |
| `className` | `string` | `''` | Zusätzliche CSS-Klassen |

## Varianten

### Default
- Standard-Animationen mit allen Elementen
- Mittlere Glow-Effekte

### Glow
- Verstärkte Glow-Effekte
- Zusätzliche Leucht-Elemente
- Perfekt für Hero-Sections

### Minimal
- Reduzierte Elemente
- Saubere, einfache Darstellung
- Ideal für kleine Größen

## Animationen

### Rotations-Animationen
- **Äußerer Ring**: 20s Rotation (im Uhrzeigersinn)
- **Mittlerer Ring**: 15s Rotation (gegen Uhrzeigersinn)
- **Speichen**: 12s Rotation (im Uhrzeigersinn)
- **Kompass-Speichen**: 10s Rotation (im Uhrzeigersinn)

### Pulsier-Animationen
- **Stern**: 3s Pulsieren mit Skalierung
- **Zentrale Punkte**: 2s Glühen mit Drop-Shadow

### Hover-Effekte
- Beschleunigung aller Animationen
- Sanfte Skalierung des gesamten Logos
- Helligkeits-Anpassungen

## Demo

Führen Sie die `LogoDemo`-Komponente aus, um verschiedene Größen und Einstellungen zu testen:

```tsx
import LogoDemo from './components/LogoDemo';

<LogoDemo />
```

## Technische Details

- **Framework**: React mit TypeScript
- **Styling**: Tailwind CSS mit CSS-Animationen
- **SVG**: Optimierte Pfade für moderne Browser
- **Performance**: Hardware-beschleunigte CSS-Transformationen

## Dateistruktur

```
src/components/
├── AnimatedLogo.tsx      # Hauptkomponente
├── LogoDemo.tsx          # Demo-Komponente
└── README.md             # Diese Datei

src/pages/
└── LogoTest.tsx          # Test-Seite für die App
```

## Anpassung

Die Animationen können in der Komponente angepasst werden:

- Geschwindigkeiten in den `ringClasses`-Aufrufen
- Farben in den `linearGradient`-Definitionen
- Hover-Effekte in den CSS-Klassen

## Browser-Support

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile Browser

Benötigt CSS-Animationen und SVG-Support.

## 🎯 Nächste Schritte

1. Öffnen Sie die App im Browser unter `http://localhost:5174/`
2. Fügen Sie `#logo-test` zur URL hinzu: `http://localhost:5174/#logo-test`
3. Testen Sie die verschiedenen Varianten und Größen
4. Klicken Sie auf die Logos, um Animationen zu pausieren/fortzusetzen
5. Hover-Effekte ausprobieren 