package com.openclassrooms.mddapi.repository;

import com.openclassrooms.mddapi.model.Post;
import com.openclassrooms.mddapi.model.Topic;
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
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ImportAutoConfiguration(exclude = FlywayAutoConfiguration.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=never"
})
class PostRepositoryTest {

    @Autowired PostRepository postRepository;
    @Autowired TopicRepository topicRepository;
    @Autowired UserRepository userRepository;

    @Test
    void save_and_findAll_shouldWork() {
        Topic t = new Topic(); t.setName("Spring"); t.setSlug("spring");
        t = topicRepository.save(t);

        User u = new User(); u.setUsername("seb"); u.setEmail("seb@example.com"); u.setPassword("x");
        u = userRepository.save(u);

        Post p = new Post();
        p.setTitle("Hello"); p.setContent("World");
        p.setTopic(t); p.setAuthor(u);

        postRepository.save(p);

        assertThat(postRepository.findAll()).hasSize(1);
        assertThat(postRepository.findAll().get(0).getTitle()).isEqualTo("Hello");
    }
}
