package com.ibizabroker.bibliotheque.configuration;

import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Users;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

/**
 * Fournit l'identité de l'utilisateur connecté, dérivée du token JWT
 * (jamais du corps de la requête — cf. règle RS-04).
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    public static final String ROLE_BIBLIOTHECAIRE = "ROLE_BIBLIOTHECAIRE";

    private final UsersRepository usersRepository;

    /** L'utilisateur authentifié, chargé depuis la base via le username du token. */
    public Users getCurrentUser() {
        String username = getCurrentUsername();
        return usersRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalStateException(
                "Utilisateur connecté introuvable en base: " + username));
    }

    /** Le username stocké comme subject du token JWT. */
    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Aucun utilisateur authentifié");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }

    /** True si l'utilisateur connecté porte le rôle BIBLIOTHECAIRE. */
    public boolean isBibliothecaire() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (ROLE_BIBLIOTHECAIRE.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
