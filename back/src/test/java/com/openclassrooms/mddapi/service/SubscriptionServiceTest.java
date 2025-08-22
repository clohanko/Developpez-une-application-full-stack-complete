package com.openclassrooms.mddapi.service;

import com.openclassrooms.mddapi.model.Subscription;
import com.openclassrooms.mddapi.model.Topic;
import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.repository.SubscriptionRepository;
import com.openclassrooms.mddapi.repository.TopicRepository;
import com.openclassrooms.mddapi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock SubscriptionRepository subRepo;
    @Mock TopicRepository topicRepo;
    @Mock UserRepository userRepo;

    @InjectMocks SubscriptionService service;

    private User user;
    private Topic topic;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUsername("seb");
        user.setEmail("seb@example.com");
        user.setPassword("x");

        topic = new Topic();
        topic.setName("Spring");
        topic.setSlug("spring");
        // pas de setId(...) dans les entités -> on set par réflexion si nécessaire
    }

    /* -------------------- subscribe -------------------- */

    @Test
    void subscribe_shouldCreate_whenNotAlreadySubscribed() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(topicRepo.findById(7L)).thenReturn(Optional.of(topic));
        when(subRepo.findByUserAndTopic(user, topic)).thenReturn(Optional.empty());
        // save renvoie l'entité passée (simple)
        when(subRepo.save(any(Subscription.class))).thenAnswer(inv -> inv.getArgument(0));

        service.subscribe("seb@example.com", 7L);

        ArgumentCaptor<Subscription> cap = ArgumentCaptor.forClass(Subscription.class);
        verify(subRepo).save(cap.capture());
        assertThat(cap.getValue().getUser()).isSameAs(user);
        assertThat(cap.getValue().getTopic()).isSameAs(topic);
    }

    @Test
    void subscribe_shouldNoop_whenAlreadySubscribed() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(topicRepo.findById(7L)).thenReturn(Optional.of(topic));
        when(subRepo.findByUserAndTopic(user, topic)).thenReturn(Optional.of(new Subscription()));

        service.subscribe("seb@example.com", 7L);

        verify(subRepo, never()).save(any());
    }

    @Test
    void subscribe_shouldThrow_whenTopicNotFound() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(topicRepo.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.subscribe("seb@example.com", 404L))
                .isInstanceOf(NoSuchElementException.class);
        verify(subRepo, never()).save(any());
    }

    /* -------------------- unsubscribe -------------------- */

    @Test
    void unsubscribe_shouldDelete_whenSubscriptionExists() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(topicRepo.findById(7L)).thenReturn(Optional.of(topic));
        Subscription sub = new Subscription(); sub.setUser(user); sub.setTopic(topic);
        when(subRepo.findByUserAndTopic(user, topic)).thenReturn(Optional.of(sub));

        service.unsubscribe("seb@example.com", 7L);

        verify(subRepo).delete(sub);
    }

    @Test
    void unsubscribe_shouldNoop_whenSubscriptionMissing() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(topicRepo.findById(7L)).thenReturn(Optional.of(topic));
        when(subRepo.findByUserAndTopic(user, topic)).thenReturn(Optional.empty());

        service.unsubscribe("seb@example.com", 7L);

        verify(subRepo, never()).delete(any());
    }

    @Test
    void unsubscribe_shouldThrow_whenTopicNotFound() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(topicRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.unsubscribe("seb@example.com", 999L))
                .isInstanceOf(NoSuchElementException.class);
        verify(subRepo, never()).delete(any());
    }

    /* -------------------- listTopicIds -------------------- */

    @Test
    void listTopicIds_shouldReturnIds_forEmailPrincipal() throws Exception {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));

        Topic t1 = new Topic(); setId(t1, 10L);
        Topic t2 = new Topic(); setId(t2, 20L);

        Subscription s1 = new Subscription(); s1.setUser(user); s1.setTopic(t1);
        Subscription s2 = new Subscription(); s2.setUser(user); s2.setTopic(t2);

        when(subRepo.findByUser(user)).thenReturn(List.of(s1, s2));

        List<Long> ids = service.listTopicIds("seb@example.com");

        assertThat(ids).containsExactlyInAnyOrder(10L, 20L);
    }

    @Test
    void listTopicIds_shouldUseUsernameFallback_whenEmailNotFound() throws Exception {
        when(userRepo.findByEmail("seb")).thenReturn(Optional.empty());
        when(userRepo.findByUsername("seb")).thenReturn(Optional.of(user));

        Topic t = new Topic(); setId(t, 42L);
        Subscription s = new Subscription(); s.setUser(user); s.setTopic(t);
        when(subRepo.findByUser(user)).thenReturn(List.of(s));

        List<Long> ids = service.listTopicIds("seb");

        assertThat(ids).containsExactly(42L);
        verify(userRepo).findByUsername("seb"); // assure le fallback
    }

    @Test
    void listTopicIds_shouldThrow_whenUserNotFound() {
        when(userRepo.findByEmail("ghost")).thenReturn(Optional.empty());
        when(userRepo.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.listTopicIds("ghost"))
                .isInstanceOf(NoSuchElementException.class);
        verify(subRepo, never()).findByUser(any());
    }

    /* -------------------- helpers -------------------- */

    private static void setId(Object entity, long id) throws Exception {
        Field f = entity.getClass().getDeclaredField("id");
        f.setAccessible(true);
        f.set(entity, id);
    }
}
