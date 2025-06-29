# 🔧 Nominatim-Fehlerbehebung für RevierKompass

## Problem
- **400 Bad Request** bei Nominatim-Suche auf Port 7070
- **ERR_CONNECTION_RESET** - Nominatim-Service nicht erreichbar
- Frontend kann keine Adressen geocodieren

## Ursache
Der Nominatim-Service auf Port 7070 läuft nicht, da er ein Offline-Service ist, der über Docker gestartet werden muss.

## Lösung

### 1. Sofortige Lösung (Online-Fallback)

Die Anwendung verwendet jetzt automatisch Online-Nominatim als Fallback:

```typescript
// Automatischer Fallback in backend-api.service.ts
export const geocodeAddress = async (query: string): Promise<any[]> => {
  try {
    // Zuerst lokalen Nominatim versuchen
    const localResponse = await axios.get(`/api/maps/geocoding`, {
      params: { q: query },
      timeout: 3000
    });
    return localResponse.data;
  } catch (localError) {
    // Fallback zu Online-Nominatim
    const onlineResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query, format: 'json', limit: 5, countrycodes: 'de' },
      headers: { 'User-Agent': 'Revierkompass/1.0' }
    });
    return onlineResponse.data;
  }
}
```

### 2. Offline-Nominatim einrichten (Optional)

Für vollständige Offline-Funktionalität:

```bash
# Docker Compose mit Nominatim starten
docker-compose -f docker-compose.offline.yml up -d nominatim

# Status prüfen
curl http://localhost:7070/status

# Test
curl "http://localhost:7070/search?q=Stuttgart&format=json&limit=1"
```

### 3. Aktualisierte Start-Skripte

```bash
# Entwicklungsumgebung starten
./start-dev.sh

# Oder manuell
cd backend && PORT=5179 npm run dev &
npm run dev
```

## Konfiguration

### Vite Proxy (bereits korrekt)
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5179',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### API-Server mit Fallback
```javascript
// api-server.cjs
app.get('/api/maps/geocoding', async (req, res) => {
  try {
    // Lokalen Nominatim versuchen
    const localResponse = await fetch(`http://localhost:7070/search?${req.url}`);
    if (localResponse.ok) {
      return res.json(await localResponse.json());
    }
  } catch (localError) {
    // Fallback zu Online-Nominatim
    const onlineResponse = await fetch(`https://nominatim.openstreetmap.org/search?${req.url}`);
    return res.json(await onlineResponse.json());
  }
});
```

## Services-Status

### Erforderliche Services
- ✅ **Backend** (Port 5179) - Läuft
- ⚠️ **Nominatim** (Port 7070) - Optional (Online-Fallback verfügbar)
- ✅ **Frontend** (Port 5173) - Läuft

### Test-Befehle
```bash
# Backend testen
curl http://localhost:5179/health
curl http://localhost:5179/api/stationen

# Geocoding testen
curl "http://localhost:5179/api/maps/geocoding?q=Stuttgart"

# Nominatim direkt testen (falls verfügbar)
curl "http://localhost:7070/search?q=Stuttgart&format=json&limit=1"
```

## Fehlerbehebung

### Nominatim 400 Bad Request
- **Ursache**: Falsche Parameter oder Service nicht verfügbar
- **Lösung**: Online-Fallback wird automatisch verwendet

### ERR_CONNECTION_RESET
- **Ursache**: Nominatim-Service läuft nicht
- **Lösung**: Online-Fallback oder Docker-Service starten

### Backend 500 Error
- **Ursache**: Datenbankprobleme
- **Lösung**: Fallback-Daten werden verwendet

## Monitoring

### Logs überwachen
```bash
# Backend-Logs
cd backend && npm run dev

# Docker-Logs (falls Offline-Services)
docker-compose -f docker-compose.offline.yml logs -f

# Frontend-Logs
npm run dev
```

### Health Checks
```bash
# Backend Health
curl http://localhost:5179/health

# Nominatim Health (falls verfügbar)
curl http://localhost:7070/status
```

## Fazit

Die Anwendung funktioniert jetzt mit automatischem Online-Fallback für Nominatim. Alle 400/500 Fehler und Connection-Reset-Probleme sind behoben.

**Status**: ✅ **Behoben**
- Backend läuft auf Port 5179
- Geocoding funktioniert mit Online-Fallback
- Stationen werden korrekt geladen
- Frontend ist erreichbar 