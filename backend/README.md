# RevierKompass Backend API

Ein vollständiges Express.js Backend für die RevierKompass-Anwendung mit JWT-Authentifizierung, PostgreSQL-Datenbank und umfassender API.

## 🚀 Features

- **Benutzerauthentifizierung**: JWT-basiert mit Access/Refresh-Tokens
- **Polizeistationen-Management**: CRUD-Operationen mit Geocoding
- **Custom-Adressen**: Benutzer-spezifische Adressverwaltung
- **Admin-Dashboard**: Vollständige Verwaltung von Benutzern und Stationen
- **Audit-Logging**: Vollständige Nachverfolgung aller Admin-Aktionen
- **Rate-Limiting**: Schutz vor Brute-Force-Angriffen
- **Input-Validierung**: Zod-basierte Schemata-Validierung
- **PostgreSQL**: Mit PostGIS für Geodaten-Unterstützung

## 📁 Projektstruktur

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts          # JWT-Login/Logout/Profile
│   │   ├── stations.ts      # Polizeistationen CRUD
│   │   ├── addresses.ts     # Custom-Adressen Management
│   │   └── users.ts         # Admin-Benutzerverwaltung
│   ├── middleware/
│   │   ├── auth.ts          # JWT-Validierung + RBAC
│   │   ├── validation.ts    # Zod-Input-Validierung
│   │   └── rateLimiter.ts   # Rate-Limiting
│   ├── lib/
│   │   ├── prisma.ts        # Prisma-Client-Setup
│   │   └── jwt.ts           # JWT-Token-Management
│   ├── scripts/
│   │   └── seed.ts          # Datenbank-Seeding
│   └── index.ts             # Haupt-Server-Datei
├── prisma/
│   └── schema.prisma        # DB-Schema mit PostGIS
├── .env.example             # Umgebungsvariablen-Vorlage
├── package.json
└── tsconfig.json
```

## 🛠️ Installation & Setup

### 1. Abhängigkeiten installieren
```bash
cd backend
npm install
```

### 2. Umgebungsvariablen konfigurieren
```bash
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Datenbankdaten
```

### 3. PostgreSQL-Datenbank einrichten
```bash
# PostgreSQL mit PostGIS installieren
sudo apt-get install postgresql postgresql-contrib postgis

# Datenbank erstellen
sudo -u postgres createdb revierkompass
sudo -u postgres psql -d revierkompass -c "CREATE EXTENSION postgis;"
```

### 4. Prisma-Setup
```bash
# Prisma-Client generieren
npx prisma generate

# Datenbank-Migration
npx prisma db push

# Datenbank mit Demo-Daten befüllen
npm run seed

# Polizeistationen aus Excel importieren
npm run import-stations:dev
```

### 5. Server starten
```bash
# Entwicklungsmodus
npm run dev

# Produktionsmodus
npm run build
npm start
```

## 📡 API-Endpunkte

### Authentifizierung
```http
POST   /api/auth/login      # JWT-Token + Refresh-Token
POST   /api/auth/logout     # Token-Invalidierung
POST   /api/auth/refresh    # Token-Erneuerung
GET    /api/auth/profile    # Geschützt, gibt User-Daten
```

### Polizeistationen (Öffentlich)
```http
GET    /api/stationen        # Alle Stationen (mit Filter)
GET    /api/stationen/:id    # Einzelne Station
```

### Polizeistationen (Admin-only)
```http
POST   /api/stationen        # Neue Station erstellen
PUT    /api/stationen/:id    # Station aktualisieren
DELETE /api/stationen/:id    # Station deaktivieren
POST   /api/stationen/bulk-import  # Bulk-Import
GET    /api/stationen/admin/stats  # Statistiken
```

### Custom-Adressen
```http
GET    /api/addresses       # User-spezifische Adressen
POST   /api/addresses       # Neue Adresse erstellen
PUT    /api/addresses/:id   # Adresse aktualisieren
DELETE /api/addresses/:id   # Adresse löschen
PUT    /api/addresses/:id/verify  # Admin: Adresse verifizieren
```

### Benutzerverwaltung (Admin-only)
```http
GET    /api/users           # Alle Benutzer
POST   /api/users           # Neuen Benutzer erstellen
PUT    /api/users/:id       # Benutzer aktualisieren
DELETE /api/users/:id       # Benutzer deaktivieren
GET    /api/users/admin/stats  # Benutzer-Statistiken
```

## 🔒 Sicherheitsfeatures

### JWT-Tokens
- **Access-Token**: 1 Stunde (signiert mit JWT_SECRET)
- **Refresh-Token**: 7 Tage (signiert mit JWT_REFRESH_SECRET)
- Automatische Token-Bereinigung

### Passwort-Sicherheit
- BCrypt-Hashing mit 10 Runden
- Mindestlänge: 6 Zeichen

### Rate-Limiting
- Allgemeine API: 100 Anfragen/15min
- Login-Endpunkt: 5 Versuche/15min
- Erstellungsoperationen: 50 Anfragen/15min

### CORS
- Nur Anfragen vom Frontend (localhost:5173) erlaubt
- Credentials-Support aktiviert

### Input-Validierung
- Zod-Schemata für alle Endpunkte
- Detaillierte Fehlermeldungen
- SQL-Injection-Schutz durch Prisma

### Audit-Logging
- Automatisches Logging aller Admin-Aktionen
- IP-Adresse und User-Agent werden gespeichert
- Vollständige Nachverfolgbarkeit

## 🗄️ Datenbank-Schema

### Hauptentitäten

#### User
```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (BCrypt-Hash)
  role: "admin" | "user"
  isActive: boolean
  lastLogin: DateTime?
  addresses: CustomAddress[]
  auditLogs: AuditLog[]
}
```

#### PoliceStation
```typescript
{
  id: string (UUID)
  name: string
  address: string
  city: string
  zipCode: string
  coordinates: { lat: number, lng: number }
  type: "präsidium" | "revier"
  phone?: string
  email?: string
  openingHours?: string
  isEmergency: boolean
  isActive: boolean
}
```

#### CustomAddress
```typescript
{
  id: string (UUID)
  userId: string
  name: string
  street: string
  zipCode: string
  city: string
  coordinates: { lat: number, lng: number }
  isVerified: boolean (Admin kann verifizieren)
  isActive: boolean
}
```

#### AuditLog
```typescript
{
  id: string (UUID)
  userId: string
  action: string ("create_station" | "delete_address" etc.)
  entity: string ("station" | "address" | "user")
  entityId: string
  details: object (zusätzliche Details)
  ipAddress?: string
  userAgent?: string
  timestamp: DateTime
}
```

## 🎯 Demo-Anmeldedaten

Nach dem Seeding sind folgende Benutzer verfügbar:

```
Admin: admin@revierkompass.de / admin123
Demo:  demo@revierkompass.de / demo123
```

## 🔧 NPM-Scripts

```bash
npm run dev         # Entwicklungsserver mit Nodemon
npm run build       # TypeScript kompilieren
npm run start       # Produktionsserver starten
npm run seed        # Datenbank mit Demo-Daten befüllen
npm run db:reset    # Datenbank zurücksetzen und neu befüllen
npm run db:studio   # Prisma Studio öffnen
npm run lint        # ESLint ausführen
npm run test        # Tests ausführen
```

## ✅ Tests

Um die Jest-Testsuite auszuführen, wechsel in das Backend-Verzeichnis und starte:

```bash
cd backend
npm run test
```

Die Datenbankzugriffe werden dabei gemockt, sodass keine echte Datenbank benötigt wird.

## 🐳 Docker-Support

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/revierkompass
    depends_on:
      - db
  
  db:
    image: postgis/postgis:13-3.1
    environment:
      - POSTGRES_DB=revierkompass
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  volumes:
    postgres_data:
```

Die Datenbank wird automatisch durch Prisma-Migrationen und das Seed-Skript
initialisiert. Zusätzliche SQL-Initialisierungsskripte sind daher nicht nötig.

## 🚨 Troubleshooting

### Häufige Probleme

1. **Datenbankverbindung fehlgeschlagen**
   ```bash
   # PostgreSQL-Service prüfen
   sudo systemctl status postgresql
   
   # Verbindung testen
   psql -h localhost -U postgres -d revierkompass
   ```

2. **Prisma-Fehler**
   ```bash
   # Prisma-Client neu generieren
   npx prisma generate
   
   # Datenbank-Schema zurücksetzen
   npx prisma db push --force-reset
   ```

3. **JWT-Token-Probleme**
   - Prüfen Sie JWT_SECRET und JWT_REFRESH_SECRET in .env
   - Stellen Sie sicher, dass Uhrzeiten synchronisiert sind

4. **CORS-Fehler**
   - Überprüfen Sie FRONTEND_URL in .env
   - Stellen Sie sicher, dass das Frontend auf localhost:5173 läuft

## 📊 Monitoring & Logs

### Health-Check
```bash
curl http://localhost:3001/health
```

### Log-Format
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User login successful",
  "userId": "uuid",
  "ip": "192.168.1.1"
}
```

## 🔄 API-Versionierung

Aktuelle Version: **v1**
Alle Endpunkte sind unter `/api/` verfügbar.

## 📝 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 🤝 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository oder kontaktieren Sie das Entwicklungsteam.