-- Roles
INSERT INTO role (role_name) VALUES ('Admin'), ('User');

-- Admin user (password: admin123, BCrypt hashed)
INSERT INTO users (user_id, username, name, password)
VALUES (1, 'admin', 'Administrateur', '$2b$10$RN5ij7XXjDpRBALhITW.2uzYGontX4U9c9ZRH5i3e.5l6RvkjZ696');

INSERT INTO user_role (user_id, role_id)
VALUES (1, (SELECT role_id FROM role WHERE role_name = 'Admin'));

-- Advance the sequence beyond manually inserted IDs
UPDATE hibernate_sequence SET next_val = 100 WHERE next_val < 100;
