#!/usr/bin/env python3
"""
Git Remote Branches zu lokalen Branches Script (Python Version)
Dieses Skript holt alle Remote-Branches und erstellt entsprechende lokale Branches
"""

import subprocess
import sys
import os

def run_command(command, description=""):
    """Führt einen Shell-Befehl aus und gibt das Ergebnis zurück"""
    try:
        print(f"🔄 {description}")
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"❌ Fehler bei: {description}")
        print(f"   Befehl: {command}")
        print(f"   Error: {e.stderr}")
        return None

def check_git_repo():
    """Prüft, ob wir uns in einem Git-Repository befinden"""
    if not os.path.exists('.git'):
        print("❌ Kein Git-Repository gefunden!")
        print("   Stellen Sie sicher, dass Sie sich im Projekt-Verzeichnis befinden.")
        return False
    return True

def fetch_all_branches():
    """Holt alle Remote-Branches und erstellt lokale Branches"""
    
    if not check_git_repo():
        return False
    
    print("🚀 Starte das Holen aller Remote-Branches...\n")
    
    # Alle Remote-Referenzen holen
    if run_command("git fetch --all", "Hole alle Remote-Referenzen...") is None:
        return False
    
    # Remote-Branches auflisten
    print("\n📋 Verfügbare Remote-Branches:")
    remote_branches = run_command("git branch -r", "")
    if remote_branches is None:
        return False
    
    # Filtere Remote-Branches (ohne HEAD)
    branches = []
    for line in remote_branches.split('\n'):
        line = line.strip()
        if line and 'HEAD' not in line and 'origin/' in line:
            branch_name = line.replace('origin/', '').strip()
            branches.append(branch_name)
            print(f"  📌 {branch_name}")
    
    if not branches:
        print("⚠️  Keine Remote-Branches gefunden!")
        return False
    
    print(f"\n🔧 Erstelle lokale Branches für {len(branches)} Remote-Branches...\n")
    
    # Aktuelle lokale Branches ermitteln
    local_branches_output = run_command("git branch", "")
    local_branches = []
    if local_branches_output:
        for line in local_branches_output.split('\n'):
            line = line.strip().replace('* ', '')
            if line:
                local_branches.append(line)
    
    # Erstelle lokale Branches
    created_count = 0
    skipped_count = 0
    
    for branch in branches:
        if branch in local_branches:
            print(f"  ⚠️  Branch '{branch}' existiert bereits lokal")
            skipped_count += 1
        else:
            if run_command(f"git checkout -b {branch} origin/{branch}", f"Erstelle Branch '{branch}'..."):
                print(f"  ✅ Branch '{branch}' erfolgreich erstellt")
                created_count += 1
            else:
                print(f"  ❌ Fehler beim Erstellen von Branch '{branch}'")
    
    # Zurück zum main/master Branch
    print(f"\n🔄 Wechsle zurück zum main Branch...")
    main_branch = "main" if "main" in branches else "master"
    run_command(f"git checkout {main_branch}", "")
    
    # Übersicht aller lokalen Branches
    print(f"\n📊 Übersicht aller lokalen Branches:")
    all_branches = run_command("git branch", "")
    if all_branches:
        for line in all_branches.split('\n'):
            if line.strip():
                print(f"  {line}")
    
    print(f"\n✅ Fertig!")
    print(f"   📈 {created_count} neue Branches erstellt")
    print(f"   📋 {skipped_count} Branches bereits vorhanden")
    print(f"   📊 Insgesamt {len(local_branches)} lokale Branches")
    
    return True

if __name__ == "__main__":
    if fetch_all_branches():
        sys.exit(0)
    else:
        sys.exit(1) 