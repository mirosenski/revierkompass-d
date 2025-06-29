#!/bin/bash

echo "🚀 Starte RevierKompass Development Environment..."

# Backend-Server im Hintergrund starten
echo "📡 Starte Backend-Server..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Kurz warten, damit der Backend-Server starten kann
sleep 2

# Prüfen ob Backend läuft
if curl -s http://localhost:3001/ > /dev/null; then
    echo "✅ Backend-Server läuft auf http://localhost:3001"
else
    echo "❌ Backend-Server konnte nicht gestartet werden"
    exit 1
fi

# Frontend starten
echo "🌐 Starte Frontend..."
npm run dev

# Cleanup beim Beenden
trap "echo '🛑 Beende Server...'; kill $BACKEND_PID; exit" INT TERM
wait 