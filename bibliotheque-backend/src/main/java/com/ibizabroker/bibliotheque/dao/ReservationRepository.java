package com.ibizabroker.bibliotheque.dao;

import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.enums.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // RG-02: vérifier si une réservation active existe pour un livre et un adhérent
    boolean existsByAdherentUserIdAndLivreBookIdAndStatutIn(
        Integer adherentId,
        Integer livreId,
        List<StatutReservation> statuts
    );

    // RG-03: compter les réservations actives d'un adhérent
    long countByAdherentUserIdAndStatutIn(
        Integer adherentId,
        List<StatutReservation> statuts
    );

    // Lister les réservations par statut
    List<Reservation> findByStatut(StatutReservation statut);

    // Lister les réservations par adhérent
    List<Reservation> findByAdherentUserId(Integer adherentId);

    // Lister les réservations par adhérent et statut
    List<Reservation> findByAdherentUserIdAndStatut(Integer adherentId, StatutReservation statut);

    // Lister les réservations expirées (dateExpiration < maintenant et statut EN_ATTENTE)
    List<Reservation> findByStatutAndDateExpirationBefore(
        StatutReservation statut,
        LocalDateTime date
    );

    // Lister les réservations actives (EN_ATTENTE ou DISPONIBLE)
    @Query("SELECT r FROM Reservation r WHERE r.statut IN :statuts")
    List<Reservation> findByStatutIn(@Param("statuts") List<StatutReservation> statuts);
}
