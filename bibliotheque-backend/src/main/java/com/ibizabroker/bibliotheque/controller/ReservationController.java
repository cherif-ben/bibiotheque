package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.dto.ReservationRequest;
import com.ibizabroker.bibliotheque.dto.ReservationResponse;
import com.ibizabroker.bibliotheque.enums.StatutReservation;
import com.ibizabroker.bibliotheque.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@CrossOrigin({"http://localhost:3000", "http://localhost:4200"})
@Tag(name = "Réservations", description = "Gestion des réservations de livres")
public class ReservationController {

    private final ReservationService reservationService;

    /**
     * POST /api/reservations — Créer une réservation
     * RS-02 : authentification requise ; un ADHERENT réserve pour lui-même (RS-04),
     * un BIBLIOTHECAIRE pour n'importe qui.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Créer une réservation",
               description = "Réserve un livre indisponible pour un adhérent. "
                           + "RS-04 : pour un ADHERENT, la réservation est créée à son nom "
                           + "(identité issue du token). RG-01 (livre indisponible), "
                           + "RG-02 (pas de doublon), RG-03 (max 3 actives), RG-04 (expiration +7j).")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Réservation créée"),
        @ApiResponse(responseCode = "400", description = "Champ manquant (livreId)"),
        @ApiResponse(responseCode = "401", description = "Token absent ou invalide"),
        @ApiResponse(responseCode = "403", description = "Accès refusé"),
        @ApiResponse(responseCode = "404", description = "Livre ou adhérent introuvable"),
        @ApiResponse(responseCode = "409", description = "Règle de gestion violée (RG-01..03, RS-04)")
    })
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody ReservationRequest request) {
        ReservationResponse response = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/reservations — Lister les réservations (filtrable)
     * RS-02 : authentification requise.
     * RS-05 : un ADHERENT ne reçoit que ses propres réservations ;
     * un BIBLIOTHECAIRE reçoit toutes les réservations.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister les réservations",
               description = "Filtrable par statut et/ou adhérent via paramètres de requête. "
                           + "RS-05 : un ADHERENT ne voit que ses réservations.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Liste retournée"),
        @ApiResponse(responseCode = "401", description = "Token absent ou invalide")
    })
    public ResponseEntity<List<ReservationResponse>> getAllReservations(
            @Parameter(description = "Filtrer par statut")
            @RequestParam(required = false) StatutReservation statut,
            @Parameter(description = "Filtrer par ID adhérent (BIBLIOTHECAIRE uniquement)")
            @RequestParam(required = false) Integer adherentId) {
        List<ReservationResponse> reservations =
            reservationService.getAllReservations(statut, adherentId);
        return ResponseEntity.ok(reservations);
    }

    /**
     * GET /api/reservations/{id} — Consulter une réservation
     * RS-02 : authentification requise.
     * RS-03 : un ADHERENT ne consulte que ses propres réservations.
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Consulter une réservation par son identifiant",
               description = "RS-03 : un ADHERENT ne peut consulter que ses propres réservations.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Réservation trouvée"),
        @ApiResponse(responseCode = "401", description = "Token absent ou invalide"),
        @ApiResponse(responseCode = "403", description = "Réservation d'un autre adhérent"),
        @ApiResponse(responseCode = "404", description = "Réservation introuvable")
    })
    public ResponseEntity<ReservationResponse> getReservationById(
            @PathVariable Long id) {
        ReservationResponse response = reservationService.getReservationById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/reservations/{id}/annuler — Annuler une réservation
     * RS-02 : authentification requise.
     * RS-03 : un ADHERENT n'annule que ses propres réservations.
     */
    @PatchMapping("/{id}/annuler")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Annuler une réservation",
               description = "Autorisé uniquement si le statut est EN_ATTENTE ou DISPONIBLE (RG-05). "
                           + "RS-03 : un ADHERENT ne peut annuler que ses propres réservations.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Réservation annulée"),
        @ApiResponse(responseCode = "401", description = "Token absent ou invalide"),
        @ApiResponse(responseCode = "403", description = "Réservation d'un autre adhérent"),
        @ApiResponse(responseCode = "404", description = "Réservation introuvable"),
        @ApiResponse(responseCode = "409", description = "Statut incompatible (RG-05 / RG-06)")
    })
    public ResponseEntity<ReservationResponse> annulerReservation(
            @PathVariable Long id) {
        ReservationResponse response = reservationService.annulerReservation(id);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/reservations/{id} — Supprimer une réservation
     * RS-02 : réservé au BIBLIOTHECAIRE (403 pour un ADHERENT).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @Operation(summary = "Supprimer une réservation",
               description = "RS-02 : réservé au BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Réservation supprimée"),
        @ApiResponse(responseCode = "401", description = "Token absent ou invalide"),
        @ApiResponse(responseCode = "403", description = "Réservé au BIBLIOTHECAIRE"),
        @ApiResponse(responseCode = "404", description = "Réservation introuvable")
    })
    public ResponseEntity<Void> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }
}
