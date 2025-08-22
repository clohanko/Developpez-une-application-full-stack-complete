package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.model.Post;
import com.openclassrooms.mddapi.model.Subscription;
import com.openclassrooms.mddapi.model.Topic;
import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.repository.PostRepository;
import com.openclassrooms.mddapi.repository.SubscriptionRepository;
import com.openclassrooms.mddapi.repository.TopicRepository;
import com.openclassrooms.mddapi.repository.UserRepository;
import com.openclassrooms.mddapi.security.JwtUtils;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import org.springframework.boot.test.mock.mockito.MockBean;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ExtendWith(SpringExtension.class)
class FeedControllerITTest {

    @Autowired MockMvc mvc;

    @Autowired UserRepository userRepo;
    @Autowired TopicRepository topicRepo;
    @Autowired SubscriptionRepository subRepo;
    @Autowired PostRepository postRepo;
    @Autowired PasswordEncoder encoder;

    @MockBean JwtUtils jwtUtils; // on pilote l’auth via le cookie

    @BeforeEach
    void setup() {
        postRepo.deleteAll();
        subRepo.deleteAll();
        topicRepo.deleteAll();
        userRepo.deleteAll();
    }

    private User saveUser(String email, String username) {
        User u = new User();
        u.setEmail(email);
        u.setUsername(username);
        u.setPassword(encoder.encode("pwd"));
        return userRepo.save(u);
    }

    private Topic saveTopic(String name, String slug) {
        Topic t = new Topic();
        t.setName(name);
        t.setSlug(slug);
        return topicRepo.save(t);
    }

    private Post savePost(User author, Topic topic, String title, String content, Instant createdAt) {
        Post p = new Post();
        p.setAuthor(author);
        p.setTopic(topic);
        p.setTitle(title);
        p.setContent(content);
        p.setCreatedAt(createdAt);
        return postRepo.save(p);
    }

    @Test
    void feed_desc_returnsPagedPosts_forFollowedTopics() throws Exception {
        // Arrange
        String token = "IT_TOKEN";
        String email = "seb@example.com";
        when(jwtUtils.getUserNameFromJwtToken(token)).thenReturn(email);
        when(jwtUtils.validateJwtToken(token)).thenReturn(true);

        User seb = saveUser(email, "seb");
        Topic spring = saveTopic("Spring", "spring");
        Subscription s = new Subscription();
        s.setUser(seb);
        s.setTopic(spring);
        subRepo.save(s);

        // deux posts avec dates différentes pour vérifier le tri
        savePost(seb, spring, "Old", "Body", Instant.parse("2023-01-01T00:00:00Z"));
        savePost(seb, spring, "New", "Body", Instant.parse("2024-01-01T00:00:00Z"));

        // Act + Assert (tri desc => "New" en premier)
        mvc.perform(get("/api/feed")
                        .param("sort", "desc")
                        .param("page", "0")
                        .param("size", "10")
                        .cookie(new Cookie("token", token))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].title", is("New")))
                .andExpect(jsonPath("$.items[1].title", is("Old")))
                .andExpect(jsonPath("$.total", is(2)));
    }

    @Test
    void feed_asc_noSubscriptions_returnsEmptyItems() throws Exception {
        // Arrange
        String token = "IT2";
        String email = "nosub@example.com";
        when(jwtUtils.getUserNameFromJwtToken(token)).thenReturn(email);
        when(jwtUtils.validateJwtToken(token)).thenReturn(true);

        saveUser(email, "nosub"); // pas d’abonnement

        // Act + Assert
        mvc.perform(get("/api/feed")
                        .param("sort", "asc")
                        .param("page", "0")
                        .param("size", "10")
                        .cookie(new Cookie("token", token))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)))
                .andExpect(jsonPath("$.total", is(0)));
    }
}
