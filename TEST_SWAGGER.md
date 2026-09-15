# Tester les réservations via Swagger UI

## Prérequis

1. PostgreSQL tourne : `docker compose up -d db`
2. Le backend tourne : `cd bibliotheque-backend && ./mvnw spring-boot:run`
3. Ouvrir **http://localhost:8080/swagger-ui/index.html**



## Données pré-chargées dans la base (data.sql)

| Table | id | Détails |
|-------|-----|---------|
| **users** | 1 | admin / Administrateur (rôle **BIBLIOTHECAIRE**) |
| **users** | 10 | A1 |
| **users** | 11 | A2 |
| **users** | 12 | A3 |
| **books** | 10 | L1 — 1 copie (**disponible**) |
| **books** | 11 | L2 — 0 copie (**emprunté** par A3) |
| **books** | 12 | L3 — 0 copie (**emprunté** par A3) |
| **books** | 13 | L4 — 0 copie (**emprunté** par A3) |
| **books** | 14 | L5 — 0 copie (**emprunté** par A3) |
| **borrow** | 3-6 | A3 (id 12) emprunte L2, L3, L4, L5 (return_date = null) |
| **reservations** | 101 | L2 — A1 (id 10) — EN_ATTENTE |
| **reservations** | 102 | L3 — A2 (id 11) — EN_ATTENTE |
| **reservations** | 103 | L5 — A3 (id 12) — EN_ATTENTE |

> **Démo Séance 4** : chaque adhérent a déjà une réservation à son nom
> (exigence du passage devant le formateur). Identifiants des comptes :
> `admin/admin123` (BIBLIOTHECAIRE), `A1/admin123`, `A2/admin123`,
> `A3/admin123` (ADHERENT).

**Mot de passe de tous les comptes : `admin123`**

**Règle clé** : on ne peut réserver qu'un livre **indisponible** (emprunté).
→ Seuls les livres 11 à 14 sont réservables.

---

## Étape 0 — S'authentifier (obtenir le token)

**POST** `/authenticate`

```json
{
  "username": "A1",
  "password": "admin123"
}
```

**Résultat attendu : 200 OK**

```json
{
  "user": { "userId": 10, "name": "A1", ... },
  "jwtToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

Dans Swagger UI, cliquer sur le bouton **Authorize** (en haut à droite) et coller le token.
Toutes les requêtes suivantes porteront l'en-tête `Authorization: Bearer <token>`.

---

## Étape 1 — Créer une réservation (ADHERENT pour lui-même)

**POST** `/api/reservations`

Body :
```json
{
  "livreId": 13,
  "adherentId": 10
}
```

**Résultat attendu : 201 Created**

```json
{
  "id": 103,
  "livreId": 13,
  "livreTitre": "L4",
  "adherentId": 10,
  "adherentNom": "A1",
  "dateReservation": "2026-09-11T11:33:45.420571",
  "dateExpiration": "2026-09-18T11:33:45.420571",
  "statut": "EN_ATTENTE"
}
```

> **RS-04** : `adherentId` est ignoré pour un ADHERENT — la réservation est créée
> au nom du porteur du token. Mettre `adherentId: 11` avec le token de A1
> renvoie **403 Forbidden**.

---

## Étape 2 — Tester RG-01 (réserver livre disponible → refus)

**POST** `/api/reservations`

Body :
```json
{
  "livreId": 10,
  "adherentId": 10
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
  "livreId": 13,
  "adherentId": 10
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
  "adherentId": 10
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
  "adherentId": 10
}
```

**Résultat attendu : 404 Not Found**

```json
{
  "message": "Livre non trouvé avec l'id: 999"
}
```

---

## Étape 6 — Lister les réservations

**GET** `/api/reservations`

**Résultat attendu : 200 OK**

> **RS-05** : avec un token ADHERENT, la liste ne contient que **ses** réservations,
> même si on tente `?adherentId=11` (paramètre ignoré et remplacé par l'identité du token).
> Avec un token BIBLIOTHECAIRE, la liste contient **toutes** les réservations
> (filtres optionnels : `statut=EN_ATTENTE`, `adherentId=10`).

---

## Étape 7 — Consulter une réservation

**GET** `/api/reservations/101` — réservation de A1 (la vôtre)

**Résultat attendu : 200 OK** — Détail de la réservation.

Avec un ID inexistant :
**GET** `/api/reservations/9999` → **404 Not Found**

> **RS-03** : la réservation **102** (L3) appartient à A2 —
> avec le token de A1, elle renvoie **403 Forbidden**.

---

## Étape 8 — Annuler une réservation

**PATCH** `/api/reservations/101/annuler`

Pas de body. **Résultat attendu : 200 OK**

```json
{
  "id": 1,
  "statut": "ANNULEE",
  ...
}
```

> **RS-03** : annuler la réservation d'un autre adhérent → **403 Forbidden**.

---

## Étape 9 — Tester RG-06 (ré-annuler → refus)

Relancer la même requête :

**PATCH** `/api/reservations/101/annuler`

**Résultat attendu : 409 Conflict**

```json
{
  "message": "RG-06 : Une réservation avec le statut 'ANNULEE' ne peut plus être modifiée"
}
```

---

## Étape 10 — Supprimer une réservation (BIBLIOTHECAIRE uniquement)

**DELETE** `/api/reservations/102` avec le token **BIBLIOTHECAIRE** (admin)

**Résultat attendu : 204 No Content** (pas de body).

> **RS-02** : le même appel avec un token ADHERENT renvoie **403 Forbidden**.

Vérifier la suppression :
**GET** `/api/reservations/102` → **404 Not Found**

DELETE sur un ID inexistant :
**DELETE** `/api/reservations/9999` → **404 Not Found**

---

## Séance 4 — Sécurité du module Réservation

### Démonstrations 401 / 403 (à faire en direct)

| # | Requête | Token | Résultat attendu | Règle |
|---|---------|-------|------------------|-------|
| 1 | `GET /api/reservations` | *(aucun)* | **401** | RS-01 |
| 2 | `GET /api/reservations` | A1 | **200** (ses réservations seulement) | RS-02, RS-05 |
| 3 | `GET /api/reservations/102` (réservation de A2) | A1 | **403** | RS-03 |
| 4 | `POST /api/reservations` `{"livreId":14,"adherentId":11}` | A1 | **403** (pas de réservation au nom d'autrui) | RS-04 |
| 5 | `DELETE /api/reservations/101` | A1 | **403** (réservé au bibliothécaire) | RS-02 |
| 6 | `POST /api/reservations` `{"livreId":14,"adherentId":10}` | admin | **201** (réserve pour n'importe qui) | RS-02 |

### Où chaque règle est implémentée

| Règle | Implémentation |
|-------|----------------|
| **RS-01** | `WebSecurityConfiguration.configure()` — `/api/reservations/**` retiré de `permitAll` et déclaré `.authenticated()` ; `JwtAuthenticationEntryPoint` renvoie le 401 |
| **RS-02** | `ReservationController` — `@PreAuthorize("isAuthenticated()")` sur POST/GET/PATCH, `@PreAuthorize("hasRole('BIBLIOTHECAIRE')")` sur DELETE |
| **RS-03** | `ReservationService.checkOwnership()` — appelé dans `getReservationById()` et `annulerReservation()` ; lève `AccessDeniedException` (→ 403) si la réservation n'appartient pas à l'ADHERENT connecté |
| **RS-04** | `ReservationService.createReservation()` — l'adhérent vient de `CurrentUserService` (subject du token JWT), jamais du corps de la requête ; un `adherentId` falsifié lève `AccessDeniedException` (→ 403) |
| **RS-05** | `ReservationService.getAllReservations()` — pour un ADHERENT, le filtre `adherentId` est écrasé par l'identité du token : il ne voit que ses réservations |

### Distinction 401 / 403

| Code | Signification | Quand il est renvoyé |
|------|---------------|----------------------|
| **401** | Je ne sais pas qui vous êtes | Token absent (`JwtAuthenticationEntryPoint`), invalide ou expiré — avant toute vérification de droits |
| **403** | Je sais qui vous êtes, mais vous n'avez pas le droit | Authentifié mais `@PreAuthorize` refusé, réservation d'autrui, ou `adherentId` falsifié |

### Tests (sans base externe — H2 en mémoire + mocks)

```bash
cd bibliotheque-backend && ./mvnw test
```

| Test | Vérifie |
|------|---------|
| `ReservationServiceTest.createReservation_succeeds_whenAdherentHasTwoActiveReservations` | RG-03 : 2 actives → 3e acceptée (repository mocké) |
| `ReservationServiceTest.createReservation_isRefused_whenAdherentAlreadyHasThreeActiveReservations` | RG-03 : 3 actives → refus (repository mocké) |
| `ReservationSecurityIntegrationTest.getAllReservations_withoutToken_returns401` | RS-01 : sans token → 401 |
| `ReservationSecurityIntegrationTest.getAllReservations_withAdherentToken_returns200` | RS-02/RS-05 : token ADHERENT → 200 |
| `ReservationSecurityIntegrationTest.getReservationById_withAdherentToken_onAnotherAdherentsReservation_returns403` | RS-03 : réservation d'autrui → 403 |

---

## Récapitulatif des codes de réponse

| Verbe | Chemin | Succès | Erreurs |
|-------|--------|--------|---------|
| POST | `/api/reservations` | 201 | 400, 401, 403, 404, 409 |
| GET | `/api/reservations` | 200 | 401 |
| GET | `/api/reservations/{id}` | 200 | 401, 403, 404 |
| PATCH | `/api/reservations/{id}/annuler` | 200 | 401, 403, 404, 409 |
| DELETE | `/api/reservations/{id}` | 204 | 401, 403, 404 |
