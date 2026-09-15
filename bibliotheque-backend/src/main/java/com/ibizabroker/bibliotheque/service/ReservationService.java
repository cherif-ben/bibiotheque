package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.configuration.CurrentUserService;
import com.ibizabroker.bibliotheque.dao.BorrowRepository;
import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.dto.ReservationRequest;
import com.ibizabroker.bibliotheque.dto.ReservationResponse;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Borrow;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.enums.StatutReservation;
import com.ibizabroker.bibliotheque.exceptions.ConflictException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BooksRepository booksRepository;
    private final UsersRepository usersRepository;
    private final BorrowRepository borrowRepository;
    private final CurrentUserService currentUserService;

    // Statuts actifs (EN_ATTENTE, DISPONIBLE)
    private static final List<StatutReservation> ACTIFS =
        Arrays.asList(StatutReservation.EN_ATTENTE, StatutReservation.DISPONIBLE);

    // Statuts finaux (ANNULEE, EXPIREE, HONOREE) — ne peuvent plus changer
    private static final List<StatutReservation> FINAUX =
        Arrays.asList(StatutReservation.ANNULEE, StatutReservation.EXPIREE, StatutReservation.HONOREE);

    /**
     * POST /api/reservations — Créer une réservation
     * RG-01 à RG-04
     *
     * RS-04 : l'adhérent au nom duquel la réservation est créée vient du token,
     * jamais du corps de la requête. Pour un ADHERENT, request.adherentId est ignoré ;
     * seul un BIBLIOTHECAIRE peut réserver pour quelqu'un d'autre.
     */
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        // RS-04 : l'identité de l'adhérent concerné vient du token, jamais du corps
        Users adherent;
        if (currentUserService.isBibliothecaire()) {
            // Un BIBLIOTHECAIRE peut réserver pour n'importe quel adhérent
            adherent = usersRepository.findById(request.getAdherentId())
                .orElseThrow(() -> new NotFoundException(
                    "Adhérent non trouvé avec l'id: " + request.getAdherentId()));
        } else {
            // Un ADHERENT réserve uniquement pour lui-même —
            // un adherentId falsifié dans le corps de la requête est refusé (403)
            adherent = currentUserService.getCurrentUser();
            if (request.getAdherentId() != null
                && !request.getAdherentId().equals(adherent.getUserId())) {
                throw new AccessDeniedException(
                    "RS-04 : Vous ne pouvez pas créer une réservation au nom d'un autre adhérent");
            }
        }

        // Vérifier que le livre existe
        Books livre = booksRepository.findById(request.getLivreId())
            .orElseThrow(() -> new NotFoundException(
                "Livre non trouvé avec l'id: " + request.getLivreId()));

        // RG-01 : on ne peut réserver qu'un livre indisponible (emprunté)
        boolean isBorrowed = borrowRepository.existsByBookIdAndReturnDateIsNull(request.getLivreId());
        if (!isBorrowed) {
            throw new ConflictException(
                "RG-01 : Le livre est actuellement disponible — empruntez-le directement");
        }

        // RG-02 : un adhérent ne peut avoir qu'une seule réservation active sur le même livre
        boolean alreadyReserved = reservationRepository
            .existsByAdherentUserIdAndLivreBookIdAndStatutIn(
                adherent.getUserId(), request.getLivreId(), ACTIFS);
        if (alreadyReserved) {
            throw new ConflictException(
                "RG-02 : Vous avez déjà une réservation active sur ce livre");
        }

        // RG-03 : max 3 réservations actives simultanées
        long activeCount = reservationRepository
            .countByAdherentUserIdAndStatutIn(adherent.getUserId(), ACTIFS);
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
     *
     * RS-05 : un ADHERENT ne voit que ses propres réservations, quel que soit
     * le paramètre adherentId envoyé. Un BIBLIOTHECAIRE voit tout.
     */
    public List<ReservationResponse> getAllReservations(StatutReservation statut, Integer adherentId) {
        if (!currentUserService.isBibliothecaire()) {
            // RS-05 : filtrage forcé sur l'identité du token
            adherentId = currentUserService.getCurrentUser().getUserId();
        }

        List<Reservation> reservations;

        if (adherentId != null && !usersRepository.existsById(adherentId)) {
            throw new NotFoundException("Adhérent non trouvé avec l'id: " + adherentId);
        }

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
     *
     * RS-03 : un ADHERENT ne peut consulter que ses propres réservations (403 sinon).
     */
    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Réservation non trouvée avec l'id: " + id));
        checkOwnership(reservation);
        return toResponse(reservation);
    }

    /**
     * PATCH /api/reservations/{id}/annuler — Annuler
     * RG-05, RG-06
     *
     * RS-03 : un ADHERENT ne peut annuler que ses propres réservations (403 sinon).
     */
    @Transactional
    public ReservationResponse annulerReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Réservation non trouvée avec l'id: " + id));

        checkOwnership(reservation);

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
     * Endpoint réservé au BIBLIOTHECAIRE (contrôlé par @PreAuthorize côté contrôleur).
     */
    @Transactional
    public void deleteReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Réservation non trouvée avec l'id: " + id));
        reservationRepository.delete(reservation);
    }

    /**
     * CONFIRMER UN EMPRUNT — BIBLIOTHECAIRE uniquement.
     * Quand un livre est devenu DISPONIBLE (retourné), l'administrateur
     * confirme l'emprunt au nom de l'adhérent réservataire :
     *   1. Crée un emprunt (Borrow) pour l'adhérent
     *   2. Décrémente le nombre de copies disponibles
     *   3. Passe le statut de la réservation à HONOREE
     */
    @Transactional
    public ReservationResponse confirmBorrow(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Réservation non trouvée avec l'id: " + id));

        if (reservation.getStatut() != StatutReservation.DISPONIBLE) {
            throw new ConflictException(
                "Seule une réservation DISPONIBLE peut être confirmée (statut actuel: "
                + reservation.getStatut() + ")");
        }

        Books livre = booksRepository.findById(reservation.getLivre().getBookId())
            .orElseThrow(() -> new NotFoundException(
                "Livre non trouvé avec l'id: " + reservation.getLivre().getBookId()));

        if (livre.getNoOfCopies() < 1) {
            throw new ConflictException(
                "Aucun exemplaire du livre « " + livre.getBookName() + " » n'est disponible");
        }

        Borrow borrow = new Borrow();
        borrow.setBookId(reservation.getLivre().getBookId());
        borrow.setUserId(reservation.getAdherent().getUserId());
        borrow.setIssueDate(new java.util.Date());
        Calendar c = Calendar.getInstance();
        c.setTime(borrow.getIssueDate());
        c.add(Calendar.DATE, 7);
        borrow.setDueDate(c.getTime());
        borrowRepository.save(borrow);

        livre.borrowBook();
        booksRepository.save(livre);

        reservation.setStatut(StatutReservation.HONOREE);
        Reservation confirmed = reservationRepository.save(reservation);
        return toResponse(confirmed);
    }

    // ─── Sécurité ──────────────────────────────────────────────────────────────

    /**
     * RS-03 : si l'utilisateur connecté est un ADHERENT, la réservation doit lui appartenir.
     * Un BIBLIOTHECAIRE a accès à toutes les réservations.
     */
    private void checkOwnership(Reservation reservation) {
        if (currentUserService.isBibliothecaire()) {
            return;
        }
        Users currentUser = currentUserService.getCurrentUser();
        if (!reservation.getAdherent().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException(
                "RS-03 : Vous n'avez accès qu'à vos propres réservations");
        }
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
