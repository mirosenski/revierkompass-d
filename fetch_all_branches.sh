#!/bin/bash

# Git Remote Branches zu lokalen Branches Script
# Dieses Skript holt alle Remote-Branches und erstellt entsprechende lokale Branches

echo "🔄 Starte das Holen aller Remote-Branches..."

# Stelle sicher, dass wir alle Remote-Branches haben
echo "📡 Hole alle Remote-Referenzen..."
git fetch --all

echo ""
echo "📋 Verfügbare Remote-Branches:"
git branch -r | grep -v HEAD | sed 's/origin\///'

echo ""
echo "🔧 Erstelle lokale Branches für alle Remote-Branches..."

# Erstelle lokale Branches für alle Remote-Branches (außer HEAD)
for branch in $(git branch -r | grep -v HEAD | sed 's/origin\///'); do
    echo "  📌 Erstelle lokalen Branch: $branch"
    
    # Prüfe, ob der lokale Branch bereits existiert
    if git show-ref --verify --quiet refs/heads/$branch; then
        echo "    ⚠️  Branch '$branch' existiert bereits lokal"
    else
        # Erstelle und checke den Branch aus
        git checkout -b $branch origin/$branch
        echo "    ✅ Branch '$branch' erfolgreich erstellt"
    fi
done

echo ""
echo "🔄 Wechsle zurück zum main Branch..."
git checkout main

echo ""
echo "📊 Übersicht aller lokalen Branches:"
git branch

echo ""
echo "✅ Fertig! Alle Remote-Branches wurden als lokale Branches erstellt." 