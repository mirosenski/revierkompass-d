# RevierKompass - Automatischer Start aller Services

Dieses Setup ermöglicht es, dass alle RevierKompass-Services (Frontend, Backend, OSRM, TileServer, etc.) automatisch starten und immer laufen.

## 🚀 Schnellstart

### 1. Einmaliges Setup (als root)
```bash
sudo ./setup-auto-start.sh
```

### 2. System starten
```bash
sudo systemctl start revierkompass
```

### 3. Status prüfen
```bash
./monitor.sh
```

## 📋 Verfügbare Services

| Service | Port | URL | Beschreibung |
|---------|------|-----|--------------|
| Frontend | 3000 | http://localhost:3000 | React/Vite Anwendung |
| Backend | 5179 | http://localhost:5179 | Node.js API Server |
| OSRM | 5000 | http://localhost:5000 | Routing Server |
| Nominatim | 7070 | http://localhost:7070 | Geocoding Server |
| TileServer | 8080 | http://localhost:8080 | Offline-Karten |
| Database | 5432 | localhost:5432 | PostgreSQL |
| Redis | 6379 | localhost:6379 | Caching |

## 🔧 Systemd Service

### Service verwalten
```bash
# Service starten
sudo systemctl start revierkompass

# Service stoppen
sudo systemctl stop revierkompass

# Status anzeigen
sudo systemctl status revierkompass

# Automatischen Start aktivieren
sudo systemctl enable revierkompass

# Automatischen Start deaktivieren
sudo systemctl disable revierkompass
```

### Logs anzeigen
```bash
# Service Logs
sudo journalctl -u revierkompass -f

# Docker Logs
docker-compose logs -f [service]
```

## 🐳 Docker Compose

### Manueller Start
```bash
# Alle Services starten
./start-all.sh

# Oder direkt mit docker-compose
docker-compose up -d
```

### Services verwalten
```bash
# Status anzeigen
docker-compose ps

# Logs anzeigen
docker-compose logs -f [service]

# Service neu starten
docker-compose restart [service]

# Alles stoppen
docker-compose down
```

## 📊 Monitoring

### Live-Monitoring
```bash
./monitor.sh
```

### Einzelne Services prüfen
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:5179/health

# OSRM
curl "http://localhost:5000/route/v1/driving/9.18,48.78;9.19,48.79"

# Nominatim
curl http://localhost:7070/status

# TileServer
curl http://localhost:8080/health
```

## 🔄 Automatischer Neustart

Alle Services sind mit `restart: unless-stopped` konfiguriert, d.h. sie starten automatisch neu bei:
- System-Neustart
- Docker-Neustart
- Container-Crash

## 📁 Verzeichnisstruktur

```
revierkompass-d/
├── docker-compose.yml          # Haupt-Konfiguration
├── docker-compose.offline.yml  # Offline-Services
├── Dockerfile.frontend         # Frontend Container
├── Dockerfile.backend          # Backend Container
├── start-all.sh               # Start-Script
├── setup-auto-start.sh        # Setup-Script
├── monitor.sh                 # Monitoring-Script
├── revierkompass.service      # Systemd Service
└── data/                      # Persistente Daten
    ├── osrm/                  # OSRM-Daten
    ├── osm/                   # OpenStreetMap-Daten
    ├── mbtiles/               # Karten-Tiles
    ├── redis/                 # Redis-Daten
    └── nginx/                 # Nginx-Konfiguration
```

## 🛠️ Troubleshooting

### Service startet nicht
```bash
# Logs prüfen
sudo journalctl -u revierkompass -f

# Docker Status prüfen
docker info

# Container Logs prüfen
docker-compose logs [service]
```

### Port-Konflikte
Falls Ports bereits belegt sind, ändere die Ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Statt 3000:80
```

### Ressourcen-Probleme
Reduziere Memory-Limits in `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Statt 4G
```

### Daten-Persistenz
Alle Daten werden in Docker-Volumes gespeichert:
```bash
# Volumes anzeigen
docker volume ls

# Volume löschen (Vorsicht!)
docker volume rm [volume-name]
```

## 🔒 Sicherheit

- Alle Services laufen in isolierten Containern
- Keine root-Rechte für Anwendungen
- Netzwerk-Isolation über Docker-Networks
- Health-Checks für alle Services

## 📈 Performance

### Optimierungen
- Redis-Caching für API-Responses
- Gzip-Kompression für Frontend
- Statische Asset-Caching
- OSRM mit MLD-Algorithmus

### Ressourcen-Monitoring
```bash
# Docker Stats
docker stats

# System Ressourcen
htop
```

## 🚀 Deployment

Für Production-Deployment siehe:
- `README-OFFLINE-SERVICES.md` - Offline-Setup
- `PHASE2-ONLINE-ERWEITERUNGEN.md` - Online-Erweiterungen
- Coolify-Deployment Anleitung

## 📞 Support

Bei Problemen:
1. Logs prüfen: `./monitor.sh`
2. Service-Status: `sudo systemctl status revierkompass`
3. Docker-Logs: `docker-compose logs -f`
4. System-Ressourcen: `htop` 