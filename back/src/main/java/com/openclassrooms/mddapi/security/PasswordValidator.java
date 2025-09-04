package com.openclassrooms.mddapi.security;

import org.springframework.stereotype.Component;
import java.util.regex.Pattern;

@Component
public class PasswordValidator {
    // ≥8, au moins 1 chiffre, 1 minuscule, 1 majuscule, 1 spécial
    private static final Pattern PWD = Pattern.compile(
            "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_\\-*/?.,;:()\\[\\]{}<>]).{8,}$"
    );

    public boolean isValid(String raw) {
        return raw != null && PWD.matcher(raw).matches();
    }

    public void check(String raw) {
        if (!isValid(raw)) {
            throw new IllegalArgumentException(
                    "Mot de passe invalide : min 8 caractères, et au moins une majuscule, une minuscule, un chiffre et un caractère spécial."
            );
        }
    }
}
