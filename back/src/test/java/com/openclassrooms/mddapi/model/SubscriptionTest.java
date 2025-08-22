package com.openclassrooms.mddapi.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class SubscriptionTest {

    @Test
    void constructor_withUserAndTopic_setsFields_andCreatedAt() {
        User u = new User();
        Topic t = new Topic();

        Subscription s = new Subscription(u, t);

        assertSame(u, s.getUser(), "user doit être recopié tel quel");
        assertSame(t, s.getTopic(), "topic doit être recopié tel quel");
        assertNotNull(s.getCreatedAt(), "createdAt doit être renseigné");
    }

    @Test
    void settersAndGetters_forId_andCreatedAt_work() {
        Subscription s = new Subscription();

        // id
        s.setId(42L);
        assertEquals(42L, s.getId());

        // createdAt
        Instant when = Instant.parse("2024-01-01T10:15:30Z");
        s.setCreatedAt(when);
        assertEquals(when, s.getCreatedAt());
    }

    @Test
    void defaultCreatedAt_is_nowish() {
        Instant before = Instant.now().minusSeconds(5);

        Subscription s = new Subscription(); // utilise le champ initialisé à Instant.now()

        assertNotNull(s.getCreatedAt());
        // bornes larges pour éviter les flakes
        assertFalse(s.getCreatedAt().isBefore(before));
        assertFalse(s.getCreatedAt().isAfter(Instant.now().plusSeconds(5)));
    }
}
