package com.ibizabroker.bibliotheque.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {

    @NotNull(message = "Le champ 'livreId' est obligatoire")
    private Integer livreId;

    @NotNull(message = "Le champ 'adherentId' est obligatoire")
    private Integer adherentId;
}
