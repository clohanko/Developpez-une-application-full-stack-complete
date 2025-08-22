package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.payload.request.UpdatePasswordRequest;
import com.openclassrooms.mddapi.payload.request.UpdateUserRequest;
import com.openclassrooms.mddapi.payload.response.UserResponseDTO;
import com.openclassrooms.mddapi.repository.UserRepository;
import com.openclassrooms.mddapi.security.UserDetailsImpl;
import com.openclassrooms.mddapi.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock UserRepository userRepository;
    @Mock UserService userService;

    @InjectMocks UserController controller; // Mockito injecte les @Autowired

    /* =================== GET /api/user/me =================== */

    @Test
    void getCurrentUser_returns200_withBody_whenUserFound() {
        // given
        UserDetailsImpl details = mock(UserDetailsImpl.class);
        when(details.getUsername()).thenReturn("seb@example.com");

        User u = new User();
        u.setUsername("seb");
        u.setEmail("seb@example.com");
        when(userRepository.findByEmail("seb@example.com")).thenReturn(Optional.of(u));

        // when
        ResponseEntity<?> resp = controller.getCurrentUser(details);

        // then
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isInstanceOf(UserResponseDTO.class);
        UserResponseDTO dto = (UserResponseDTO) resp.getBody();
        assertThat(dto.getUsername()).isEqualTo("seb");
        assertThat(dto.getEmail()).isEqualTo("seb@example.com");
    }

    @Test
    void getCurrentUser_returns404_whenUserNotFound() {
        UserDetailsImpl details = mock(UserDetailsImpl.class);
        when(details.getUsername()).thenReturn("missing@example.com");
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        ResponseEntity<?> resp = controller.getCurrentUser(details);

        assertThat(resp.getStatusCode().value()).isEqualTo(404);
        assertThat(resp.getBody()).isNull();
    }

    /* =================== PUT /api/user/me =================== */

    @Test
    void updateProfile_delegatesToService_andReturns200() {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setUsername("newName");
        req.setEmail("new@example.com");

        Principal principal = () -> "seb@example.com";

        ResponseEntity<?> resp = controller.updateProfile(req, principal);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isEqualTo("Profil mis à jour");
        verify(userService).updateProfile("seb@example.com", req);
    }

    /* =========== PUT /api/user/me/password =========== */

    @Test
    void updatePassword_delegatesToService_andReturns200() {
        UpdatePasswordRequest req = new UpdatePasswordRequest();
        req.setOldPassword("old");
        req.setNewPassword("new");

        Principal principal = () -> "seb@example.com";

        ResponseEntity<?> resp = controller.updatePassword(req, principal);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isEqualTo("Mot de passe mis à jour");
        verify(userService).updatePassword("seb@example.com", req);
    }
}
