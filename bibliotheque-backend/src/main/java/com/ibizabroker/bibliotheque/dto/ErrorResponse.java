package com.ibizabroker.bibliotheque.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class ErrorResponse {

    private String message;
    private String action;
    private Map<String, String> details;
}
