# Tester les réservations via Swagger UI

## Prérequis

1. PostgreSQL tourne : `docker compose up -d db`
2. Le backend tourne : `cd bibliotheque-backend && ./mvnw spring-boot:run`
3. Ouvrir **http://localhost:8080/swagger-ui/index.html**



## Données pré-chargées dans la base

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

## Étape 1 — Créer une réservation

**POST** `/api/reservations`

Body :
```json
{
  "livreId": 2,
  "adherentId": 1
}
```

**Résultat attendu : 201 Created**

```json
{
  "id": 1,
  "livreId": 2,
  "livreTitre": "1984",
  "adherentId": 1,
  "adherentNom": "Administrateur",
  "dateReservation": "2026-08-21T11:33:45.420571466",
  "dateExpiration": "2026-08-28T11:33:45.420571466",
  "statut": "EN_ATTENTE"
}
```

---

## Étape 2 — Tester RG-01 (réserver livre disponible → refus)

**POST** `/api/reservations`

Body :
```json
{
  "livreId": 1,
  "adherentId": 1
}
```

**Résultat attendu : 409 Conflict**

```json
{
  "message": "RG-01 : Le livre est actuellement disponible — empruntez-le directement"
}
```

---

## Étape 3 — Tester RG-02 (doublon → refus)

**POST** `/api/reservations`

Body (même livre que l'étape 1) :
```json
{
  "livreId": 2,
  "adherentId": 1
}
```

**Résultat attendu : 409 Conflict**

```json
{
  "message": "RG-02 : Vous avez déjà une réservation active sur ce livre"
}
```

---

## Étape 4 — Tester la validation 400 (champ manquant)

**POST** `/api/reservations`

Body (sans livreId) :
```json
{
  "adherentId": 1
}
```

**Résultat attendu : 400 Bad Request**

```json
{
  "livreId": "Le champ 'livreId' est obligatoire"
}
```

---

## Étape 5 — Tester le 404 (livre inexistant)

**POST** `/api/reservations`

Body :
```json
{
  "livreId": 999,
  "adherentId": 1
}
```

**Résultat attendu : 404 Not Found**

```json
{
  "message": "Livre non trouvé avec l'id: 999"
}
```

---

## Étape 6 — Lister toutes les réservations

**GET** `/api/reservations`

Pas de body. **Résultat attendu : 200 OK** — Liste JSON de toutes les réservations.

Filtres optionnels :
- `statut` = `EN_ATTENTE`
- `adherentId` = `1`

---

## Étape 7 — Consulter une réservation

**GET** `/api/reservations/1`

**Résultat attendu : 200 OK** — Détail de la réservation.

Avec un ID inexistant :
**GET** `/api/reservations/9999` → **404 Not Found**

---

## Étape 8 — Annuler une réservation

**PATCH** `/api/reservations/1/annuler`

Pas de body. **Résultat attendu : 200 OK**

```json
{
  "id": 1,
  "statut": "ANNULEE",
  ...
}
```

---

## Étape 9 — Tester RG-06 (ré-annuler → refus)

Relancer la même requête :

**PATCH** `/api/reservations/1/annuler`

**Résultat attendu : 409 Conflict**

```json
{
  "message": "RG-06 : Une réservation avec le statut 'ANNULEE' ne peut plus être modifiée"
}
```

---

## Étape 10 — Supprimer une réservation

**DELETE** `/api/reservations/1`

**Résultat attendu : 204 No Content** (pas de body).

Vérifier la suppression :
**GET** `/api/reservations/1` → **404 Not Found**

DELETE sur un ID inexistant :
**DELETE** `/api/reservations/9999` → **404 Not Found**

---

## Récapitulatif des codes de réponse

| Verbe | Chemin | Succès | Erreurs |
|-------|--------|--------|---------|
| POST | `/api/reservations` | 201 | 400, 404, 409 |
| GET | `/api/reservations` | 200 | — |
| GET | `/api/reservations/{id}` | 200 | 404 |
| PATCH | `/api/reservations/{id}/annuler` | 200 | 404, 409 |
| DELETE | `/api/reservations/{id}` | 204 | 404 |
