# RevierKompass v6

Eine moderne Web-Anwendung zur Verwaltung und Navigation von Polizeistationen in Baden-Württemberg.

## 🚀 Schnellstart

### Automatischer Start (Empfohlen)
```bash
npm start
```
Dies startet automatisch:
- Backend-Server auf Port 3001
- Frontend-Server auf Port 5173 (oder höher)

### Manueller Start
```bash
# Backend starten
cd backend && node server.js

# Frontend starten (in neuem Terminal)
npm run dev
```

## 📁 Projektstruktur

```
revierkompass-v6/
├── backend/
│   ├── server.js              # JSON-Server für Stationen
│   │   └── data/
│   │       └── polizeistationen.json  # Stationen-Daten
│   └── package.json
├── src/
│   ├── components/
│   │   ├── wizard/            # Wizard-Komponenten
│   │   │   └── Step2/         # Modulare Step2-Komponente
│   │   └── admin/             # Admin-Komponenten
│   ├── services/
│   │   └── api/               # API-Services
│   └── store/                 # Zustand-Management
├── start-dev.sh               # Automatisches Start-Skript
└── package.json
```

## 🔧 Technologien

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express
- **Daten**: JSON-Server mit lokaler Datei
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Routing**: React Router

## 📊 Features

- ✅ Modulare Step2-Komponente
- ✅ JSON-Server für Stationen
- ✅ Automatischer Start
- ✅ Admin-Bereich für Stationenverwaltung
- ✅ Custom-Adressen
- ✅ Responsive Design

## 🛠️ Entwicklung

### Neue Station hinzufügen
1. Admin-Bereich öffnen
2. "Neue Station" klicken
3. Daten eingeben und speichern

### Custom-Adressen
- Werden im localStorage gespeichert
- Sind nur für den aktuellen Benutzer sichtbar

## 🚨 Troubleshooting

### Server startet nicht
```bash
# Alle Prozesse stoppen
pkill -f "node server.js"
pkill -f "npm run dev"

# Neu starten
npm start
```

### Daten werden nicht geladen
- Prüfe ob Backend auf Port 3001 läuft
- Prüfe die `backend/data/polizeistationen.json` Datei

## 📝 Lizenz

Proprietär - Alle Rechte vorbehalten
