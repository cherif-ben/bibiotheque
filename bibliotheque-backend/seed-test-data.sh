#!/bin/bash
# ============================================
# SEED DATA — VIA SQL (data.sql est chargé automatiquement)
# Ce script vérifie que les données sont en place
# Le backend doit être lancé (docker-compose up -d)
# ============================================

set -e
API="http://localhost:8080"
TIMEOUT="--max-time 15"

echo "⏳ En attente du backend..."
for i in $(seq 1 30); do
  if curl -s $TIMEOUT -o /dev/null -w "" "$API/authenticate" 2>/dev/null; then
    echo "✅ Backend prêt"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Backend non disponible après 30s"
    exit 1
  fi
  sleep 1
done

# --- Vérifier que les données de test sont en place ---
echo ""
echo "🔍 Vérification des données de test..."

# Tester login adherent1
RESP=$(curl -s $TIMEOUT -X POST "$API/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"adherent1","password":"admin123"}')

TOKEN_A1=$(echo "$RESP" | grep -o '"jwtToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN_A1" ]; then
  echo "❌ Login adherent1/admin123 échoué — les données de test ne sont pas en place"
  echo "   Vérifiez que data.sql a été exécuté correctement."
  exit 1
fi
echo "✅ Login adherent1 OK"

# Tester login adherent2
RESP=$(curl -s $TIMEOUT -X POST "$API/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"adherent2","password":"admin123"}')
TOKEN_A2=$(echo "$RESP" | grep -o '"jwtToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN_A2" ]; then
  echo "❌ Login adherent2/admin123 échoué"
  exit 1
fi
echo "✅ Login adherent2 OK"

# Tester login adherent3
RESP=$(curl -s $TIMEOUT -X POST "$API/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"adherent3","password":"admin123"}')
TOKEN_A3=$(echo "$RESP" | grep -o '"jwtToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN_A3" ]; then
  echo "❌ Login adherent3/admin123 échoué"
  exit 1
fi
echo "✅ Login adherent3 OK"

# Tester login admin
RESP=$(curl -s $TIMEOUT -X POST "$API/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN_ADMIN=$(echo "$RESP" | grep -o '"jwtToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN_ADMIN" ]; then
  echo "❌ Login admin/admin123 échoué"
  exit 1
fi
echo "✅ Login admin OK"

# --- Vérifier la réservation pré-semée de chaque adhérent (démo Séance 4) ---
echo ""
echo "🔍 Vérification des réservations pré-semées (RS-05)..."

check_reservation () {
  TOKEN=$1
  LABEL=$2
  COUNT=$(curl -s $TIMEOUT -X GET "$API/api/reservations" \
    -H "Authorization: Bearer $TOKEN" | grep -o '"id"' | wc -l)
  if [ "$COUNT" -lt 1 ]; then
    echo "❌ $LABEL : aucune réservation visible"
    exit 1
  fi
  echo "✅ $LABEL : $COUNT réservation(s) visible(s) — RS-05 OK"
}

check_reservation "$TOKEN_A1" "A1 (adherent1)"
check_reservation "$TOKEN_A2" "A2 (adherent2)"

echo ""
echo "✅ Toutes les données de test sont en place!"
echo ""
echo "=== RÉCAPITULATIF ==="
echo "📚 L1 (book_id=10) : Livre L1 — Disponible     → Disponible (1 copie)"
echo "📚 L2 (book_id=11) : Livre L2 — Emprunté        → Emprunté par A3"
echo "📚 L3 (book_id=12) : Livre L3 — Emprunté        → Emprunté par A3"
echo "📚 L4 (book_id=13) : Livre L4 — Emprunté        → Emprunté par A3"
echo "📚 L5 (book_id=14) : Livre L5 — Emprunté        → Emprunté par A3"
echo ""
echo "👤 A1 (user_id=10) : adherent1/admin123  — ADHERENT — réservation 101 sur L2"
echo "👤 A2 (user_id=11) : adherent2/admin123  — ADHERENT — réservation 102 sur L3"
echo "👤 A3 (user_id=12) : adherent3/admin123  — ADHERENT — Emprunteur L2-L5"
echo "👑 B (user_id=1)  : admin/admin123       — BIBLIOTHECAIRE"
echo ""
echo "🔐 Rôles Séance 4 : ADHERENT / BIBLIOTHECAIRE"
