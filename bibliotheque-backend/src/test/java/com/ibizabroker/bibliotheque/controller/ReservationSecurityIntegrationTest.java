package com.ibizabroker.bibliotheque.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests d'intégration de la sécurité sur les endpoints de réservation.
 *
 * RS-01 : sans token -> 401
 * RS-02 : avec un token ADHERENT -> 200
 * RS-03 : avec un token ADHERENT, sur la réservation d'un autre -> 403
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ReservationSecurityIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void seedDatabase() {
        transactionTemplate.executeWithoutResult(tx -> {
            // Rôles (idempotent)
            mergeRole(1, "BIBLIOTHECAIRE");
            mergeRole(2, "ADHERENT");

            // Comptes de test — même mot de passe pour tous : admin123
            String hash = passwordEncoder.encode("admin123");
            upsertUser(1, "bibliothecaire", "La Bibliothecaire", hash, 1);
            upsertUser(10, "A1", "Adherent Un", hash, 2);
            upsertUser(11, "A2", "Adherent Deux", hash, 2);

            // Un livre
            entityManager.createNativeQuery(
                "MERGE INTO books (book_id, book_name, book_author, book_genre, no_of_copies) "
                + "KEY (book_id) VALUES (?, ?, ?, ?, ?)")
                .setParameter(1, 100)
                .setParameter(2, "Livre Test")
                .setParameter(3, "Auteur Test")
                .setParameter(4, "Genre Test")
                .setParameter(5, 0)
                .executeUpdate();

            // Une réservation appartenant à A2 (user_id = 11)
            entityManager.createNativeQuery(
                "MERGE INTO reservations (id, livre_id, adherent_id, date_reservation, date_expiration, statut) "
                + "KEY (id) VALUES (?, ?, ?, ?, ?, ?)")
                .setParameter(1, 900L)
                .setParameter(2, 100)
                .setParameter(3, 11)
                .setParameter(4, LocalDateTime.now())
                .setParameter(5, LocalDateTime.now().plusDays(7))
                .setParameter(6, "EN_ATTENTE")
                .executeUpdate();
        });
    }

    private void mergeRole(int roleId, String roleName) {
        entityManager.createNativeQuery(
            "MERGE INTO role (role_id, role_name) KEY (role_id) VALUES (?, ?)")
            .setParameter(1, roleId)
            .setParameter(2, roleName)
            .executeUpdate();
    }

    private void upsertUser(int id, String username, String name, String passwordHash, int roleId) {
        entityManager.createNativeQuery(
            "MERGE INTO users (user_id, username, name, password) KEY (user_id) VALUES (?, ?, ?, ?)")
            .setParameter(1, id)
            .setParameter(2, username)
            .setParameter(3, name)
            .setParameter(4, passwordHash)
            .executeUpdate();

        // La table de jointure USER_ROLE n'a pas de clé primaire : DELETE + INSERT idempotent
        entityManager.createNativeQuery(
            "DELETE FROM user_role WHERE user_id = ? AND role_id = ?")
            .setParameter(1, id)
            .setParameter(2, roleId)
            .executeUpdate();
        entityManager.createNativeQuery(
            "INSERT INTO user_role (user_id, role_id) VALUES (?, ?)")
            .setParameter(1, id)
            .setParameter(2, roleId)
            .executeUpdate();
    }

    /** Récupère un vrai JWT signé via POST /authenticate. */
    private String authenticate(String username, String password) throws Exception {
        Map<String, String> credentials = new HashMap<>();
        credentials.put("username", username);
        credentials.put("password", password);

        ResponseEntity<String> response = restTemplate.postForEntity(
            "http://localhost:" + port + "/authenticate",
            entityWithJsonBody(credentials),
            String.class);

        assertEquals(200, response.getStatusCodeValue(), "Authentification de " + username);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertTrue(body.has("jwtToken"), "La réponse doit contenir un jwtToken");
        return body.get("jwtToken").asText();
    }

    private HttpEntity<Map<String, String>> entityWithJsonBody(Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private HttpEntity<Void> entityWithBearerToken(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    private HttpEntity<Void> entityWithoutToken() {
        return new HttpEntity<>(new HttpHeaders());
    }

    @Test
    void getAllReservations_withoutToken_returns401() {
        // RS-01 : sans token, tout endpoint de réservation renvoie 401
        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/reservations",
            HttpMethod.GET, entityWithoutToken(), String.class);

        assertEquals(401, response.getStatusCodeValue());
    }

    @Test
    void getAllReservations_withAdherentToken_returns200() throws Exception {
        // RS-02 / RS-05 : un ADHERENT authentifié consulte ses réservations
        String token = authenticate("A1", "admin123");

        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/reservations",
            HttpMethod.GET, entityWithBearerToken(token), String.class);

        assertEquals(200, response.getStatusCodeValue());
    }

    @Test
    void getReservationById_withAdherentToken_onAnotherAdherentsReservation_returns403() throws Exception {
        // RS-03 : un ADHERENT ne peut pas consulter la réservation d'un autre
        // (la réservation 900 appartient à A2, le token est celui de A1)
        String token = authenticate("A1", "admin123");

        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/reservations/900",
            HttpMethod.GET, entityWithBearerToken(token), String.class);

        assertEquals(403, response.getStatusCodeValue());
    }

    // ─── RS-02 : Autorisations par rôle ───────────────────────────────

    @Test
    void deleteReservation_withAdherentToken_returns403() throws Exception {
        // RS-02 : un ADHERENT qui tente une action réservée au BIBLIOTHECAIRE reçoit 403
        String token = authenticate("A1", "admin123");

        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/reservations/900",
            HttpMethod.DELETE, entityWithBearerToken(token), String.class);

        assertEquals(403, response.getStatusCodeValue());
    }

    // ─── Permissions BIBLIOTHECAIRE ────────────────────────────────────

    @Test
    void getAllReservations_withBibliothecaireToken_returnsAllReservations() throws Exception {
        // RS-02 : un BIBLIOTHECAIRE peut consulter toutes les réservations
        String token = authenticate("bibliothecaire", "admin123");

        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/reservations",
            HttpMethod.GET, entityWithBearerToken(token), String.class);

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("900"), "Le BIBLIOTHECAIRE doit voir la réservation 900");
    }

    @Test
    void getReservationById_withBibliothecaireToken_returns200() throws Exception {
        // RS-02 : un BIBLIOTHECAIRE peut accéder à n'importe quelle réservation
        String token = authenticate("bibliothecaire", "admin123");

        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/reservations/900",
            HttpMethod.GET, entityWithBearerToken(token), String.class);

        assertEquals(200, response.getStatusCodeValue());
    }

    @Test
    void createReservation_withAdherentToken_forAnotherAdherent_returns403() throws Exception {
        // RS-04 : un ADHERENT ne peut pas créer de réservation au nom d'un autre adhérent
        // (A1 = user_id 10 tente de réserver pour A2 = user_id 11)
        String token = authenticate("A1", "admin123");

        Map<String, Object> body = new HashMap<>();
        body.put("livreId", 100);
        body.put("adherentId", 11);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/reservations",
            HttpMethod.POST, requestEntity, String.class);

        assertEquals(403, response.getStatusCodeValue());
    }

    // ─── Admin suppression d'utilisateur ─────────────────────────

    @Test
    void deleteUser_withoutToken_returns401() {
        // RS-01 : sans token -> 401
        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/admin/users/10",
            HttpMethod.DELETE, entityWithoutToken(), String.class);

        assertEquals(401, response.getStatusCodeValue());
    }

    @Test
    void deleteUser_withAdherentToken_returns403() throws Exception {
        // RS-02 : un ADHERENT ne peut pas supprimer un utilisateur
        String token = authenticate("A1", "admin123");

        ResponseEntity<String> response = restTemplate.exchange(
            "http://localhost:" + port + "/admin/users/10",
            HttpMethod.DELETE, entityWithBearerToken(token), String.class);

        assertEquals(403, response.getStatusCodeValue());
    }

    @Test
    void deleteUser_withBibliothecaireToken_returns204() throws Exception {
        // BIBLIOTHECAIRE peut supprimer un autre utilisateur
        String token = authenticate("bibliothecaire", "admin123");

        ResponseEntity<Void> response = restTemplate.exchange(
            "http://localhost:" + port + "/admin/users/10",
            HttpMethod.DELETE, entityWithBearerToken(token), Void.class);

        assertEquals(204, response.getStatusCodeValue());
    }
}
