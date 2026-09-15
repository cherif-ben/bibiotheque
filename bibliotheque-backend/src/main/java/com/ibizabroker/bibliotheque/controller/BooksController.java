package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin({"http://localhost:3000", "http://localhost:4200"})
@RestController
@RequestMapping("/admin")
@Tag(name = "Livres", description = "Consultation et administration du catalogue de livres")
public class BooksController {

    @Autowired
    private BooksRepository booksRepository;

    @GetMapping("/books")
    @Operation(summary = "Lister les livres", description = "Retourne tous les livres disponibles dans le catalogue.")
    @ApiResponse(responseCode = "200", description = "La liste des livres a été retournée avec succès.")
    public List<Books> getAllBooks(){
        return booksRepository.findAll();
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @GetMapping("/books/{id}")
    @Operation(summary = "Consulter un livre", description = "Retourne le détail d'un livre identifié par son identifiant. Réservé au rôle BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Le livre a été trouvé et retourné."),
        @ApiResponse(responseCode = "401", description = "Authentification requise : le token JWT est absent, invalide ou expiré."),
        @ApiResponse(responseCode = "403", description = "Accès refusé : le rôle BIBLIOTHECAIRE est requis."),
        @ApiResponse(responseCode = "404", description = "Aucun livre ne correspond à cet identifiant.")
    })
    public ResponseEntity<Books> getBookById(@Parameter(description = "Identifiant unique du livre", required = true) @PathVariable Integer id) {
        Books book = booksRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable : aucun livre ne possède l'identifiant " + id + "."));
        return ResponseEntity.ok(book);
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @PostMapping("/books")
    @Operation(summary = "Créer un livre", description = "Ajoute un nouveau livre au catalogue. Réservé au rôle BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Le livre a été créé et retourné."),
        @ApiResponse(responseCode = "400", description = "Les informations du livre sont invalides ou incomplètes."),
        @ApiResponse(responseCode = "401", description = "Authentification requise : le token JWT est absent, invalide ou expiré."),
        @ApiResponse(responseCode = "403", description = "Accès refusé : le rôle BIBLIOTHECAIRE est requis.")
    })
    public Books createBook(@RequestBody Books book) {
        return booksRepository.save(book);
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @PutMapping("/books/{id}")
    @Operation(summary = "Modifier un livre", description = "Met à jour les informations d'un livre existant. Réservé au rôle BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Le livre a été modifié et retourné."),
        @ApiResponse(responseCode = "400", description = "Les informations fournies sont invalides ou incomplètes."),
        @ApiResponse(responseCode = "401", description = "Authentification requise : le token JWT est absent, invalide ou expiré."),
        @ApiResponse(responseCode = "403", description = "Accès refusé : le rôle BIBLIOTHECAIRE est requis."),
        @ApiResponse(responseCode = "404", description = "Aucun livre ne correspond à cet identifiant.")
    })
    public ResponseEntity<Books> updateBook(@Parameter(description = "Identifiant unique du livre", required = true) @PathVariable Integer id, @RequestBody Books bookDetails) {
        Books book = booksRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable : aucun livre ne possède l'identifiant " + id + "."));

        book.setBookName(bookDetails.getBookName());
        book.setBookAuthor(bookDetails.getBookAuthor());
        book.setBookGenre(bookDetails.getBookGenre());
        book.setNoOfCopies(bookDetails.getNoOfCopies());

        Books updatedBook = booksRepository.save(book);
        return ResponseEntity.ok(updatedBook);
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @DeleteMapping("/books/{id}")
    @Operation(summary = "Supprimer un livre", description = "Supprime un livre du catalogue. Réservé au rôle BIBLIOTHECAIRE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Le livre a été supprimé. Le corps contient {\"deleted\": true}."),
        @ApiResponse(responseCode = "401", description = "Authentification requise : le token JWT est absent, invalide ou expiré."),
        @ApiResponse(responseCode = "403", description = "Accès refusé : le rôle BIBLIOTHECAIRE est requis."),
        @ApiResponse(responseCode = "404", description = "Aucun livre ne correspond à cet identifiant.")
    })
    public ResponseEntity<Map<String, Boolean>> deleteBook(@Parameter(description = "Identifiant unique du livre", required = true) @PathVariable Integer id) {
        Books book = booksRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable : aucun livre ne possède l'identifiant " + id + "."));

        booksRepository.delete(book);
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        return ResponseEntity.ok(response);
    }
}
