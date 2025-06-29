# 🛠️ Fehlerbehebung: OSRM-Verbindungsfehler (ERR_CONNECTION_REFUSED)

Der Fehler `ERR_CONNECTION_REFUSED` tritt auf, weil der Browser keine Verbindung zum OSRM-Routing-Server herstellen kann. Hier ist die Schritt-für-Schritt-Lösung:

## 1. Prüfe, ob der OSRM-Container läuft

```bash
docker compose -f docker-compose.offline.yml ps
```

Suche nach `revierkompass-osrm` in der Ausgabe.

**Mögliche Probleme:**
- Container ist nicht gelistet → Docker Compose hat den Container nicht gestartet
- Status ist `Exited` → Container ist abgestürzt

## 2. Starte den OSRM-Container neu

```bash
# Stoppe alle Container
docker compose -f docker-compose.offline.yml down

# Starte neu
docker compose -f docker-compose.offline.yml up -d
```

## 3. Prüfe die OSRM-Container-Logs

```bash
docker logs revierkompass-osrm
```

**Typische Fehler im Log:**
- `Required files are missing` → OSM-Daten fehlen
- `ERROR: .../germany-latest.osrm not found` → Falscher Pfad zu den OSM-Daten

## 4. Stelle sicher, dass die OSM-Daten vorhanden sind

```bash
ls -la data/osrm
```

**Erwartete Dateien:**
- `germany-latest.osm.pbf` (原始数据)
- `germany-latest.osrm` (verarbeitete Daten)

**Falls fehlend:**
Lade die Daten manuell herunter und verarbeite sie:

```bash
# Navigiere ins Datenverzeichnis
cd data/osrm

# Lade Deutschland-Daten (ca. 2.5GB)
wget https://download.geofabrik.de/europe/germany-latest.osm.pbf

# Verarbeite mit OSRM
docker run -it --rm -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/germany-latest.osm.pbf
docker run -it --rm -v $(pwd):/data osrm/osrm-backend osrm-partition /data/germany-latest.osrm
docker run -it --rm -v $(pwd):/data osrm/osrm-backend osrm-customize /data/germany-latest.osrm
```

## 5. Teste den OSRM-Service direkt

```bash
curl http://localhost:5000/route/v1/driving/9.18,48.78;9.19,48.79
```

**Erwartete Ausgabe:**
JSON mit `routes[0].distance` und `routes[0].duration`.

**Falls Fehler:**

- **Port 5000 blockiert?** → Prüfe Firewall-Regeln
- **OSRM läuft nicht?** → Starte manuell:

```bash
docker run -it --rm -p 5000:5000 -v $(pwd)/data/osrm:/data osrm/osrm-backend osrm-routed --algorithm mld /data/germany-latest.osrm
```

## 6. Stelle sicher, dass der API-Server läuft

Der API-Server (`api-server.cjs`) leitet Anfragen an OSRM weiter.

**Starte ihn neu:**

```bash
cd server
node api-server.cjs
```

**Teste den API-Proxy:**

```bash
curl http://localhost:5179/api/maps/route/v1/driving/9.18,48.78;9.19,48.79
```

## 7. Überprüfe die Vite-Proxy-Konfiguration

Stelle sicher, dass `vite.config.ts` den API-Server proxyed:

```typescript
// vite.config.ts
export default defineConfig({
  // ...
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5179', // Port des API-Servers
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

## 8. Starte die React-App neu

```bash
npm start  # oder npm run dev
```

## Zusammenfassung der Fehlerquellen

| Problem | Lösung |
|---------|--------|
| OSRM-Container läuft nicht | Docker Compose starten, Logs prüfen |
| OSM-Daten fehlen | Manuell herunterladen und verarbeiten |
| Port 5000 blockiert | Firewall öffnen, Docker-Ports prüfen |
| API-Server läuft nicht | `node api-server.cjs` starten |
| Falsche Proxy-Konfiguration | `vite.config.ts` anpassen |

## Troubleshooting-Checkliste

- [ ] Docker Compose Container laufen
- [ ] OSRM-Logs zeigen keine Fehler
- [ ] OSM-Daten sind vorhanden und verarbeitet
- [ ] Port 5000 ist erreichbar
- [ ] API-Server läuft auf Port 5179
- [ ] Vite-Proxy ist korrekt konfiguriert
- [ ] React-App wurde neu gestartet 