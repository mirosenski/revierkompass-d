#!/bin/bash

echo "🚀 Starte RevierKompass Entwicklungsumgebung..."

# Funktion zum Prüfen, ob ein Port verfügbar ist
check_port() {
    local port=$1
    local service=$2
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "✅ $service läuft bereits auf Port $port"
        return 0
    else
        echo "❌ $service nicht auf Port $port gefunden"
        return 1
    fi
}

# Backend auf Port 5179 starten
echo "🔧 Starte Backend-Server auf Port 5179..."
cd backend
PORT=5179 npm run dev &
BACKEND_PID=$!

# Warten bis Backend bereit ist
echo "⏳ Warte auf Backend..."
sleep 5

# Backend-Status prüfen
if curl -s http://localhost:5179/health > /dev/null 2>&1; then
    echo "✅ Backend ist bereit"
else
    echo "❌ Backend nicht erreichbar"
fi

# Nominatim-Service prüfen und starten
echo "🔍 Prüfe Nominatim-Service..."
if check_port 7070 "Nominatim"; then
    echo "✅ Nominatim läuft bereits"
else
    echo "⚠️ Nominatim nicht verfügbar - verwende Online-Fallback"
    echo "💡 Für Offline-Nominatim: docker-compose -f docker-compose.offline.yml up -d nominatim"
fi

# Frontend starten
echo "🎨 Starte Frontend..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Entwicklungsumgebung gestartet!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5179"
echo "🔍 Nominatim: http://localhost:7070 (falls verfügbar)"
echo "🗺️ Online-Nominatim wird als Fallback verwendet"
echo ""
echo "📋 Nützliche Befehle:"
echo "  curl http://localhost:5179/health"
echo "  curl http://localhost:5179/api/stationen"
echo "  curl 'http://localhost:5179/api/maps/geocoding?q=Stuttgart'"
echo ""

# Cleanup bei Beendigung
trap "echo '🛑 Beende Server...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait 