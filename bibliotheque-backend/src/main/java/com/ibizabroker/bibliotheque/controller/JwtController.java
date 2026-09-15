package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.entity.JwtRequest;
import com.ibizabroker.bibliotheque.entity.JwtResponse;
import com.ibizabroker.bibliotheque.service.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
//@RequestMapping("/")
@Tag(name = "Authentification", description = "Connexion et obtention d'un token JWT")
public class JwtController {

    @Autowired
    private JwtService jwtService;

    @PostMapping("/authenticate")
    @Operation(summary = "S'authentifier", description = "Vérifie les identifiants fournis et retourne un token JWT utilisable dans l'en-tête Authorization: Bearer <token>.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Authentification réussie : le token JWT et les informations de l'utilisateur sont retournés."),
        @ApiResponse(responseCode = "401", description = "Authentification échouée : identifiant ou mot de passe incorrect, compte désactivé ou token impossible à créer.")
    })
    public JwtResponse createJwtToken(@RequestBody JwtRequest jwtRequest) throws Exception {
        return jwtService.createJwtToken(jwtRequest);
    }
}