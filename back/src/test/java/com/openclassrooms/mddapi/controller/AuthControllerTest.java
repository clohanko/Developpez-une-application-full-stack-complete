package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.lang.reflect.Field;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {

    private MockMvc mvc;
    private AuthService authService;

    @BeforeEach
    void setUp() throws Exception {
        authService = Mockito.mock(AuthService.class);

        // On instancie le contrôleur SANS Spring
        AuthController controller = new AuthController();

        // Injection du champ privé authService par réflexion
        Field f = AuthController.class.getDeclaredField("authService");
        f.setAccessible(true);
        f.set(controller, authService);

        // Important : ajouter le converter JSON pour @RequestBody
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    void login_setsHttpOnlyCookie_andReturns200() throws Exception {
        Mockito.when(authService.login(Mockito.any())).thenReturn("JWT123");

        String body = """
            {"email":"seb@example.com","password":"pwd"}
        """;

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE,
                        org.hamcrest.Matchers.containsString("token=")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE,
                        org.hamcrest.Matchers.containsString("HttpOnly")));
    }
}
