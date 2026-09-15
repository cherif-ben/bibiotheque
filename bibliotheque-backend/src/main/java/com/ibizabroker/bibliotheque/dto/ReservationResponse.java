package com.ibizabroker.bibliotheque.dto;

import com.ibizabroker.bibliotheque.enums.StatutReservation;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    private Long id;
    private Integer livreId;
    private String livreTitre;
    private Integer adherentId;
    private String adherentNom;
    private LocalDateTime dateReservation;
    private LocalDateTime dateExpiration;
    private StatutReservation statut;
}
