package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Users;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4200"})
@RestController
@RequestMapping("/api")
@Tag(name = "Utilisateurs publics", description = "Données utilisateur non sensibles destinées aux formulaires")
public class UsersController {

    @Autowired
    private UsersRepository usersRepository;

    @GetMapping("/users")
    @Operation(summary = "Lister les utilisateurs pour les formulaires", description = "Retourne les utilisateurs nécessaires aux formulaires, sans exposer leur mot de passe.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "La liste des utilisateurs sans mot de passe a été retournée avec succès.")
    })
    public List<Users> getAllUsers() {
        List<Users> users = usersRepository.findAll();
        // Ne pas renvoyer les mots de passe
        users.forEach(u -> u.setPassword(null));
        return users;
    }
}
