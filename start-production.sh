#!/bin/bash

echo "🚀 RevierKompass Production Start"
echo "=================================="

# Alte Prozesse beenden
echo "🧹 Beende alte Prozesse..."
pkill -f "simple-server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Warten bis Ports frei sind
sleep 2

# Backend starten
echo "🔧 Starte Backend auf Port 5179..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Warten bis Backend bereit ist
echo "⏳ Warte auf Backend..."
sleep 5

# Backend-Status prüfen
if curl -s http://localhost:5179/health > /dev/null; then
    echo "✅ Backend läuft auf Port 5179"
else
    echo "❌ Backend konnte nicht gestartet werden"
    exit 1
fi

# Frontend starten
echo "🌐 Starte Frontend auf Port 5173..."
npm run dev &
FRONTEND_PID=$!

# Warten bis Frontend bereit ist
echo "⏳ Warte auf Frontend..."
sleep 10

# Frontend-Status prüfen
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend läuft auf Port 5173"
else
    echo "❌ Frontend konnte nicht gestartet werden"
    exit 1
fi

echo ""
echo "🎉 RevierKompass ist bereit!"
echo "=============================="
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:5179"
echo "📊 Health:   http://localhost:5179/health"
echo "🏢 API:      http://localhost:5179/api/stationen"
echo ""
echo "Drücken Sie Ctrl+C zum Beenden"

# Prozesse im Vordergrund halten
wait $BACKEND_PID $FRONTEND_PID 