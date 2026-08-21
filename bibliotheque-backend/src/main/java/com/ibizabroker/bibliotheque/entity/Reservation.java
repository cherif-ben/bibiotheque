package com.ibizabroker.bibliotheque.entity;

import com.ibizabroker.bibliotheque.enums.StatutReservation;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "livre_id", nullable = false)
    private Books livre;

    @ManyToOne
    @JoinColumn(name = "adherent_id", nullable = false)
    private Users adherent;

    @Column(name = "date_reservation", nullable = false, updatable = false)
    private LocalDateTime dateReservation;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutReservation statut;
}
