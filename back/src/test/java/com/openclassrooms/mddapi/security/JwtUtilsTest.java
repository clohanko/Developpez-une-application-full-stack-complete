// src/test/java/com/openclassrooms/mddapi/security/JwtUtilsTest.java
package com.openclassrooms.mddapi.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.assertj.core.api.Assertions.assertThat;

@SpringJUnitConfig(classes = JwtUtils.class) // charge uniquement ce bean
@TestPropertySource(properties = {
        // ta clé attendue par @Value("${jwt.secret}")
        "jwt.secret=K1aO0j78msU7q8vMCTy4rGfJ7ODW0ZhTyaO4XZgV9LBpKZxT8jY6kODvZ5Qa8+NO2YOiPqh7sHG37ZKfYhaxTg=="
})
class JwtUtilsTest {

    @Autowired JwtUtils jwt;

    @Test
    void shouldGenerateAndParseEmail() {
        String token = jwt.generateJwt("seb@example.com");
        assertThat(token).isNotBlank();
        String email = jwt.getEmailFromJwt(token);
        assertThat(email).isEqualTo("seb@example.com");
        assertThat(jwt.validateJwt(token)).isTrue();
    }
}
