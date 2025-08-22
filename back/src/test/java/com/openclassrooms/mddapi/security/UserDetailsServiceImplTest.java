package com.openclassrooms.mddapi.security;

import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock UserRepository userRepository;

    @InjectMocks UserDetailsServiceImpl service;

    @Test
    void loadUserByUsername_returnsDetails_whenUserExists() {
        User u = new User();
        u.setEmail("seb@example.com");
        u.setUsername("seb");
        u.setPassword("HASH");
        when(userRepository.findByEmail("seb@example.com")).thenReturn(Optional.of(u));

        UserDetails details = service.loadUserByUsername("seb@example.com");

        assertThat(details.getUsername()).isEqualTo("seb@example.com");
        assertThat(details.getPassword()).isEqualTo("HASH");
        verify(userRepository).findByEmail("seb@example.com");
    }

    @Test
    void loadUserByUsername_throws_whenMissing() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("Aucun utilisateur");

        verify(userRepository).findByEmail("missing@example.com");
    }
}
