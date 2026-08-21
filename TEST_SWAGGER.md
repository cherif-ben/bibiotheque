# Guide pratique — Réservation de livres (Bibliothèque)

## Table des matières
1. [Prérequis](#prérequis)
2. [Authentification JWT](#1--authentification-jwt)
3. [Créer une réservation](#2--créer-une-réservation)
4. [Tester les règles de gestion](#3--tester-les-règles-de-gestion)
5. [Consulter / Lister les réservations](#4--consulter--lister-les-réservations)
6. [Annuler une réservation](#5--annuler-une-réservation)
7. [Supprimer une réservation](#6--supprimer-une-réservation)
8. [Règles de gestion (Récap)](#récapitulatif-des-règles-de-gestion)
9. [Codes de réponse](#codes-de-réponse)

---

## Prérequis

1. PostgreSQL tourne : `docker compose up -d db`
2. Le backend tourne : `cd bibliotheque-backend && ./mvnw spring-boot:run`
3. Swagger UI : **http://localhost:8080/swagger-ui/index.html**
4. curl ou Postman pour les exemples ci-dessous

### Données pré-chargées

| Table | id | Détails |
|-------|-----|---------|
| **users** | 1 | admin / Administrateur (rôle Admin) |
| **users** | 2 | jean / Jean Dupont (rôle User) |
| **books** | 1 | Le Petit Prince — 5 copies (**disponible**) |
| **books** | 2 | 1984 — 2 copies (**emprunté** par admin, indisponible) |
| **books** | 3 | L'Étranger — 4 copies (**disponible**) |
| **books** | 4 | Dune — 2 copies (**disponible**) |
| **borrow** | 1 | admin a emprunté le livre 2 (return_date = null) |
| **reservations** | — | Vide |

**Règle clé** : on ne peut réserver qu'un livre **indisponible** (emprunté).
→ Seul le livre 2 (1984) est réservable.

---

## 1 — Authentification JWT

L'API utilise l'authentification JWT. Toute requête vers un endpoint protégé nécessite un token Bearer dans le header `Authorization`.

### Obtenir un token

```bash
curl -s -X POST http://localhost:8080/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Réponse 200 OK :**
```json
{
  "user": {
    "userId": 1,
    "username": "admin",
    "name": "Administrateur",
    "password": "$2b$10$...",
    "role": [{ "roleId": 1, "roleName": "Admin" }]
  },
  "jwtToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

> **⚠️ Important** : copiez la valeur de `jwtToken` — vous en aurez besoin pour TOUTES les requêtes suivantes.

### Utiliser le token

Ajoutez le header `Authorization: Bearer <token>` à chaque requête :

```bash
export TOKEN="eyJhbGciOiJIUzUxMiJ9..."

curl -s http://localhost:8080/api/reservations \
  -H "Authorization: Bearer $TOKEN"
```

### Endpoints publics (pas de token)

| Endpoint | Méthode |
|----------|---------|
| `/authenticate` | POST |
| `/borrow/**` | Toutes |
| `/admin/books` | GET (liste) |
| `/api/reservations/**` | Toutes |
| `/swagger-ui/**` | GET |
| `/v3/api-docs/**` | GET |

> Les endpoints `/api/reservations/**` sont actuellement ouverts sans authentification dans la config de sécurité. Si vous souhaitez les sécuriser, modifiez `WebSecurityConfiguration.java` et retirez `/api/reservations/**` du `.permitAll()`.

---

## 2 — Créer une réservation

**POST** `/api/reservations`

```bash
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "livreId": 2,
    "adherentId": 1
  }'
```

**Réponse 201 Created :**
```json
{
  "id": 1,
  "livreId": 2,
  "livreTitre": "1984",
  "adherentId": 1,
  "adherentNom": "Administrateur",
  "dateReservation": "2026-08-21T11:33:45.420",
  "dateExpiration": "2026-08-28T11:33:45.420",
  "statut": "EN_ATTENTE"
}
```

### Explication du cycle de vie

```
EN_ATTENTE → DISPONIBLE → HONOREE
     ↓            ↓
  ANNULEE     ANNULEE
     ↓
  EXPIREE (si dateExpiration dépassée)
```

| Statut | Signification |
|--------|---------------|
| `EN_ATTENTE` | Réservation créée, en attente que le livre soit rendu |
| `DISPONIBLE` | Le livre est revenu, l'adhérent peut venir le récupérer |
| `ANNULEE` | Réservation annulée par l'adhérent ou le système |
| `EXPIREE` | Délai de 7 jours dépassé sans récupération |
| `HONOREE` | L'adhérent a récupéré le livre |

---

## 3 — Tester les règles de gestion

### RG-01 : Réserver un livre disponible → refus

On tente de réserver le livre 1 (Le Petit Prince, 5 copies disponibles) :

```bash
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "livreId": 1,
    "adherentId": 1
  }'
```

**Réponse 409 Conflict :**
```json
{
  "message": "RG-01 : Le livre est actuellement disponible — empruntez-le directement"
}
```

### RG-02 : Doublon → refus

On tente de réserver à nouveau le livre 2 (déjà réservé à l'étape 2) :

```bash
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "livreId": 2,
    "adherentId": 1
  }'
```

**Réponse 409 Conflict :**
```json
{
  "message": "RG-02 : Vous avez déjà une réservation active sur ce livre"
}
```

### RG-03 : Max 3 réservations actives

Créez 2 réservations supplémentaires sur des livres empruntés, puis tentez une 4ème :

```bash
# Réservation 2 (nécessite un 2ème livre emprunté)
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "livreId": <id_livre_emprunte_2>,
    "adherentId": 1
  }'

# Réservation 3
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "livreId": <id_livre_emprunte_3>,
    "adherentId": 1
  }'

# Réservation 4 → devrait être refusée
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "livreId": <id_livre_emprunte_4>,
    "adherentId": 1
  }'
```

**Réponse 409 Conflict :**
```json
{
  "message": "RG-03 : Nombre maximum de 3 réservations actives atteint"
}
```

### RG-04 : Expiration automatique (+7 jours)

La date d'expiration est calculée automatiquement :

```
dateExpiration = dateReservation + 7 jours
```

Pas de test manuel nécessaire — visible dans la réponse de création.

### Validation 400 : Champ manquant

```bash
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "adherentId": 1
  }'
```

**Réponse 400 Bad Request :**
```json
{
  "livreId": "Le champ 'livreId' est obligatoire"
}
```

### 404 : Livre inexistant

```bash
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "livreId": 999,
    "adherentId": 1
  }'
```

**Réponse 404 Not Found :**
```json
{
  "message": "Livre non trouvé avec l'id: 999"
}
```

### 404 : Adhérent inexistant

```bash
curl -s -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "livreId": 2,
    "adherentId": 999
  }'
```

**Réponse 404 Not Found :**
```json
{
  "message": "Adhérent non trouvé avec l'id: 999"
}
```

---

## 4 — Consulter / Lister les réservations

### Lister toutes les réservations

```bash
curl -s http://localhost:8080/api/reservations \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrer par statut

```bash
curl -s "http://localhost:8080/api/reservations?statut=EN_ATTENTE" \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrer par adhérent

```bash
curl -s "http://localhost:8080/api/reservations?adherentId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Combiner les filtres

```bash
curl -s "http://localhost:8080/api/reservations?statut=EN_ATTENTE&adherentId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Consulter une réservation par ID

```bash
curl -s http://localhost:8080/api/reservations/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse 200 OK :**
```json
{
  "id": 1,
  "livreId": 2,
  "livreTitre": "1984",
  "adherentId": 1,
  "adherentNom": "Administrateur",
  "dateReservation": "2026-08-21T11:33:45.420",
  "dateExpiration": "2026-08-28T11:33:45.420",
  "statut": "EN_ATTENTE"
}
```

ID inexistant :
```bash
curl -s http://localhost:8080/api/reservations/9999 \
  -H "Authorization: Bearer $TOKEN"
```
→ **404 Not Found**

---

## 5 — Annuler une réservation

**PATCH** `/api/reservations/{id}/annuler`

```bash
curl -s -X PATCH http://localhost:8080/api/reservations/1/annuler \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse 200 OK :**
```json
{
  "id": 1,
  "statut": "ANNULEE",
  ...
}
```

### RG-05 : Annulation refusée sur statut final

Si la réservation est déjà `ANNULEE`, `EXPIREE` ou `HONOREE` :

```bash
curl -s -X PATCH http://localhost:8080/api/reservations/1/annuler \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse 409 Conflict :**
```json
{
  "message": "RG-06 : Une réservation avec le statut 'ANNULEE' ne peut plus être modifiée"
}
```

---

## 6 — Supprimer une réservation

**DELETE** `/api/reservations/{id}`

```bash
curl -s -X DELETE http://localhost:8080/api/reservations/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse 204 No Content** (pas de body).

Vérification :
```bash
curl -s http://localhost:8080/api/reservations/1 \
  -H "Authorization: Bearer $TOKEN"
```
→ **404 Not Found**

DELETE sur un ID inexistant :
```bash
curl -s -X DELETE http://localhost:8080/api/reservations/9999 \
  -H "Authorization: Bearer $TOKEN"
```
→ **404 Not Found**

---

## Récapitulatif des règles de gestion

| RG | Règle | Code HTTP |
|----|-------|-----------|
| **RG-01** | Un livre **disponible** ne peut pas être réservé | 409 |
| **RG-02** | Un adhérent ne peut pas avoir 2 réservations actives sur le même livre | 409 |
| **RG-03** | Maximum **3 réservations actives** par adhérent | 409 |
| **RG-04** | La réservation expire après **7 jours** | — |
| **RG-05** | Annulation autorisée uniquement sur statut `EN_ATTENTE` ou `DISPONIBLE` | 409 |
| **RG-06** | Un statut final (`ANNULEE`, `EXPIREE`, `HONOREE`) ne peut plus changer | 409 |

---

## Codes de réponse

| Verbe | Chemin | Succès | Erreurs |
|-------|--------|--------|---------|
| POST | `/api/reservations` | 201 | 400, 404, 409 |
| GET | `/api/reservations` | 200 | — |
| GET | `/api/reservations/{id}` | 200 | 404 |
| PATCH | `/api/reservations/{id}/annuler` | 200 | 404, 409 |
| DELETE | `/api/reservations/{id}` | 204 | 404 |

---

## Script de test rapide (tout-en-un)

```bash
#!/bin/bash
# Test complet de l'authentification + réservation
# Usage : bash test-reservation.sh

BASE="http://localhost:8080"

echo "=== ÉTAPE 1 : Authentification ==="
RESP=$(curl -s -X POST "$BASE/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$RESP" | grep -o '"jwtToken":"[^"]*"' | cut -d'"' -f4)
echo "Token obtenu : ${TOKEN:0:20}..."

echo ""
echo "=== ÉTAPE 2 : Créer une réservation (livre 2 - 1984) ==="
curl -s -X POST "$BASE/api/reservations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"livreId":2,"adherentId":1}' | python3 -m json.tool

echo ""
echo "=== ÉTAPE 3 : RG-01 - Réserver livre disponible (doit échouer) ==="
curl -s -X POST "$BASE/api/reservations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"livreId":1,"adherentId":1}' | python3 -m json.tool

echo ""
echo "=== ÉTAPE 4 : RG-02 - Doublon (doit échouer) ==="
curl -s -X POST "$BASE/api/reservations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"livreId":2,"adherentId":1}' | python3 -m json.tool

echo ""
echo "=== ÉTAPE 5 : Lister les réservations ==="
curl -s "$BASE/api/reservations" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== ÉTAPE 6 : Annuler la réservation ==="
curl -s -X PATCH "$BASE/api/reservations/1/annuler" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== ÉTAPE 7 : RG-06 - Ré-annuler (doit échouer) ==="
curl -s -X PATCH "$BASE/api/reservations/1/annuler" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== ÉTAPE 8 : Supprimer la réservation ==="
curl -s -o /dev/null -w "HTTP %{http_code}" \
  -X DELETE "$BASE/api/reservations/1" \
  -H "Authorization: Bearer $TOKEN"
echo ""

echo ""
echo "=== Tests terminés ==="
```
