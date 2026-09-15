package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.BorrowRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Borrow;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.*;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Repository
@RestController
@RequestMapping("/borrow")
@Tag(name = "Emprunts", description = "Création, consultation et retour des emprunts de livres")
public class BorrowController {

    @Autowired
    private BorrowRepository borrowRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private BooksRepository booksRepository;

    @PostMapping
    @Operation(summary = "Emprunter un livre", description = "Enregistre un emprunt et fixe automatiquement sa date d'échéance à 7 jours. Le livre doit avoir au moins un exemplaire disponible.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Emprunt enregistré avec succès, avec un message de confirmation."),
        @ApiResponse(responseCode = "400", description = "Les données de l'emprunt sont invalides ou incomplètes."),
        @ApiResponse(responseCode = "404", description = "L'utilisateur ou le livre indiqué n'existe pas."),
        @ApiResponse(responseCode = "409", description = "Aucun exemplaire du livre n'est actuellement disponible.")
    })
    public String borrowBook(@RequestBody Borrow borrow) {
        Users user = usersRepository.findById(borrow.getUserId())
            .orElseThrow(() -> new NotFoundException(
                "Emprunt impossible : l'utilisateur " + borrow.getUserId() + " est introuvable."));
        Books book = booksRepository.findById(borrow.getBookId())
            .orElseThrow(() -> new NotFoundException(
                "Emprunt impossible : le livre " + borrow.getBookId() + " est introuvable."));

        if (book.getNoOfCopies() < 1) {
            return "Emprunt refusé : le livre « " + book.getBookName()
                + " » n'est plus disponible. Action : attendez son retour ou choisissez un autre livre.";
        }

        book.borrowBook();
        booksRepository.save(book);

        Date currentDate = new Date();
        Date overdueDate = new Date();
        Calendar c = Calendar.getInstance();
        c.setTime(overdueDate);
        c.add(Calendar.DATE, 7);
        overdueDate = c.getTime();
        borrow.setIssueDate(currentDate);
        borrow.setDueDate(overdueDate);
        borrowRepository.save(borrow);
        return "Emprunt confirmé pour " + user.getName() + " : une copie de « "
            + book.getBookName() + " » a été enregistrée. Action : retournez le livre avant le "
            + overdueDate + ".";
    }

    @GetMapping
    @Operation(summary = "Lister tous les emprunts", description = "Retourne l'historique complet des emprunts enregistrés.")
    @ApiResponse(responseCode = "200", description = "La liste des emprunts a été retournée avec succès.")
    public List<Borrow> getAllBorrow() {
        return borrowRepository.findAll();
    }

    @PutMapping
    @Operation(summary = "Enregistrer le retour d'un livre", description = "Marque un emprunt comme retourné, renseigne la date de retour et restaure un exemplaire disponible.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Le retour a été enregistré avec succès."),
        @ApiResponse(responseCode = "400", description = "Les données du retour sont invalides ou incomplètes."),
        @ApiResponse(responseCode = "404", description = "L'emprunt ou le livre associé n'existe pas.")
    })
    public Borrow returnBook(@RequestBody Borrow borrow) {
        Borrow borrowBook = borrowRepository.findById(borrow.getBorrowId())
            .orElseThrow(() -> new NotFoundException(
                "Retour impossible : l'emprunt " + borrow.getBorrowId() + " est introuvable."));
        Books book = booksRepository.findById(borrowBook.getBookId())
            .orElseThrow(() -> new NotFoundException(
                "Retour impossible : le livre " + borrowBook.getBookId() + " est introuvable."));

        book.returnBook();
        booksRepository.save(book);

        Date currentDate = new Date();
        borrowBook.setReturnDate(currentDate);
        return borrowRepository.save(borrowBook);
    }

    @GetMapping("user/{id}")
    @Operation(summary = "Lister les emprunts d'un utilisateur", description = "Retourne tous les emprunts associés à l'utilisateur indiqué.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "La liste des emprunts de l'utilisateur a été retournée."),
        @ApiResponse(responseCode = "404", description = "Aucun utilisateur ne correspond à cet identifiant.")
    })
    public List<Borrow> booksBorrowedByUser(@Parameter(description = "Identifiant unique de l'utilisateur", required = true) @PathVariable Integer id) {
        return borrowRepository.findByUserId(id);
    }

    @GetMapping("book/{id}")
    @Operation(summary = "Consulter l'historique d'un livre", description = "Retourne tous les emprunts enregistrés pour le livre indiqué.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "L'historique des emprunts du livre a été retourné."),
        @ApiResponse(responseCode = "404", description = "Aucun livre ne correspond à cet identifiant.")
    })
    public List<Borrow> bookBorrowHistory(@Parameter(description = "Identifiant unique du livre", required = true) @PathVariable Integer id) {
        return borrowRepository.findByBookId(id);
    }


//    @Autowired
//    private EntityManager entityManager;
//
//    @PostMapping
//    public Borrow borrowBook(@RequestBody Borrow borrow) {
//        borrowRepository.save(borrow);
//        Books book = booksRepository.findById(borrow.getBOOKID()).orElseThrow(() -> new NotFoundException("Book not found."));
//        if(book.getNoOfCopies()-1 < 0) {
//            throw new IllegalStateException("There are no available books.");
//        }
//        book.borrowBook();
//        booksRepository.save(book);
//
//        return borrow;
//    }
//
//    @GetMapping
//    public List<Borrow> getAllBorrow() {
//        return borrowRepository.findAll();
//    }
//
//    @PutMapping
//    public Borrow returnBook(@RequestBody Borrow borrow) {
//        borrowRepository.save(borrow);
//        Books book = booksRepository.findById(borrow.getBOOKID()).orElseThrow(() -> new NotFoundException("Book not found."));
//        book.returnBook();
//        booksRepository.save(book);
//
//        Date currentDate = new Date(new java.util.Date().getTime());
//        borrow.setReturnDate(currentDate);
//        return borrow;
//    }
//
//    @GetMapping("user/{id}")
//    public List<Books> booksBorrowedByUser(@PathVariable Integer id) {
//        Query q = entityManager.createNativeQuery("SELECT * FROM BOOKS AS B, BORROW AS L WHERE B.book_id = L.BOOKID AND L.USERID = " + id);
//        List<Books> borrowedBooks = q.getResultList();
//        return borrowedBooks;
//    }
//
//    @GetMapping("book/{id}")
//    public List<Users> bookBorrowHistory(@PathVariable Integer id) {
//        Query q = entityManager.createNativeQuery("SELECT * FROM USERS AS U, BORROW AS L WHERE U.user_id = L.USERID AND L.BOOKID = " + id);
//        List<Users> usersList = q.getResultList();
//        return usersList;
//    }

//    @PostMapping
//    public Borrow borrowBook(@RequestBody Borrow borrow) {
//        borrow(borrow.getBorrowId(), borrow.getUser().getUserId(), borrow.getBook().getBookId());
//        return borrow;
//    }
//
//    @GetMapping
//    public List<Borrow> getAllBorrow() {
//        return borrowRepository.findAll();
//    }
//
//    @PutMapping
//    public Borrow returnBook(@RequestBody Borrow borrow) {
//        Books book = booksRepository.findById(borrow.getBook().getBookId()).orElseThrow(() -> new NotFoundException("Book not found."));
//        book.returnBook();
//        booksRepository.save(book);
//
//        Date currentDate = new Date(new java.util.Date().getTime());
//        borrow.setReturnDate(currentDate);
//        return borrowRepository.save(borrow);
//    }
//
//    @GetMapping("user/{id}")
//    public List<Books> booksBorrowedByUser(@PathVariable Integer id) {
//        Users user = usersRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found."));
//        return user.getBooks();
//    }
//
//    @GetMapping("book/{id}")
//    public List<Users> bookBorrowHistory(@PathVariable Integer id) {
//        Books book = booksRepository.findById(id).orElseThrow(() -> new NotFoundException("Book not found."));
//        return book.getUsers();
//    }
//
//    public void borrow(Integer borrowId, Integer userId, Integer bookId) {
//        Users user = usersRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
//        if(user.getBooks().stream().anyMatch(book -> Objects.equals(book.getBookId(), bookId))) {
//            throw new IllegalStateException("User already borrowed the book");
//        }
//
//        Books book = booksRepository.findById(bookId).orElseThrow(() -> new NotFoundException("Book not found."));
//        if(book.getNoOfCopies()-1 < 0) {
//            throw new IllegalStateException("There are no available books.");
//        }
//
//        book.getUsers().add(user);
//        book.setNoOfCopies(book.getNoOfCopies()-1);
//        booksRepository.save(book);
//
//        user.getBooks().add(book);
//        usersRepository.save(user);
//    }

}
