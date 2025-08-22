package com.openclassrooms.mddapi.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class TopicTest {

    @Test
    void settersAndGetters_cover_all_fields_including_description_and_createdAt() {
        Topic t = new Topic();

        // id / name / slug / description
        t.setId(7L);
        t.setName("Java");
        t.setSlug("java");
        t.setDescription("Tout sur Java");

        assertEquals(7L, t.getId());
        assertEquals("Java", t.getName());
        assertEquals("java", t.getSlug());
        assertEquals("Tout sur Java", t.getDescription());

        // createdAt: setter + getter
        Instant when = Instant.parse("2024-02-03T10:15:30Z");
        t.setCreatedAt(when);
        assertEquals(when, t.getCreatedAt());
    }

    @Test
    void defaultCreatedAt_is_nowish() {
        Instant before = Instant.now().minusSeconds(5);

        Topic t = new Topic(); // createdAt initialisé à Instant.now()

        assertNotNull(t.getCreatedAt());
        // bornes larges pour éviter un test flaky
        assertFalse(t.getCreatedAt().isBefore(before));
        assertFalse(t.getCreatedAt().isAfter(Instant.now().plusSeconds(5)));
    }
}
