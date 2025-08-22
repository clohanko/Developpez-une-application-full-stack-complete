// src/test/java/com/openclassrooms/mddapi/config/TestSecurityConfig.java
package com.openclassrooms.mddapi.config;

import com.openclassrooms.mddapi.security.JwtCookieAuthFilter;
import com.openclassrooms.mddapi.security.JwtUtils;
import com.openclassrooms.mddapi.security.UserDetailsServiceImpl;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@Profile("test")
public class TestSecurityConfig {

    @Bean
    public PasswordEncoder testPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider testAuthenticationProvider(
            UserDetailsServiceImpl uds,
            PasswordEncoder testPasswordEncoder
    ) {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(uds);
        p.setPasswordEncoder(testPasswordEncoder);
        return p;
    }

    @Bean
    public AuthenticationManager testAuthenticationManager(
            DaoAuthenticationProvider testAuthenticationProvider
    ) {
        return new ProviderManager(testAuthenticationProvider);
    }

    @Bean
    public SecurityFilterChain testSecurityFilterChain(
            HttpSecurity http,
            JwtUtils jwtUtils,
            UserDetailsServiceImpl uds
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/posts/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/topics", "/api/topics/**").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) ->
                        res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
                .addFilterBefore(new JwtCookieAuthFilter(jwtUtils, uds),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
