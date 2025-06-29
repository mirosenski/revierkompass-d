#!/bin/bash

echo "🚀 Starte Revierkompass Backend..."

# Zum Backend-Verzeichnis wechseln
cd "$(dirname "$0")/backend"

# Dependencies installieren (falls nötig)
if [ ! -d "node_modules" ]; then
    echo "📦 Installiere Dependencies..."
    npm install
fi

# PM2 starten
echo "🔄 Starte Backend mit PM2..."
pm2 start ecosystem.config.js

# Status anzeigen
echo "📊 Backend-Status:"
pm2 status

echo "✅ Backend gestartet! API verfügbar unter http://localhost:3001"
echo "📝 Logs anzeigen mit: pm2 logs revierkompass-backend"
echo "🛑 Stoppen mit: pm2 stop revierkompass-backend" 