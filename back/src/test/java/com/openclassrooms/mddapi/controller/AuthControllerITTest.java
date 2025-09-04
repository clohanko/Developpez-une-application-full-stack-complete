package com.openclassrooms.mddapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclassrooms.mddapi.config.TestSecurityConfig;
import com.openclassrooms.mddapi.payload.request.RegisterRequest;
import com.openclassrooms.mddapi.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class AuthControllerITTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    @org.springframework.boot.test.mock.mockito.MockBean
    AuthService authService;

    @Test
    void registerUser_returnsOk_withServiceMessage() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("seb");
        req.setEmail("seb@example.com");
        req.setPassword("Abcd1234!"); // ✅ mot de passe conforme (8+, maj, min, chiffre, spécial)

        when(authService.register(any(RegisterRequest.class))).thenReturn("Utilisateur enregistré");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string("Utilisateur enregistré"));
    }

    @Test
    void logoutUser_setsExpiredHttpOnlyCookie() throws Exception {
        mvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("token=")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Déconnexion réussie")));
    }
}
