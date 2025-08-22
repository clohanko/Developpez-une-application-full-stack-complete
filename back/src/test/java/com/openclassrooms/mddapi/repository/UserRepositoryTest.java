package com.openclassrooms.mddapi.repository;

import com.openclassrooms.mddapi.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY) // force H2
// coupe Flyway en test (au cas où il est sur le classpath)
@ImportAutoConfiguration(exclude = FlywayAutoConfiguration.class)
// datasource & JPA pour H2 (mode MySQL pour la compat)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=never"
})
class UserRepositoryTest {

    @Autowired
    UserRepository userRepository;

    @Test
    void existsByEmail_and_existsByUsername_behaveAsExpected() {
        User u = new User();
        u.setUsername("seb");
        u.setEmail("seb@example.com");
        u.setPassword("x");
        userRepository.save(u);

        assertThat(userRepository.existsByEmail("seb@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("nope@example.com")).isFalse();

        assertThat(userRepository.existsByUsername("seb")).isTrue();
        assertThat(userRepository.existsByUsername("other")).isFalse();
    }
}
