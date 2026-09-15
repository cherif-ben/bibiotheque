-- ============================================
-- SEED DATA — BIBLIOTHÈQUE
-- Exécution après Hibernate (defer-datasource-initialization=true)
-- continue-on-error=true : ignore les erreurs si données existent déjà
-- ============================================

-- 1. Rôles (Séance 4 : ADHERENT / BIBLIOTHECAIRE)
INSERT INTO role (role_id, role_name) VALUES (1, 'BIBLIOTHECAIRE'), (2, 'ADHERENT')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Admin (mot de passe: admin123)
INSERT INTO users (user_id, username, name, password)
VALUES (1, 'admin', 'Administrateur', '$2b$10$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696')
ON CONFLICT (user_id) DO NOTHING;

UPDATE users
SET password = '$2b$10$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696'
WHERE username = 'admin';

INSERT INTO user_role (user_id, role_id) VALUES (1, 1)
ON CONFLICT DO NOTHING;

-- Migration : rôles historiques -> rôles Séance 4 (idempotent)
UPDATE role SET role_name = 'BIBLIOTHECAIRE' WHERE role_name = 'Admin';
UPDATE role SET role_name = 'ADHERENT' WHERE role_name = 'User';

-- 3. Livres de test (L1-L5) — IDs 10 à 14
INSERT INTO books (book_id, book_name, book_author, book_genre, no_of_copies) VALUES
  (10, 'Livre L1 — Disponible',    'Auteur L1', 'Genre L1', 1),
  (11, 'Livre L2 — Emprunté',      'Auteur L2', 'Genre L2', 0),
  (12, 'Livre L3 — Emprunté',      'Auteur L3', 'Genre L3', 0),
  (13, 'Livre L4 — Emprunté',      'Auteur L4', 'Genre L4', 0),
  (14, 'Livre L5 — Emprunté',      'Auteur L5', 'Genre L5', 0)
ON CONFLICT (book_id) DO NOTHING;

-- 4. Adhérents de test (mot de passe: admin123)
--    A1 (user_id=10) : Réservataire principal
--    A2 (user_id=11) : Saturera le quota de 3 réservations
--    A3 (user_id=12) : Emprunteur — détient L2, L3, L4, L5
INSERT INTO users (user_id, username, name, password) VALUES
  (10, 'adherent1', 'Adhérent A1 — Réservataire',  '$2b$10$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696'),
  (11, 'adherent2', 'Adhérent A2 — Saturation',    '$2b$10$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696'),
  (12, 'adherent3', 'Adhérent A3 — Emprunteur',    '$2b$10$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_role (user_id, role_id) VALUES
  (10, 2), (11, 2), (12, 2)
ON CONFLICT DO NOTHING;

UPDATE users
SET password = '$2b$10$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696'
WHERE username IN ('adherent1', 'adherent2', 'adherent3');

-- 5. Emprunts actifs — A3 (user_id=12) emprunte L2, L3, L4, L5
--    Aucune return_date → les livres sont considérés comme non rendus
INSERT INTO borrow (borrow_id, book_id, user_id, issue_date, due_date) VALUES
  (3, 11, 12, NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days'),
  (4, 12, 12, NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days'),
  (5, 13, 12, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
  (6, 14, 12, NOW() - INTERVAL '8 days',  NOW() - INTERVAL '1 day')
ON CONFLICT (borrow_id) DO NOTHING;

-- 6. Séquences PostgreSQL — aligner après insertion explicite d'IDs
--    Books et Users utilisent GenerationType.AUTO -> hibernate_sequence partagée.
--    On l'avance au-delà des IDs posés à la main (10-14) pour éviter toute collision.
SELECT setval('hibernate_sequence', GREATEST(
           COALESCE((SELECT MAX(book_id) FROM books), 0),
           COALESCE((SELECT MAX(user_id) FROM users), 0),
           100), true)
WHERE EXISTS (SELECT 1 FROM pg_sequences
              WHERE schemaname = 'public' AND sequencename = 'hibernate_sequence');

--    Borrow utilise GenerationType.IDENTITY -> séquence dédiée.
SELECT setval('borrow_borrow_id_seq',
              GREATEST(COALESCE((SELECT MAX(borrow_id) FROM borrow), 0), 1), true)
WHERE EXISTS (SELECT 1 FROM pg_sequences
              WHERE schemaname = 'public' AND sequencename = 'borrow_borrow_id_seq');
-- 7. Réservations pré-semées — une par adhérent (préparation démo Séance 4 :
--    "Chaque adhérent doit avoir au moins une réservation à son nom")
--    RG-01 respecté : L2 (11) et L3 (12) sont bien empruntées par adherent3
--    (return_date null), donc réservables.
--    IDs volontairement distincts (101, 102) pour limiter les collisions
--    avec des réservations déjà créées via l'API sur une base existante.
INSERT INTO reservations (id, livre_id, adherent_id, date_reservation, date_expiration, statut) VALUES
  (101, 11, 10, NOW(), NOW() + INTERVAL '7 days', 'EN_ATTENTE'),
  (102, 12, 11, NOW(), NOW() + INTERVAL '7 days', 'EN_ATTENTE')
ON CONFLICT (id) DO NOTHING;

--    Reservations utilise GenerationType.IDENTITY -> séquence dédiée à réaligner
--    après insertion explicite d'IDs (la prochaine réservation API prendra 103).
SELECT setval('reservations_id_seq',
              GREATEST(COALESCE((SELECT MAX(id) FROM reservations), 0), 1), true)
WHERE EXISTS (SELECT 1 FROM pg_sequences
              WHERE schemaname = 'public' AND sequencename = 'reservations_id_seq');
