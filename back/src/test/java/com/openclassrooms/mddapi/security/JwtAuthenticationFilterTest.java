package com.openclassrooms.mddapi.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock JwtUtils jwtUtils;
    @Mock UserDetailsServiceImpl userDetailsService;

    @InjectMocks JwtAuthenticationFilter filter;

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void noAuthorizationHeader_leavesContextEmpty() throws ServletException, IOException {
        var req = new MockHttpServletRequest(); // pas de header
        var res = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtUtils, userDetailsService);
    }

    @Test
    void nonBearerHeader_leavesContextEmpty() throws Exception {
        var req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Basic abcdef");
        var res = new MockHttpServletResponse();

        filter.doFilter(req, res, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtUtils, userDetailsService);
    }

    @Test
    void bearerToken_emailNull_doesNotAuthenticate() throws Exception {
        var req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer BAD");
        var res = new MockHttpServletResponse();

        when(jwtUtils.getEmailFromJwt("BAD")).thenReturn(null);

        filter.doFilter(req, res, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtUtils).getEmailFromJwt("BAD");
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void bearerToken_emailPresent_butValidateFalse_doesNotAuthenticate() throws Exception {
        var req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer MAYBE");
        var res = new MockHttpServletResponse();

        when(jwtUtils.getEmailFromJwt("MAYBE")).thenReturn("seb@example.com");
        UserDetails details = User.withUsername("seb@example.com").password("x").authorities(List.of()).build();
        when(userDetailsService.loadUserByUsername("seb@example.com")).thenReturn(details);
        when(jwtUtils.validateJwt("MAYBE")).thenReturn(false);

        filter.doFilter(req, res, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtUtils).validateJwt("MAYBE");
    }

    @Test
    void bearerToken_valid_setsAuthentication() throws Exception {
        var req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer GOOD");
        var res = new MockHttpServletResponse();

        when(jwtUtils.getEmailFromJwt("GOOD")).thenReturn("seb@example.com");
        UserDetails details = User.withUsername("seb@example.com").password("x").authorities(List.of()).build();
        when(userDetailsService.loadUserByUsername("seb@example.com")).thenReturn(details);
        when(jwtUtils.validateJwt("GOOD")).thenReturn(true);

        filter.doFilter(req, res, new MockFilterChain());

        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isInstanceOf(UsernamePasswordAuthenticationToken.class);
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(auth.getName()).isEqualTo("seb@example.com");
        verify(jwtUtils).getEmailFromJwt("GOOD");
        verify(jwtUtils).validateJwt("GOOD");
        verify(userDetailsService).loadUserByUsername("seb@example.com");
    }
}
