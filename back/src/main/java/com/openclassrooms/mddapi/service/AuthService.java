package com.openclassrooms.mddapi.service;

import com.openclassrooms.mddapi.payload.request.LoginRequest;
import com.openclassrooms.mddapi.payload.request.RegisterRequest;
import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.repository.UserRepository;
import com.openclassrooms.mddapi.security.JwtUtils;

import com.openclassrooms.mddapi.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private AuthenticationManager authenticationManager;

    public String register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return "Erreur: nom d'utilisateur déjà pris.";
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Erreur: email déjà utilisé.";
        }

        // Encodage du mot de passe
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        System.out.println("Mot de passe encodé (debug): " + hashedPassword); // à retirer en prod

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                hashedPassword
        );

        userRepository.save(user);
        return "Utilisateur enregistré avec succès !";
    }

    public String login(LoginRequest request) {
        System.out.println("Tentative de login avec : " + request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return jwtUtils.generateJwt(userDetails.getUsername());
    }
}
