package com.ibizabroker.bibliotheque.exceptions;

import com.ibizabroker.bibliotheque.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Gestion des erreurs de validation (400)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(new ErrorResponse(
            "La requête est invalide : certains champs sont absents ou incorrects.",
            "Corrigez les champs indiqués dans details, puis envoyez à nouveau la requête.",
            errors));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage(),
            "Vérifiez l'identifiant envoyé et sélectionnez une ressource existante.");
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage(),
            "Modifiez votre demande selon la règle indiquée, puis réessayez.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage(),
            "Utilisez votre propre ressource ou connectez-vous avec un compte BIBLIOTHECAIRE.");
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message, String action) {
        return ResponseEntity.status(status.value()).body(new ErrorResponse(message, action, null));
    }
}
