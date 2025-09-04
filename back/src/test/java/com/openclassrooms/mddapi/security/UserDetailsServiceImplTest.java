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
    void loadUserByUsername_returnsDetails_whenUserExists_byEmail_ignoreCase() {
        // arrange
        User u = new User();
        u.setEmail("seb@example.com");
        u.setUsername("seb");
        u.setPassword("HASH");

        when(userRepository.findByEmailIgnoreCase("Seb@Example.com")).thenReturn(Optional.of(u));

        // act
        UserDetails details = service.loadUserByUsername("Seb@Example.com");

        // assert
        assertThat(details.getUsername()).isEqualTo("seb@example.com");
        assertThat(details.getPassword()).isEqualTo("HASH");
        verify(userRepository).findByEmailIgnoreCase("Seb@Example.com");
        verify(userRepository, never()).findByUsernameIgnoreCase(any());
    }

    @Test
    void loadUserByUsername_returnsDetails_whenUserExists_byUsername_ignoreCase() {
        // arrange
        User u = new User();
        u.setEmail("seb@example.com");
        u.setUsername("seb");
        u.setPassword("HASH");

        when(userRepository.findByEmailIgnoreCase("SeB")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("SeB")).thenReturn(Optional.of(u));

        // act
        UserDetails details = service.loadUserByUsername("SeB");

        // assert
        assertThat(details.getUsername()).isEqualTo("seb@example.com");
        assertThat(details.getPassword()).isEqualTo("HASH");
        verify(userRepository).findByEmailIgnoreCase("SeB");
        verify(userRepository).findByUsernameIgnoreCase("SeB");
    }

    @Test
    void loadUserByUsername_throws_whenMissing() {
        // arrange
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        // act + assert
        assertThatThrownBy(() -> service.loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("Aucun utilisateur");

        verify(userRepository).findByEmailIgnoreCase("missing@example.com");
        verify(userRepository).findByUsernameIgnoreCase("missing@example.com");
    }
}
