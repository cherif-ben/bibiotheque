package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.configuration.CurrentUserService;
import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.BorrowRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.dto.ReservationRequest;
import com.ibizabroker.bibliotheque.dto.ReservationResponse;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.enums.StatutReservation;
import com.ibizabroker.bibliotheque.exceptions.ConflictException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires de la règle RG-03 (max 3 réservations actives)
 * sur la couche service — repository simulé (mock), aucune base requise.
 */
@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private BooksRepository booksRepository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private BorrowRepository borrowRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private ReservationService reservationService;

    private Users adherent(int id) {
        Users user = new Users();
        user.setUserId(id);
        user.setUsername("A" + id);
        return user;
    }

    @Test
    void createReservation_succeeds_whenAdherentHasTwoActiveReservations() {
        // Given : un adhérent avec 2 réservations actives (limite RG-03 = 3)
        Users user = adherent(10);
        Books book = new Books();
        book.setBookId(1);
        book.setBookName("Livre emprunté");

        Reservation saved = new Reservation();
        saved.setId(99L);
        saved.setLivre(book);
        saved.setAdherent(user);
        saved.setDateReservation(LocalDateTime.now());
        saved.setDateExpiration(LocalDateTime.now().plusDays(7));
        saved.setStatut(StatutReservation.EN_ATTENTE);

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(currentUserService.isBibliothecaire()).thenReturn(false);
        when(booksRepository.findById(1)).thenReturn(Optional.of(book));
        when(borrowRepository.existsByBookIdAndReturnDateIsNull(1)).thenReturn(true);
        when(reservationRepository.existsByAdherentUserIdAndLivreBookIdAndStatutIn(
                eq(10), eq(1), anyList())).thenReturn(false);
        when(reservationRepository.countByAdherentUserIdAndStatutIn(eq(10), anyList()))
                .thenReturn(2L);
        when(reservationRepository.save(any(Reservation.class))).thenReturn(saved);

        // When : il crée une troisième réservation
        ReservationResponse response =
                reservationService.createReservation(new ReservationRequest(1, 10));

        // Then : la création est acceptée
        assertNotNull(response);
        assertEquals(10, response.getAdherentId());
        assertEquals(StatutReservation.EN_ATTENTE, response.getStatut());

        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        assertEquals(10, captor.getValue().getAdherent().getUserId());
    }

    @Test
    void createReservation_isRefused_whenAdherentAlreadyHasThreeActiveReservations() {
        // Given : un adhérent avec déjà 3 réservations actives
        Users user = adherent(10);
        Books book = new Books();
        book.setBookId(1);

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(currentUserService.isBibliothecaire()).thenReturn(false);
        when(booksRepository.findById(1)).thenReturn(Optional.of(book));
        when(borrowRepository.existsByBookIdAndReturnDateIsNull(1)).thenReturn(true);
        when(reservationRepository.countByAdherentUserIdAndStatutIn(eq(10), anyList()))
                .thenReturn(3L);

        // When / Then : la quatrième réservation est refusée (RG-03)
        assertThrows(ConflictException.class, () -> reservationService.createReservation(
                new ReservationRequest(1, 10)));

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createReservation_succeeds_forAnotherAdherent_whenBibliothecaire() {
        // Given : un BIBLIOTHECAIRE qui réserve pour un autre adhérent
        Users bibliothecaire = adherent(1);
        bibliothecaire.setUsername("bibliothecaire");
        Users targetAdherent = adherent(11);
        targetAdherent.setUsername("A2");
        Books book = new Books();
        book.setBookId(1);
        book.setBookName("Livre emprunté");

        Reservation saved = new Reservation();
        saved.setId(99L);
        saved.setLivre(book);
        saved.setAdherent(targetAdherent);
        saved.setDateReservation(LocalDateTime.now());
        saved.setDateExpiration(LocalDateTime.now().plusDays(7));
        saved.setStatut(StatutReservation.EN_ATTENTE);

        when(currentUserService.isBibliothecaire()).thenReturn(true);
        when(booksRepository.findById(1)).thenReturn(Optional.of(book));
        when(borrowRepository.existsByBookIdAndReturnDateIsNull(1)).thenReturn(true);
        when(usersRepository.findById(11)).thenReturn(Optional.of(targetAdherent));
        when(reservationRepository.existsByAdherentUserIdAndLivreBookIdAndStatutIn(
                eq(11), eq(1), anyList())).thenReturn(false);
        when(reservationRepository.countByAdherentUserIdAndStatutIn(eq(11), anyList()))
                .thenReturn(0L);
        when(reservationRepository.save(any(Reservation.class))).thenReturn(saved);

        // When : le BIBLIOTHECAIRE crée une réservation pour A2 (user_id 11)
        ReservationRequest request = new ReservationRequest(1, 11);
        ReservationResponse response = reservationService.createReservation(request);

        // Then : la création est acceptée et l'adhérent est bien celui du corps
        assertNotNull(response);
        assertEquals(11, response.getAdherentId());
        assertEquals(StatutReservation.EN_ATTENTE, response.getStatut());

        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        assertEquals(11, captor.getValue().getAdherent().getUserId());
        // RS-04 : BIBLIOTHECAIRE utilise l'adherentId du corps (pas celui du token)
    }
}
