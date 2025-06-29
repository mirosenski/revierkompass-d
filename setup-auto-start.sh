#!/bin/bash

# RevierKompass - Automatischer Start Setup
# Dieses Script konfiguriert das System für automatischen Start

set -e

echo "🔧 Konfiguriere RevierKompass für automatischen Start..."
echo "========================================================"

# Prüfe ob wir root sind
if [ "$EUID" -ne 0 ]; then
    echo "❌ Dieses Script muss als root ausgeführt werden."
    echo "   Verwende: sudo ./setup-auto-start.sh"
    exit 1
fi

# Aktueller Pfad
PROJECT_DIR=$(pwd)
SERVICE_FILE="revierkompass.service"

echo "📁 Projekt-Verzeichnis: $PROJECT_DIR"

# Mache Scripts ausführbar
echo "🔧 Mache Scripts ausführbar..."
chmod +x start-all.sh
chmod +x setup-offline-services.sh

# Kopiere Service-Datei
echo "📋 Installiere Systemd Service..."
cp $SERVICE_FILE /etc/systemd/system/

# Aktualisiere Pfad in Service-Datei
sed -i "s|/home/miro/projects/PTLS/react/revierkompass-d|$PROJECT_DIR|g" /etc/systemd/system/$SERVICE_FILE

# Lade Systemd neu
systemctl daemon-reload

# Aktiviere Service
echo "✅ Aktiviere automatischen Start..."
systemctl enable revierkompass.service

echo ""
echo "🎉 Setup abgeschlossen!"
echo "======================"
echo "✅ RevierKompass startet jetzt automatisch beim Systemstart"
echo ""
echo "📋 Nützliche Befehle:"
echo "  sudo systemctl start revierkompass    # Jetzt starten"
echo "  sudo systemctl stop revierkompass     # Stoppen"
echo "  sudo systemctl status revierkompass   # Status anzeigen"
echo "  sudo systemctl disable revierkompass  # Automatischen Start deaktivieren"
echo ""
echo "📊 Logs anzeigen:"
echo "  sudo journalctl -u revierkompass -f"
echo ""
echo "🚀 Starte jetzt das System:"
echo "  sudo systemctl start revierkompass" 