# RevierKompass

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
revierkompass-d/
├── api/                     # Vercel API Routes
│   ├── stationen.ts         # Stationen API
│   ├── stationen-id.ts      # Einzelne Station API
│   └── health.ts            # Health Check API
├── backend/
│   ├── server.js            # Express-Server
│   ├── simple-server.js     # Erweiterter Server
│   ├── src/
│   │   └── routes/          # API-Routen
│   └── prisma/              # Datenbank-Schema
├── prisma/
│   ├── schema.prisma        # Prisma Schema
│   └── dev.db              # SQLite Datenbank
├── src/
│   ├── components/          # React-Komponenten
│   ├── pages/              # Seiten-Komponenten
│   ├── services/           # API-Services
│   ├── store/              # Zustand-Management
│   ├── types/              # TypeScript Typen
│   └── lib/                # Utility-Funktionen
├── shared/                 # Geteilte Komponenten
├── start-dev.sh            # Automatisches Start-Skript
├── vercel.json             # Vercel-Konfiguration
└── package.json
```

## 🔧 Technologien

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, Prisma ORM
- **Datenbank**: SQLite (Entwicklung), PostgreSQL (Produktion)
- **Styling**: Tailwind CSS, Radix UI, shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router
- **Deployment**: Vercel
- **Maps**: MapLibre GL
- **Forms**: React Hook Form + Zod
- **API**: TanStack Query (React Query)

## 📊 Features

- ✅ Moderne React 18 Architektur
- ✅ TypeScript für Typsicherheit
- ✅ Prisma ORM für Datenbankzugriff
- ✅ Vercel API Routes
- ✅ MapLibre GL für Kartendarstellung
- ✅ Admin-Bereich für Stationenverwaltung
- ✅ Custom-Adressen mit Review-System
- ✅ Responsive Design mit Tailwind CSS
- ✅ Formulare mit React Hook Form
- ✅ Toast-Benachrichtigungen
- ✅ PDF-Export-Funktionalität
- ✅ Excel-Import/Export

## 🛠️ Entwicklung

### Datenbank-Setup
```bash
# Prisma Client generieren
npx prisma generate

# Datenbank-Migration
npx prisma db push

# Prisma Studio öffnen
npx prisma studio
```

### Neue Station hinzufügen
1. Admin-Bereich öffnen
2. "Neue Station" klicken
3. Daten eingeben und speichern

### Custom-Adressen
- Werden in der Datenbank gespeichert
- Review-System für Qualitätskontrolle
- Unterstützung für anonyme Einträge

## 🚨 Troubleshooting

### Server startet nicht
```bash
# Alle Prozesse stoppen
pkill -f "node server.js"
pkill -f "npm run dev"

# Neu starten
npm start
```

### Datenbank-Probleme
```bash
# Prisma Client neu generieren
npx prisma generate

# Datenbank zurücksetzen
npx prisma db push --force-reset
```

### Vercel Deployment
```bash
# Lokaler Vercel-Server
npm run vercel-dev

# Produktions-Deployment
npm run vercel-deploy
```

## 📝 Lizenz

Proprietär - Alle Rechte vorbehalten
