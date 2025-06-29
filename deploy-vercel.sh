#!/bin/bash

echo "🚀 Vercel Serverless Functions Migration"
echo "========================================"

# Prüfen ob Vercel CLI installiert ist
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI nicht gefunden. Installiere..."
    npm install -g vercel
fi

# Dependencies installieren
echo "📦 Installiere Dependencies..."
npm install

# Prisma Client generieren
echo "🗄️ Generiere Prisma Client..."
npx prisma generate

# Datenbank migrieren (falls vorhanden)
if [ -f "backend/prisma/dev.db" ]; then
    echo "📋 Kopiere bestehende Datenbank..."
    cp backend/prisma/dev.db ./dev.db
fi

# Vercel verlinken (falls noch nicht geschehen)
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Verlinke mit Vercel..."
    vercel link
fi

# Lokal testen
echo "🧪 Teste lokal..."
vercel dev &

# Warte kurz und teste API
sleep 5
echo "🔍 Teste Health Check..."
curl -s http://localhost:3000/api/health | jq .

echo "✅ Setup abgeschlossen!"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Kopiere .env.example zu .env.local und passe an"
echo "2. Teste die API mit: curl http://localhost:3000/api/stationen"
echo "3. Deploye mit: npm run vercel-deploy"
echo ""
echo "🌐 Lokale Entwicklung läuft auf: http://localhost:3000" 