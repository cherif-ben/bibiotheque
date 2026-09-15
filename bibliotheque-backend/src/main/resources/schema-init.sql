-- =====================================================
-- Script d'initialisation de la base de données
-- Les données de test sont dans data.sql ( IDs 10-14 )
-- =====================================================

-- Roles (idempotent) — Séance 4 : ADHERENT / BIBLIOTHECAIRE
INSERT INTO role (role_name) VALUES ('BIBLIOTHECAIRE'), ('ADHERENT')
ON CONFLICT DO NOTHING;
UPDATE role SET role_name = 'BIBLIOTHECAIRE' WHERE role_name = 'Admin';
UPDATE role SET role_name = 'ADHERENT' WHERE role_name = 'User';

-- Admin user (password: admin123)
INSERT INTO users (user_id, username, name, password)
VALUES (1, 'admin', 'Administrateur', '$2b$10$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696')
ON CONFLICT (user_id) DO NOTHING;

-- Assign BIBLIOTHECAIRE role to admin user
INSERT INTO user_role (user_id, role_id)
SELECT 1, role_id FROM role WHERE role_name = 'BIBLIOTHECAIRE'
AND NOT EXISTS (
  SELECT 1 FROM user_role WHERE user_id = 1
);
