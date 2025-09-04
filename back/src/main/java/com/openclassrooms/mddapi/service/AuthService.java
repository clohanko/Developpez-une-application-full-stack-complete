package com.openclassrooms.mddapi.service;

import com.openclassrooms.mddapi.payload.request.LoginRequest;
import com.openclassrooms.mddapi.payload.request.RegisterRequest;
import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.repository.UserRepository;
import com.openclassrooms.mddapi.security.JwtUtils;
import com.openclassrooms.mddapi.security.UserDetailsImpl;
import com.openclassrooms.mddapi.security.PasswordValidator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private PasswordValidator passwordValidator;

    @Transactional
    public String register(RegisterRequest request) {

        final String username = request.getUsername().trim();
        final String email    = request.getEmail().trim().toLowerCase();
        final String password = request.getPassword();

        // Règle de complexité (barrière métier)
        try {
            passwordValidator.check(password);
        } catch (IllegalArgumentException ex) {
            return "Erreur: " + ex.getMessage();
        }

        // Unicité
        if (userRepository.existsByUsername(username)) {
            return "Erreur: nom d'utilisateur déjà pris.";
        }
        if (userRepository.existsByEmailIgnoreCase(email)) { // ✅ appel correct
            return "Erreur: email déjà utilisé.";
        }

        // Encodage + persistance
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User(username, email, hashedPassword);
        userRepository.save(user);

        return "Utilisateur enregistré avec succès !";
    }

    public String login(LoginRequest request) {
        final String email = (request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase());
        final String password = request.getPassword() == null ? "" : request.getPassword();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return jwtUtils.generateJwt(userDetails.getUsername());
    }
}
