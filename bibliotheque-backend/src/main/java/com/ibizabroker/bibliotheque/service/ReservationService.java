package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.BorrowRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.dto.ReservationRequest;
import com.ibizabroker.bibliotheque.dto.ReservationResponse;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.enums.StatutReservation;
import com.ibizabroker.bibliotheque.exceptions.ConflictException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BooksRepository booksRepository;
    private final UsersRepository usersRepository;
    private final BorrowRepository borrowRepository;

    // Statuts actifs (EN_ATTENTE, DISPONIBLE)
    private static final List<StatutReservation> ACTIFS =
        Arrays.asList(StatutReservation.EN_ATTENTE, StatutReservation.DISPONIBLE);

    // Statuts finaux (ANNULEE, EXPIREE, HONOREE) — ne peuvent plus changer
    private static final List<StatutReservation> FINAUX =
        Arrays.asList(StatutReservation.ANNULEE, StatutReservation.EXPIREE, StatutReservation.HONOREE);

    /**
     * POST /api/reservations — Créer une réservation
     * RG-01 à RG-04
     */
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        // Vérifier que le livre existe
        Books livre = booksRepository.findById(request.getLivreId())
            .orElseThrow(() -> new NotFoundException(
                "Livre non trouvé avec l'id: " + request.getLivreId()));

        // Vérifier que l'adhérent existe
        Users adherent = usersRepository.findById(request.getAdherentId())
            .orElseThrow(() -> new NotFoundException(
                "Adhérent non trouvé avec l'id: " + request.getAdherentId()));

        // RG-01 : on ne peut réserver qu'un livre indisponible (emprunté)
        boolean isBorrowed = borrowRepository.existsByBookIdAndReturnDateIsNull(request.getLivreId());
        if (!isBorrowed) {
            throw new ConflictException(
                "RG-01 : Le livre est actuellement disponible — empruntez-le directement");
        }

        // RG-02 : un adhérent ne peut avoir qu'une seule réservation active sur le même livre
        boolean alreadyReserved = reservationRepository
            .existsByAdherentUserIdAndLivreBookIdAndStatutIn(
                request.getAdherentId(), request.getLivreId(), ACTIFS);
        if (alreadyReserved) {
            throw new ConflictException(
                "RG-02 : Vous avez déjà une réservation active sur ce livre");
        }

        // RG-03 : max 3 réservations actives simultanées
        long activeCount = reservationRepository
            .countByAdherentUserIdAndStatutIn(request.getAdherentId(), ACTIFS);
        if (activeCount >= 3) {
            throw new ConflictException(
                "RG-03 : Nombre maximum de 3 réservations actives atteint");
        }

        // RG-04 : dateExpiration = dateReservation + 7 jours
        LocalDateTime now = LocalDateTime.now();
        Reservation reservation = new Reservation();
        reservation.setLivre(livre);
        reservation.setAdherent(adherent);
        reservation.setDateReservation(now);
        reservation.setDateExpiration(now.plusDays(7));
        reservation.setStatut(StatutReservation.EN_ATTENTE);

        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    /**
     * GET /api/reservations — Lister, filtrable par statut et/ou adhérent
     */
    public List<ReservationResponse> getAllReservations(StatutReservation statut, Integer adherentId) {
        List<Reservation> reservations;

        if (statut != null && adherentId != null) {
            reservations = reservationRepository.findByAdherentUserIdAndStatut(adherentId, statut);
        } else if (statut != null) {
            reservations = reservationRepository.findByStatut(statut);
        } else if (adherentId != null) {
            reservations = reservationRepository.findByAdherentUserId(adherentId);
        } else {
            reservations = reservationRepository.findAll();
        }

        return reservations.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * GET /api/reservations/{id} — Consulter
     */
    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Réservation non trouvée avec l'id: " + id));
        return toResponse(reservation);
    }

    /**
     * PATCH /api/reservations/{id}/annuler — Annuler
     * RG-05, RG-06
     */
    @Transactional
    public ReservationResponse annulerReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Réservation non trouvée avec l'id: " + id));

        // RG-06 : un statut final ne peut plus changer
        if (FINAUX.contains(reservation.getStatut())) {
            throw new ConflictException(
                "RG-06 : Une réservation avec le statut '" + reservation.getStatut()
                + "' ne peut plus être modifiée");
        }

        // RG-05 : annulation autorisée uniquement si EN_ATTENTE ou DISPONIBLE
        if (reservation.getStatut() != StatutReservation.EN_ATTENTE
            && reservation.getStatut() != StatutReservation.DISPONIBLE) {
            throw new ConflictException(
                "RG-05 : Annulation refusée — statut actuel '" + reservation.getStatut()
                + "' (seul EN_ATTENTE ou DISPONIBLE est autorisé)");
        }

        reservation.setStatut(StatutReservation.ANNULEE);
        Reservation cancelled = reservationRepository.save(reservation);
        return toResponse(cancelled);
    }

    /**
     * DELETE /api/reservations/{id} — Supprimer
     */
    @Transactional
    public void deleteReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Réservation non trouvée avec l'id: " + id));
        reservationRepository.delete(reservation);
    }

    // ─── Conversion entité → DTO ───────────────────────────────────────────────

    private ReservationResponse toResponse(Reservation r) {
        return ReservationResponse.builder()
            .id(r.getId())
            .livreId(r.getLivre().getBookId())
            .livreTitre(r.getLivre().getBookName())
            .adherentId(r.getAdherent().getUserId())
            .adherentNom(r.getAdherent().getName())
            .dateReservation(r.getDateReservation())
            .dateExpiration(r.getDateExpiration())
            .statut(r.getStatut())
            .build();
    }
}
