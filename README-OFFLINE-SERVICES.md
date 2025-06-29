# 🗺️ Revierkompass Offline-Services

Diese Anleitung erklärt, wie Sie die Offline-Services für Revierkompass einrichten, um realistische Routenberechnung und Adresssuche auch ohne Internetverbindung zu ermöglichen.

## 📋 Übersicht

Die Offline-Services bestehen aus:

- **OSRM** - Routing-Engine für echte Straßenrouten
- **Nominatim** - Geocoding-Service für Adresssuche
- **TileServer GL** - Offline-Karten und Tiles
- **Redis** - Caching für bessere Performance
- **Nginx** - Reverse Proxy und Load Balancer

## 🚀 Schnellstart

### Voraussetzungen

- Docker und Docker Compose installiert
- Mindestens 20GB freier Speicherplatz
- 8GB RAM empfohlen

### Installation

1. **Setup-Script ausführen:**
   ```bash
   chmod +x setup-offline-services.sh
   ./setup-offline-services.sh
   ```

2. **Warten Sie, bis alle Services bereit sind** (kann 10-30 Minuten dauern beim ersten Start)

3. **Services testen:**
   ```bash
   # Routing testen
   curl "http://localhost:5000/route/v1/driving/9.18,48.78;11.58,48.14"
   
   # Geocoding testen
   curl "http://localhost:7070/search?q=Stuttgart&format=json&limit=1"
   
   # Karten testen
   curl "http://localhost:8080/"
   ```

## 🔧 Konfiguration

### Routing-Service (OSRM)

**URL:** `http://localhost:5000`

**Features:**
- Echte Straßenrouten statt Luftlinien
- Verschiedene Verkehrsmittel (Auto, Fahrrad, Fuß)
- Optimierung für Schnellste/Kürzeste/Ökonomisch
- Polizei-spezifische Profile

**API-Endpunkte:**
```bash
# Route berechnen
GET /route/v1/{profile}/{coordinates}

# Status prüfen
GET /status

# Beispiel
curl "http://localhost:5000/route/v1/driving/9.18,48.78;11.58,48.14?overview=full&geometries=geojson"
```

### Geocoding-Service (Nominatim)

**URL:** `http://localhost:7070`

**Features:**
- Adresse → Koordinaten
- Koordinaten → Adresse (Reverse Geocoding)
- Suche nach POIs
- Deutsche Adressen optimiert

**API-Endpunkte:**
```bash
# Adresse suchen
GET /search?q={query}&format=json&limit=5

# Reverse Geocoding
GET /reverse?lat={lat}&lon={lon}&format=json

# Beispiel
curl "http://localhost:7070/search?q=Stuttgart&format=json&limit=1"
```

### TileServer GL

**URL:** `http://localhost:8080`

**Features:**
- Offline-Karten für Deutschland
- Verschiedene Kartenstile (Straßen, Satellit, Gelände)
- Optimierte Performance
- Caching

**Verfügbare Styles:**
- `streets` - Straßenkarte
- `satellite` - Satellitenbilder
- `terrain` - Geländekarte

## 🔄 Integration in Revierkompass

### 1. Routing-Service aktualisieren

Der `RoutingService` erkennt automatisch, wenn Offline-Services verfügbar sind:

```typescript
// Automatische Erkennung
const routingService = new RoutingService();

// Routen berechnen (verwendet automatisch Offline-Services wenn verfügbar)
const route = await routingService.calculateSingleRoute(
  startCoordinates,
  endCoordinates,
  { profile: 'fastest' }
);
```

### 2. Offline-Map-Service konfigurieren

```typescript
import { offlineMapService } from '@/lib/services/offline-map-service';

// Offline-Services konfigurieren
const config = {
  tileServerUrl: 'http://localhost:8080',
  routingServerUrl: 'http://localhost:5000',
  geocodingServerUrl: 'http://localhost:7070',
  dataPath: '/data'
};

// Offline-Kartenstil laden
const style = await offlineMapService.getOfflineMapStyle('streets');
```

### 3. Map-Komponente erweitern

```typescript
// EnhancedMapComponent verwendet automatisch Offline-Services
<EnhancedMapComponent
  routeResults={routeResults}
  startAddress={startAddress}
  startCoordinates={startCoordinates}
  onRouteRecalculate={handleRouteRecalculate}
/>
```

## 📊 Monitoring & Logs

### Services-Status prüfen

```bash
# Alle Services
docker-compose -f docker-compose.offline.yml ps

# Logs anzeigen
docker-compose -f docker-compose.offline.yml logs -f

# Spezifische Service-Logs
docker-compose -f docker-compose.offline.yml logs -f osrm
docker-compose -f docker-compose.offline.yml logs -f nominatim
docker-compose -f docker-compose.offline.yml logs -f tileserver
```

### Performance-Metriken

```typescript
// Routing-Metriken abrufen
const metrics = routingService.getRoutingMetrics();
const cacheStats = routingService.getCacheStats();

console.log('Cache Hit Rate:', cacheStats.hitRate + '%');
console.log('Routing Success Rate:', 
  (metrics.filter(m => m.success).length / metrics.length) * 100 + '%'
);
```

## 🔧 Wartung

### Daten aktualisieren

```bash
# OSRM-Daten aktualisieren (wöchentlich empfohlen)
docker-compose -f docker-compose.offline.yml down
rm -rf data/osrm/*
docker-compose -f docker-compose.offline.yml up -d osrm

# Nominatim-Daten aktualisieren (monatlich empfohlen)
docker-compose -f docker-compose.offline.yml down
rm -rf data/nominatim/*
docker-compose -f docker-compose.offline.yml up -d nominatim
```

### Backup erstellen

```bash
# Backup aller Daten
tar -czf revierkompass-offline-backup-$(date +%Y%m%d).tar.gz data/

# Backup wiederherstellen
tar -xzf revierkompass-offline-backup-20231201.tar.gz
```

### Services neu starten

```bash
# Alle Services neu starten
docker-compose -f docker-compose.offline.yml restart

# Einzelne Services neu starten
docker-compose -f docker-compose.offline.yml restart osrm
docker-compose -f docker-compose.offline.yml restart nominatim
```

## 🚨 Troubleshooting

### OSRM startet nicht

```bash
# Logs prüfen
docker-compose -f docker-compose.offline.yml logs osrm

# Daten-Verzeichnis prüfen
ls -la data/osrm/

# OSRM-Container neu erstellen
docker-compose -f docker-compose.offline.yml down
docker-compose -f docker-compose.offline.yml up -d osrm
```

### Nominatim ist langsam

```bash
# PostgreSQL-Performance prüfen
docker exec -it revierkompass-nominatim psql -U nominatim -d nominatim -c "SELECT version();"

# Cache-Größe erhöhen
# In docker-compose.offline.yml: NOMINATIM_IMPORT_OSM2PGSQL_CACHE=48000
```

### TileServer zeigt keine Karten

```bash
# MBTiles-Datei prüfen
ls -la data/mbtiles/

# TileServer-Logs
docker-compose -f docker-compose.offline.yml logs tileserver

# MBTiles-Datei herunterladen (falls nicht vorhanden)
wget -O data/mbtiles/germany.mbtiles https://example.com/germany.mbtiles
```

## 📈 Performance-Optimierung

### System-Ressourcen

- **RAM:** Mindestens 8GB, 16GB empfohlen
- **CPU:** 4+ Kerne für bessere Performance
- **SSD:** Für schnellere Datenbank-Zugriffe

### Docker-Optimierung

```bash
# Docker-Daemon optimieren
sudo nano /etc/docker/daemon.json

{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Cache-Optimierung

```typescript
// Cache-Größe erhöhen
const routingService = new RoutingService();
routingService.MAX_CACHE_SIZE = 500; // Standard: 200
```

## 🔒 Sicherheit

### Firewall-Konfiguration

```bash
# Nur lokale Zugriffe erlauben
sudo ufw allow from 127.0.0.1 to any port 5000
sudo ufw allow from 127.0.0.1 to any port 7070
sudo ufw allow from 127.0.0.1 to any port 8080
```

### SSL/TLS (optional)

```bash
# SSL-Zertifikate generieren
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout data/nginx/ssl/nginx.key \
  -out data/nginx/ssl/nginx.crt

# Nginx mit SSL konfigurieren
# Siehe data/nginx/nginx.conf
```

## 📞 Support

Bei Problemen:

1. **Logs prüfen:** `docker-compose -f docker-compose.offline.yml logs`
2. **Services-Status:** `docker-compose -f docker-compose.offline.yml ps`
3. **Daten-Verzeichnis:** `ls -la data/`
4. **System-Ressourcen:** `htop`, `df -h`

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- Initiale Version
- OSRM, Nominatim, TileServer GL
- Docker Compose Setup
- Automatische Erkennung
- Performance-Monitoring

---

**Hinweis:** Diese Offline-Services sind für den lokalen Einsatz gedacht. Für Produktionsumgebungen sollten zusätzliche Sicherheitsmaßnahmen implementiert werden. 