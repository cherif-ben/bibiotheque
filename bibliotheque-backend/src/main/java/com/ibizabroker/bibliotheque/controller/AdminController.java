package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.List;

@CrossOrigin({"http://localhost:3000", "http://localhost:4200"})
@RestController
@RequestMapping("/admin")
@Tag(name = "Administration", description = "Gestion des utilisateurs réservée au rôle BIBLIOTHECAIRE")
public class AdminController {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    @PostMapping("/users")
//    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @Operation(summary = "Créer un utilisateur", description = "Crée un utilisateur et chiffre son mot de passe avant l'enregistrement. L'autorisation doit être activée pour réserver cette route au bibliothécaire.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "L'utilisateur a été créé avec succès."),
        @ApiResponse(responseCode = "400", description = "Les informations de l'utilisateur sont invalides ou incomplètes."),
        @ApiResponse(responseCode = "409", description = "Le nom d'utilisateur existe déjà.")
    })
    public Users addUserByAdmin(@RequestBody Users user) {
//        Role role = new Role();
////        role.setRoleName(UserConstant.DEFAULT_ROLE);
//        role.setRoleName(role.getRoleName());
//        Set<Role> setRole = new HashSet<>();
//        setRole.add(role);
//        user.setRole(setRole);
        String password = user.getPassword();
        String encryptPassword = passwordEncoder.encode(password);
        user.setPassword(encryptPassword);
        usersRepository.save(user);
        return user;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @Operation(summary = "Lister les utilisateurs", description = "Retourne tous les utilisateurs enregistrés. Réservé au rôle BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "La liste des utilisateurs a été retournée."),
        @ApiResponse(responseCode = "401", description = "Authentification requise : le token JWT est absent, invalide ou expiré."),
        @ApiResponse(responseCode = "403", description = "Accès refusé : le rôle BIBLIOTHECAIRE est requis.")
    })
    public List<Users> getAllUsers() {
        return usersRepository.findAll();
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @GetMapping("/users/{id}")
    @Operation(summary = "Consulter un utilisateur", description = "Retourne le détail d'un utilisateur. Réservé au rôle BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "L'utilisateur a été trouvé et retourné."),
        @ApiResponse(responseCode = "401", description = "Authentification requise : le token JWT est absent, invalide ou expiré."),
        @ApiResponse(responseCode = "403", description = "Accès refusé : le rôle BIBLIOTHECAIRE est requis."),
        @ApiResponse(responseCode = "404", description = "Aucun utilisateur ne correspond à cet identifiant.")
    })
    public ResponseEntity<Users> getUserById(@Parameter(description = "Identifiant unique de l'utilisateur", required = true) @PathVariable Integer id) {
        Users user = usersRepository.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur introuvable : aucun utilisateur ne possède l'identifiant " + id + "."));
        return ResponseEntity.ok(user);
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @PutMapping("/users/{id}")
    @Operation(summary = "Modifier un utilisateur", description = "Met à jour le nom, le nom d'utilisateur et les rôles d'un utilisateur. Réservé au rôle BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "L'utilisateur a été modifié et retourné."),
        @ApiResponse(responseCode = "400", description = "Les informations fournies sont invalides ou incomplètes."),
        @ApiResponse(responseCode = "401", description = "Authentification requise : le token JWT est absent, invalide ou expiré."),
        @ApiResponse(responseCode = "403", description = "Accès refusé : le rôle BIBLIOTHECAIRE est requis."),
        @ApiResponse(responseCode = "404", description = "Aucun utilisateur ne correspond à cet identifiant.")
    })
    public ResponseEntity<Users> updateUser(@Parameter(description = "Identifiant unique de l'utilisateur", required = true) @PathVariable Integer id, @RequestBody Users userDetails) {
        Users user = usersRepository.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur introuvable : aucun utilisateur ne possède l'identifiant " + id + "."));

        user.setName(userDetails.getName());
        user.setRole(userDetails.getRole());
        user.setUsername(userDetails.getUsername());

        Users updatedUser = usersRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @DeleteMapping("/users/{id}")
    @Transactional
    @Operation(summary = "Supprimer un utilisateur", description = "Supprime un utilisateur par son identifiant. Réservé au rôle BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Utilisateur supprimé avec succès."),
        @ApiResponse(responseCode = "401", description = "Authentification requise : le token JWT est absent, invalide ou expiré."),
        @ApiResponse(responseCode = "403", description = "Accès refusé : le rôle BIBLIOTHECAIRE est requis."),
        @ApiResponse(responseCode = "404", description = "Aucun utilisateur ne correspond à cet identifiant.")
    })
    public ResponseEntity<Void> deleteUser(@Parameter(description = "Identifiant unique de l'utilisateur à supprimer", required = true) @PathVariable Integer id) {
        Users user = usersRepository.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur introuvable : aucun utilisateur ne possède l'identifiant " + id + "."));
        entityManager.createNativeQuery("DELETE FROM user_role WHERE user_id = ?1").setParameter(1, id).executeUpdate();
        usersRepository.delete(user);
        return ResponseEntity.noContent().build();
    }
}
