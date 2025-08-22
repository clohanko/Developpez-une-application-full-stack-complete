package com.openclassrooms.mddapi.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtCookieAuthFilterTest {

    @Mock JwtUtils jwtUtils;
    @Mock UserDetailsServiceImpl userDetailsService;

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void noCookies_leavesContextEmpty() throws ServletException, IOException {
        var filter = new JwtCookieAuthFilter(jwtUtils, userDetailsService);
        var req = new MockHttpServletRequest();
        var res = new MockHttpServletResponse();

        filter.doFilter(req, res, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtUtils, userDetailsService);
    }

    @Test
    void withNonTokenCookieOnly_leavesContextEmpty() throws Exception {
        var filter = new JwtCookieAuthFilter(jwtUtils, userDetailsService);
        var req = new MockHttpServletRequest();
        req.setCookies(new Cookie("other", "x")); // pas de cookie 'token'
        var res = new MockHttpServletResponse();

        filter.doFilter(req, res, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtUtils, userDetailsService);
    }

    @Test
    void invalidToken_doesNotAuthenticate() throws Exception {
        var filter = new JwtCookieAuthFilter(jwtUtils, userDetailsService);
        var req = new MockHttpServletRequest();
        req.setCookies(new Cookie("token", "BAD"));
        var res = new MockHttpServletResponse();

        when(jwtUtils.getUserNameFromJwtToken("BAD")).thenReturn("seb@example.com");
        var details = User.withUsername("seb@example.com").password("x").authorities(List.of()).build();
        when(userDetailsService.loadUserByUsername("seb@example.com")).thenReturn(details);
        when(jwtUtils.validateJwtToken("BAD")).thenReturn(false);

        filter.doFilter(req, res, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();

        verify(jwtUtils).getUserNameFromJwtToken("BAD");
        verify(userDetailsService).loadUserByUsername("seb@example.com");
        verify(jwtUtils).validateJwtToken("BAD");
    }


    @Test
    void validToken_setsAuthentication() throws Exception {
        var filter = new JwtCookieAuthFilter(jwtUtils, userDetailsService);
        var req = new MockHttpServletRequest();
        req.setCookies(new Cookie("token", "GOOD"));
        var res = new MockHttpServletResponse();

        when(jwtUtils.getUserNameFromJwtToken("GOOD")).thenReturn("seb@example.com");
        when(jwtUtils.validateJwtToken("GOOD")).thenReturn(true);
        var details = User.withUsername("seb@example.com").password("x").authorities(List.of()).build();
        when(userDetailsService.loadUserByUsername("seb@example.com")).thenReturn(details);

        filter.doFilter(req, res, new MockFilterChain());

        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isInstanceOf(UsernamePasswordAuthenticationToken.class);
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(auth.getName()).isEqualTo("seb@example.com");
        verify(jwtUtils).getUserNameFromJwtToken("GOOD");
        verify(jwtUtils).validateJwtToken("GOOD");
        verify(userDetailsService).loadUserByUsername("seb@example.com");
    }

    @Test
    void alreadyAuthenticated_skipsProcessing() throws Exception {
        var filter = new JwtCookieAuthFilter(jwtUtils, userDetailsService);
        var req = new MockHttpServletRequest();
        req.setCookies(new Cookie("token", "GOOD"));
        var res = new MockHttpServletResponse();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("someone", "n/a", List.of())
        );

        filter.doFilter(req, res, new MockFilterChain());

        verifyNoInteractions(jwtUtils, userDetailsService);
    }

}
