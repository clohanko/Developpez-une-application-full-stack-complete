package com.openclassrooms.mddapi.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    // On garde le nom "email" pour compatibilité front,
    // mais on valide: email OU username (3–50, [a-zA-Z0-9._-])
    @NotBlank
    @Size(min = 3, max = 100)
    @Pattern(
            regexp = "^(?:[^\\s@]+@[^\\s@]+\\.[^\\s@]+|[A-Za-z0-9._-]{3,50})$",
            message = "Identifiant invalide : saisissez un e-mail valide ou un nom d’utilisateur (3–50 caractères, lettres/chiffres/._-)."
    )
    private String email;

    @NotBlank
    private String password;

    // Getters / Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
