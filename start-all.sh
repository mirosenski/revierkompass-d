#!/bin/bash

# RevierKompass - Vollständiger Start aller Backend-Services
# Dieses Script startet alle Docker-Container und überwacht sie

set -e

echo "🚀 Starte RevierKompass - Backend Services..."
echo "============================================="

# Prüfe ob Docker läuft
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker ist nicht gestartet. Bitte starte Docker zuerst."
    exit 1
fi

# Erstelle notwendige Verzeichnisse
echo "📁 Erstelle Verzeichnisse..."
mkdir -p data/{osrm,osm,mbtiles,redis,tileserver-config}

# Stoppe und entferne alte Container (falls vorhanden)
echo "🧹 Bereinige alte Container..."
docker compose down --remove-orphans 2>/dev/null || true

# Starte alle Services
echo "🚀 Starte alle Backend-Services..."
docker compose up -d

# Warte auf Services
echo "⏳ Warte auf Services..."
sleep 10

# Zeige Status aller Services
echo "📊 Status aller Services:"
echo "========================"

# Backend
if docker ps | grep -q revierkompass-backend; then
    echo "✅ Backend: http://localhost:5179"
else
    echo "❌ Backend: Nicht gestartet"
fi

# OSRM
if docker ps | grep -q revierkompass-osrm; then
    echo "✅ OSRM: http://localhost:5000"
else
    echo "❌ OSRM: Nicht gestartet"
fi

# Nominatim
if docker ps | grep -q revierkompass-nominatim; then
    echo "✅ Nominatim: http://localhost:7070"
else
    echo "❌ Nominatim: Nicht gestartet"
fi

# TileServer
if docker ps | grep -q revierkompass-tileserver; then
    echo "✅ TileServer: http://localhost:8080"
else
    echo "❌ TileServer: Nicht gestartet"
fi

# Database
if docker ps | grep -q revierkompass-db; then
    echo "✅ Database: localhost:5432"
else
    echo "❌ Database: Nicht gestartet"
fi

# Redis
if docker ps | grep -q revierkompass-redis; then
    echo "✅ Redis: localhost:6379"
else
    echo "❌ Redis: Nicht gestartet"
fi

echo ""
echo "🎉 RevierKompass Backend-Services sind gestartet!"
echo "================================================"
echo "🔧 Backend API: http://localhost:5179"
echo "🗺️  OSRM Routing: http://localhost:5000"
echo "📍 Nominatim Geocoding: http://localhost:7070"
echo "🗺️  TileServer: http://localhost:8080"
echo ""
echo "🌐 Frontend starten:"
echo "  pnpm dev  # Entwicklungs-Server"
echo "  pnpm build && pnpm preview  # Production-Build"
echo ""
echo "📋 Nützliche Befehle:"
echo "  docker compose logs -f [service]  # Logs anzeigen"
echo "  docker compose down               # Alles stoppen"
echo "  docker compose restart [service]  # Service neu starten"
echo ""
echo "🔍 Logs überwachen:"
echo "  docker compose logs -f backend"
echo "  docker compose logs -f osrm"
echo "  docker compose logs -f nominatim"
echo ""
echo "💡 Tipp: Verwende 'docker compose logs -f' um alle Logs zu sehen" 