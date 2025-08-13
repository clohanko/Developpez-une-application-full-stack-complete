package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.payload.request.UpdatePasswordRequest;
import com.openclassrooms.mddapi.payload.request.UpdateUserRequest;
import com.openclassrooms.mddapi.payload.response.UserResponseDTO;
import com.openclassrooms.mddapi.repository.UserRepository;
import com.openclassrooms.mddapi.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.openclassrooms.mddapi.service.UserService;

import java.security.Principal;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService; //

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        UserResponseDTO response = new UserResponseDTO(user.getUsername(), user.getEmail());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateUserRequest request, Principal principal) {
        userService.updateProfile(principal.getName(), request);
        return ResponseEntity.ok("Profil mis à jour");
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> updatePassword(@Valid @RequestBody UpdatePasswordRequest request, Principal principal) {
        userService.updatePassword(principal.getName(), request);
        return ResponseEntity.ok("Mot de passe mis à jour");
    }
}