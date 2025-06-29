#!/bin/bash

# RevierKompass - Service Monitoring
# Überwacht den Status aller Backend-Services

echo "🔍 RevierKompass Service Monitor"
echo "================================"
echo "Zeit: $(date)"
echo ""

# Docker Status
echo "🐳 Docker Status:"
if docker info > /dev/null 2>&1; then
    echo "✅ Docker läuft"
else
    echo "❌ Docker läuft nicht"
    exit 1
fi

echo ""

# Container Status
echo "📦 Container Status:"
echo "==================="

# Funktion zum Prüfen eines Containers
check_container() {
    local name=$1
    local port=$2
    local url=$3
    
    if docker ps | grep -q $name; then
        echo "✅ $name läuft"
        if [ ! -z "$port" ]; then
            if curl -s http://localhost:$port/health > /dev/null 2>&1 || curl -s http://localhost:$port > /dev/null 2>&1; then
                echo "   🌐 Erreichbar: $url"
            else
                echo "   ⚠️  Port $port nicht erreichbar"
            fi
        fi
    else
        echo "❌ $name läuft nicht"
    fi
}

check_container "revierkompass-backend" "5179" "http://localhost:5179"
check_container "revierkompass-osrm" "5000" "http://localhost:5000"
check_container "revierkompass-nominatim" "7070" "http://localhost:7070"
check_container "revierkompass-tileserver" "8080" "http://localhost:8080"
check_container "revierkompass-db" "5432" "localhost:5432"
check_container "revierkompass-redis" "6379" "localhost:6379"

echo ""

# System Ressourcen
echo "💻 System Ressourcen:"
echo "===================="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "RAM: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
echo "Disk: $(df -h / | awk 'NR==2{print $5}')"

echo ""

# Docker Ressourcen
echo "🐳 Docker Ressourcen:"
echo "===================="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""

# Letzte Logs
echo "📋 Letzte Logs (letzte 5 Zeilen):"
echo "================================"
echo "Backend:"
docker logs --tail 5 revierkompass-backend 2>/dev/null || echo "Keine Logs verfügbar"
echo ""
echo "OSRM:"
docker logs --tail 5 revierkompass-osrm 2>/dev/null || echo "Keine Logs verfügbar"
echo ""
echo "Nominatim:"
docker logs --tail 5 revierkompass-nominatim 2>/dev/null || echo "Keine Logs verfügbar"

echo ""
echo "🔄 Aktualisiere alle 30 Sekunden... (Ctrl+C zum Beenden)" 