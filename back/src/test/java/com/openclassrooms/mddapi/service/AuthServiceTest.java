package com.openclassrooms.mddapi.service;

import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.payload.request.LoginRequest;
import com.openclassrooms.mddapi.payload.request.RegisterRequest;
import com.openclassrooms.mddapi.repository.UserRepository;
import com.openclassrooms.mddapi.security.JwtUtils;
import com.openclassrooms.mddapi.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository = mock(UserRepository.class);
    private PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private JwtUtils jwtUtils = mock(JwtUtils.class);
    private AuthenticationManager authenticationManager = mock(AuthenticationManager.class);

    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService();
        // injection par réflexion si pas de constructeur (sinon préfère un constructeur)
        // ou utilise un framework (ex: @InjectMocks), mais gardons simple :
        try {
            var f1 = AuthService.class.getDeclaredField("userRepository");
            f1.setAccessible(true); f1.set(service, userRepository);
            var f2 = AuthService.class.getDeclaredField("passwordEncoder");
            f2.setAccessible(true); f2.set(service, passwordEncoder);
            var f3 = AuthService.class.getDeclaredField("jwtUtils");
            f3.setAccessible(true); f3.set(service, jwtUtils);
            var f4 = AuthService.class.getDeclaredField("authenticationManager");
            f4.setAccessible(true); f4.set(service, authenticationManager);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    @Test
    void register_shouldRejectDuplicateUsernameOrEmail() {
        var req = new RegisterRequest();
        req.setUsername("seb");
        req.setEmail("seb@example.com");
        req.setPassword("pwd");

        when(userRepository.existsByUsername("seb")).thenReturn(true);

        String msg = service.register(req);

        assertThat(msg).contains("déjà pris");
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldEncodePasswordAndSave() {
        var req = new RegisterRequest();
        req.setUsername("seb");
        req.setEmail("seb@example.com");
        req.setPassword("pwd");

        when(userRepository.existsByUsername("seb")).thenReturn(false);
        when(userRepository.existsByEmail("seb@example.com")).thenReturn(false);
        when(passwordEncoder.encode("pwd")).thenReturn("ENCODED");

        String msg = service.register(req);

        assertThat(msg.toLowerCase()).contains("succès");
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("ENCODED");
    }

    @Test
    void login_shouldAuthenticateAndReturnJwt() {
        var req = new LoginRequest();
        req.setEmail("seb@example.com");
        req.setPassword("pwd");

        var principal = mock(UserDetailsImpl.class);
        when(principal.getUsername()).thenReturn("seb@example.com");

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);
        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        )).thenReturn(auth);

        when(jwtUtils.generateJwt("seb@example.com")).thenReturn("JWT123");

        String token = service.login(req);

        assertThat(token).isEqualTo("JWT123");
        verify(authenticationManager).authenticate(any());
        verify(jwtUtils).generateJwt("seb@example.com");
    }
}
