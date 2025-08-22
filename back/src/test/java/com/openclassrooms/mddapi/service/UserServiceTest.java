package com.openclassrooms.mddapi.service;

import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.payload.request.UpdatePasswordRequest;
import com.openclassrooms.mddapi.payload.request.UpdateUserRequest;
import com.openclassrooms.mddapi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks UserService service;

    /* ======================== updateProfile ======================== */

    @Test
    void updateProfile_shouldUpdateUsernameAndEmail_andSave() {
        // given
        String email = "old@example.com";
        User user = new User();
        user.setUsername("oldName");
        user.setEmail(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setUsername("newName");
        req.setEmail("new@example.com");

        // when
        service.updateProfile(email, req);

        // then
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo("newName");
        assertThat(saved.getEmail()).isEqualTo("new@example.com");
    }

    @Test
    void updateProfile_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        UpdateUserRequest req = new UpdateUserRequest();
        req.setUsername("x");
        req.setEmail("y@example.com");

        assertThatThrownBy(() -> service.updateProfile("missing@example.com", req))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("Utilisateur introuvable");

        verify(userRepository, never()).save(any());
    }

    /* ======================== updatePassword ======================== */

    @Test
    void updatePassword_shouldMatchOldPassword_encodeNew_andSave() {
        // given
        String email = "seb@example.com";
        User user = new User();
        user.setEmail(email);
        user.setPassword("HASHED_OLD");
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPwd", "HASHED_OLD")).thenReturn(true);
        when(passwordEncoder.encode("newPwd")).thenReturn("HASHED_NEW");

        UpdatePasswordRequest req = new UpdatePasswordRequest();
        req.setOldPassword("oldPwd");
        req.setNewPassword("newPwd");

        // when
        service.updatePassword(email, req);

        // then
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("HASHED_NEW");
        verify(passwordEncoder).matches("oldPwd", "HASHED_OLD");
        verify(passwordEncoder).encode("newPwd");
    }

    @Test
    void updatePassword_shouldThrow_whenOldPasswordDoesNotMatch() {
        String email = "seb@example.com";
        User user = new User();
        user.setPassword("HASHED_OLD");
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "HASHED_OLD")).thenReturn(false);

        UpdatePasswordRequest req = new UpdatePasswordRequest();
        req.setOldPassword("wrong");
        req.setNewPassword("newPwd");

        assertThatThrownBy(() -> service.updatePassword(email, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ancien mot de passe incorrect");

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void updatePassword_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        UpdatePasswordRequest req = new UpdatePasswordRequest();
        req.setOldPassword("old");
        req.setNewPassword("new");

        assertThatThrownBy(() -> service.updatePassword("missing@example.com", req))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("Utilisateur introuvable");

        verify(userRepository, never()).save(any());
    }
}
