// src/test/java/com/openclassrooms/mddapi/MddApiApplicationTests.java
package com.openclassrooms.mddapi;

import com.openclassrooms.mddapi.config.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@Import(TestSecurityConfig.class) // ← ajoute ceci
class MddApiApplicationTests {
	@Test void contextLoads() { }
}
