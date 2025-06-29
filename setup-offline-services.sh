#!/bin/bash

# Revierkompass Offline-Services Setup Script
# Dieses Script richtet die Offline-Services für Routing, Geocoding und Karten ein

set -e

echo "🗺️ Revierkompass Offline-Services Setup"
echo "========================================"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Prüfen ob Docker installiert ist
check_docker() {
    log_info "Prüfe Docker-Installation..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker ist nicht installiert. Bitte installieren Sie Docker zuerst."
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose ist nicht installiert. Bitte installieren Sie Docker Compose zuerst."
        exit 1
    fi
    
    log_success "Docker und Docker Compose sind verfügbar"
}

# Verzeichnisse erstellen
create_directories() {
    log_info "Erstelle Verzeichnisstruktur..."
    
    mkdir -p data/{osrm,nominatim,mbtiles,redis,nginx/{ssl,config},tileserver-config}
    
    log_success "Verzeichnisstruktur erstellt"
}

# Nginx-Konfiguration erstellen
setup_nginx() {
    log_info "Erstelle Nginx-Konfiguration..."
    
    cat > data/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream osrm_backend {
        server osrm:5000;
    }
    
    upstream nominatim_backend {
        server nominatim:8080;
    }
    
    upstream tileserver_backend {
        server tileserver:80;
    }
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=tiles:10m rate=100r/s;
    
    server {
        listen 80;
        server_name localhost;
        
        # OSRM Routing API
        location /route/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://osrm_backend/route/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS Headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        }
        
        # OSRM Status
        location /status {
            proxy_pass http://osrm_backend/status;
            proxy_set_header Host $host;
        }
        
        # Nominatim Geocoding API
        location /geocoding/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nominatim_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS Headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        }
        
        # TileServer GL
        location /tiles/ {
            limit_req zone=tiles burst=50 nodelay;
            proxy_pass http://tileserver_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache Tiles
            expires 1d;
            add_header Cache-Control "public, immutable";
        }
        
        # Health Check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
    
    log_success "Nginx-Konfiguration erstellt"
}

# TileServer-Konfiguration erstellen
setup_tileserver() {
    log_info "Erstelle TileServer-Konfiguration..."
    
    cat > data/tileserver-config/config.json << 'EOF'
{
  "options": {
    "paths": {
      "root": "/usr/src/app",
      "fonts": "fonts",
      "styles": "styles",
      "mbtiles": "/data"
    },
    "serveAllFonts": true,
    "formatQuality": {
      "jpeg": 80,
      "webp": 90
    },
    "maxSize": 2048,
    "pbfAlias": "pbf"
  },
  "styles": {
    "streets": {
      "style": "styles/streets/style.json",
      "tilejson": {
        "bounds": [5.5, 47.0, 15.5, 55.5]
      }
    },
    "satellite": {
      "style": "styles/satellite/style.json",
      "tilejson": {
        "bounds": [5.5, 47.0, 15.5, 55.5]
      }
    },
    "terrain": {
      "style": "styles/terrain/style.json",
      "tilejson": {
        "bounds": [5.5, 47.0, 15.5, 55.5]
      }
    }
  },
  "data": {
    "germany": {
      "mbtiles": "germany.mbtiles"
    }
  }
}
EOF
    
    log_success "TileServer-Konfiguration erstellt"
}

# Services starten
start_services() {
    log_info "Starte Offline-Services..."
    
    # Services stoppen falls laufend
    log_info "Stoppe bestehende Services..."
    docker compose -f docker-compose.offline.yml down 2>/dev/null || true
    
    # Services starten
    log_info "Starte Offline-Services..."
    docker compose -f docker-compose.offline.yml up -d
    
    log_success "Services gestartet"
}

# Services-Status prüfen
check_services() {
    log_info "Prüfe Services-Status..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -n "Versuch $attempt/$max_attempts: "
        
        # OSRM Status prüfen
        if curl -s http://localhost:5000/status > /dev/null 2>&1; then
            echo -e "${GREEN}OSRM ✅${NC}"
        else
            echo -e "${YELLOW}OSRM ⏳${NC}"
        fi
        
        # Nominatim Status prüfen
        if curl -s http://localhost:7070/status > /dev/null 2>&1; then
            echo -e "${GREEN}Nominatim ✅${NC}"
        else
            echo -e "${YELLOW}Nominatim ⏳${NC}"
        fi
        
        # TileServer Status prüfen
        if curl -s http://localhost:8080/ > /dev/null 2>&1; then
            echo -e "${GREEN}TileServer ✅${NC}"
        else
            echo -e "${YELLOW}TileServer ⏳${NC}"
        fi
        
        # Alle Services bereit?
        if curl -s http://localhost:5000/status > /dev/null 2>&1 && \
           curl -s http://localhost:7070/status > /dev/null 2>&1 && \
           curl -s http://localhost:8080/ > /dev/null 2>&1; then
            log_success "Alle Services sind bereit!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_warning "Nicht alle Services sind bereit. Prüfen Sie die Logs mit:"
            echo "📋 Nützliche Befehle:"
            echo "  docker compose -f docker-compose.offline.yml logs"
            echo "  docker compose -f docker-compose.offline.yml logs -f"
            echo "  docker compose -f docker-compose.offline.yml down"
            echo "  docker compose -f docker-compose.offline.yml up -d"
            break
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
}

# Test-Routen berechnen
test_routing() {
    log_info "Teste Routing-Funktionalität..."
    
    # Test-Route: Stuttgart → München
    local test_url="http://localhost:5000/route/v1/driving/9.18,48.78;11.58,48.14"
    
    if curl -s "$test_url" | jq -e '.routes[0]' > /dev/null 2>&1; then
        log_success "Routing-Test erfolgreich"
        
        # Route-Details anzeigen
        local route_info=$(curl -s "$test_url" | jq -r '.routes[0] | "Entfernung: \(.distance/1000 | round)km, Dauer: \(.duration/60 | round)min"')
        echo "  $route_info"
    else
        log_warning "Routing-Test fehlgeschlagen"
    fi
}

# Test-Geocoding
test_geocoding() {
    log_info "Teste Geocoding-Funktionalität..."
    
    # Test-Adresse: Stuttgart
    local test_url="http://localhost:7070/search?q=Stuttgart&format=json&limit=1"
    
    if curl -s "$test_url" | jq -e '.[0]' > /dev/null 2>&1; then
        log_success "Geocoding-Test erfolgreich"
        
        # Geocoding-Details anzeigen
        local geocoding_info=$(curl -s "$test_url" | jq -r '.[0] | "\(.display_name) - Lat: \(.lat), Lon: \(.lon)"')
        echo "  $geocoding_info"
    else
        log_warning "Geocoding-Test fehlgeschlagen"
    fi
}

# Hauptfunktion
main() {
    echo "Dieses Script richtet die Offline-Services für Revierkompass ein."
    echo "Es werden folgende Services installiert:"
    echo "  - OSRM (Routing)"
    echo "  - Nominatim (Geocoding)"
    echo "  - TileServer GL (Karten)"
    echo "  - Redis (Caching)"
    echo "  - Nginx (Reverse Proxy)"
    echo ""
    
    read -p "Möchten Sie fortfahren? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup abgebrochen."
        exit 0
    fi
    
    check_docker
    create_directories
    setup_nginx
    setup_tileserver
    start_services
    check_services
    test_routing
    test_geocoding
    
    echo ""
    log_success "Offline-Services Setup abgeschlossen!"
    echo ""
    echo "Services sind verfügbar unter:"
    echo "  - Routing API: http://localhost:5000"
    echo "  - Geocoding API: http://localhost:7070"
    echo "  - TileServer: http://localhost:8080"
    echo "  - Nginx Proxy: http://localhost:80"
    echo ""
    echo "📋 Nützliche Befehle:"
    echo "  docker compose -f docker-compose.offline.yml logs"
    echo "  docker compose -f docker-compose.offline.yml logs -f"
    echo "  docker compose -f docker-compose.offline.yml down"
    echo "  docker compose -f docker-compose.offline.yml up -d"
}

# Script ausführen
main "$@" 