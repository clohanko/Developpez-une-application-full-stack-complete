package com.openclassrooms.mddapi.service;

import com.openclassrooms.mddapi.dto.PageDto;
import com.openclassrooms.mddapi.dto.PostDto;
import com.openclassrooms.mddapi.model.Comment;
import com.openclassrooms.mddapi.model.Post;
import com.openclassrooms.mddapi.model.Subscription;
import com.openclassrooms.mddapi.model.Topic;
import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.payload.request.CreateCommentRequest;
import com.openclassrooms.mddapi.payload.request.CreatePostRequest;
import com.openclassrooms.mddapi.repository.CommentRepository;
import com.openclassrooms.mddapi.repository.PostRepository;
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
import org.springframework.data.domain.*;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock PostRepository postRepo;
    @Mock CommentRepository commentRepo;
    @Mock TopicRepository topicRepo;
    @Mock UserRepository userRepo;
    @Mock SubscriptionRepository subRepo;

    @InjectMocks PostService service;

    private User user;
    private Topic topic;

    @BeforeEach
    void init() {
        user = new User();
        user.setUsername("seb");
        user.setEmail("seb@example.com");
        user.setPassword("x");

        topic = new Topic();
        topic.setName("Spring");
        topic.setSlug("spring");
    }

    /* ==================== create(...) ==================== */

    @Test
    void create_shouldValidate_SaveAndReturnDto() {
        var req = new CreatePostRequest(7L, "  Titre  ", "  Contenu  ");

        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(topicRepo.findById(7L)).thenReturn(Optional.of(topic));

        Post saved = new Post();
        saved.setAuthor(user);
        saved.setTopic(topic);
        saved.setTitle("Titre");
        saved.setContent("Contenu");
        saved.setCreatedAt(Instant.now());
        when(postRepo.save(any(Post.class))).thenReturn(saved);

        PostDto dto = service.create("seb@example.com", req);

        assertThat(dto.title()).isEqualTo("Titre");
        assertThat(dto.content()).isEqualTo("Contenu");
        verify(postRepo).save(any(Post.class));
    }

    @Test
    void create_shouldThrow_onNullRequest_orTooShortTitle_orBlankContent() {
        // null request
        assertThatThrownBy(() -> service.create("seb@example.com", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid post");

        // title length < 3
        var badTitle = new CreatePostRequest(1L, "ab", "x");
        assertThatThrownBy(() -> service.create("seb@example.com", badTitle))
                .isInstanceOf(IllegalArgumentException.class);

        // blank content
        var blankContent = new CreatePostRequest(1L, "valid", "   ");
        assertThatThrownBy(() -> service.create("seb@example.com", blankContent))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_shouldThrow_whenTopicNotFound() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(topicRepo.findById(123L)).thenReturn(Optional.empty());

        var req = new CreatePostRequest(123L, "Title", "Body");

        assertThatThrownBy(() -> service.create("seb@example.com", req))
                .isInstanceOf(NoSuchElementException.class);
        verify(postRepo, never()).save(any());
    }

    /* ==================== getOne(...) ==================== */

    @Test
    void getOne_shouldLoadPostAndComments() {
        Post p = new Post();
        p.setAuthor(user);
        p.setTopic(topic);
        p.setTitle("T");
        p.setContent("C");
        p.setCreatedAt(Instant.now());

        when(postRepo.findById(5L)).thenReturn(Optional.of(p));

        Comment c = new Comment();
        c.setAuthor(user);
        c.setPost(p);
        c.setContent("Hi");
        c.setCreatedAt(Instant.now());
        when(commentRepo.findByPostOrderByCreatedAtAsc(p)).thenReturn(List.of(c));

        PostDto dto = service.getOne(5L);

        assertThat(dto.title()).isEqualTo("T");
        assertThat(dto.comments()).hasSize(1);
        assertThat(dto.comments().get(0).content()).isEqualTo("Hi");
    }

    @Test
    void getOne_shouldThrow_whenPostMissing() {
        when(postRepo.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getOne(999L))
                .isInstanceOf(NoSuchElementException.class);
    }

    /* ==================== addComment(...) ==================== */

    @Test
    void addComment_shouldPersistAndReturnDto() {
        Post p = new Post();
        p.setAuthor(user);
        p.setTopic(topic);
        p.setTitle("T");
        p.setContent("C");
        p.setCreatedAt(Instant.now());

        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(postRepo.findById(5L)).thenReturn(Optional.of(p));

        Comment saved = new Comment();
        saved.setAuthor(user);
        saved.setPost(p);
        saved.setContent("Hello");
        saved.setCreatedAt(Instant.now());
        when(commentRepo.save(any(Comment.class))).thenReturn(saved);

        var dto = service.addComment("seb@example.com", 5L, new CreateCommentRequest("Hello"));
        assertThat(dto.content()).isEqualTo("Hello");
        verify(commentRepo).save(any(Comment.class));
    }

    @Test
    void addComment_shouldThrow_onBlankContent() {
        assertThatThrownBy(() -> service.addComment("seb@example.com", 5L, new CreateCommentRequest("   ")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Empty comment");
        verify(commentRepo, never()).save(any());
    }

    /* ==================== feed(...) ==================== */

    @Test
    void feed_desc_shouldReturnPage_forFollowedTopics() {
        Subscription s = new Subscription();
        s.setUser(user);
        s.setTopic(topic);
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(subRepo.findByUser(user)).thenReturn(List.of(s));

        Post p = new Post();
        p.setAuthor(user);
        p.setTopic(topic);
        p.setTitle("A");
        p.setContent("B");
        p.setCreatedAt(Instant.now());

        var page = new PageImpl<>(List.of(p), PageRequest.of(0, 10, Sort.by("createdAt").descending()), 1);
        when(postRepo.findByTopic_IdIn(anyList(), any(Pageable.class))).thenReturn(page);

        PageDto<PostDto> out = service.feed("seb@example.com", "desc", 0, 10);

        assertThat(out.items()).hasSize(1);
        assertThat(out.total()).isEqualTo(1);
        verify(postRepo).findByTopic_IdIn(anyList(), any(Pageable.class));
    }

    @Test
    void feed_asc_shouldUseUsernameLookup_andAscendingSort() {
        // Force path findByUsername (email vide)
        when(userRepo.findByEmail("seb")).thenReturn(Optional.empty());
        when(userRepo.findByUsername("seb")).thenReturn(Optional.of(user));

        Subscription s = new Subscription();
        s.setUser(user);
        s.setTopic(topic);
        when(subRepo.findByUser(user)).thenReturn(List.of(s));

        Post p = new Post();
        p.setAuthor(user);
        p.setTopic(topic);
        p.setTitle("X");
        p.setContent("Y");
        p.setCreatedAt(Instant.now());

        // On ne teste pas l'ordre exact ici, mais on passe bien par "asc"
        var page = new PageImpl<>(List.of(p), PageRequest.of(0, 5, Sort.by("createdAt").ascending()), 1);
        when(postRepo.findByTopic_IdIn(anyList(), any(Pageable.class))).thenReturn(page);

        PageDto<PostDto> out = service.feed("seb", "asc", 0, 5);

        assertThat(out.items()).hasSize(1);
        verify(userRepo).findByUsername("seb");
        verify(postRepo).findByTopic_IdIn(anyList(), any(Pageable.class));
    }

    @Test
    void feed_shouldReturnEmpty_whenNoSubscriptions() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));
        when(subRepo.findByUser(user)).thenReturn(List.of());

        PageDto<PostDto> out = service.feed("seb@example.com", "desc", 0, 10);

        assertThat(out.items()).isEmpty();
        assertThat(out.total()).isZero();
        verify(postRepo, never()).findByTopic_IdIn(anyList(), any());
    }

    @Test
    void feed_shouldThrow_whenUserNotFound() {
        when(userRepo.findByEmail("ghost")).thenReturn(Optional.empty());
        when(userRepo.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.feed("ghost", "desc", 0, 10))
                .isInstanceOf(NoSuchElementException.class);
        verify(postRepo, never()).findByTopic_IdIn(anyList(), any());
    }


    /* ==================== create(...) : branches null ==================== */

    @Test
    void create_shouldThrow_whenTopicIdIsNull() {
        var req = new CreatePostRequest(null, "Title", "Body"); // B = true
        assertThatThrownBy(() -> service.create("seb@example.com", req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_shouldThrow_whenTitleIsNull() {
        var req = new CreatePostRequest(1L, null, "Body"); // C = true
        assertThatThrownBy(() -> service.create("seb@example.com", req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_shouldThrow_whenContentIsNull() {
        var req = new CreatePostRequest(1L, "Title", null); // E = true
        assertThatThrownBy(() -> service.create("seb@example.com", req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    /* ==================== addComment(...) : branches null ==================== */

    @Test
    void addComment_shouldThrow_whenRequestIsNull() {
        assertThatThrownBy(() -> service.addComment("seb@example.com", 5L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Empty comment");
    }

    @Test
    void addComment_shouldThrow_whenContentIsNull() {
        assertThatThrownBy(() -> service.addComment("seb@example.com", 5L, new CreateCommentRequest(null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Empty comment");
    }

    /* ==================== feed(...) : défaut sort = desc ==================== */

    @Test
    void feed_nullSort_shouldDefaultToDescending() {
        when(userRepo.findByEmail("seb@example.com")).thenReturn(Optional.of(user));

        var sub = new Subscription(); sub.setUser(user); sub.setTopic(topic);
        when(subRepo.findByUser(user)).thenReturn(List.of(sub));

        when(postRepo.findByTopic_IdIn(anyList(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 3), 0));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);

        service.feed("seb@example.com", null, 0, 3); // sort = null

        verify(postRepo).findByTopic_IdIn(anyList(), captor.capture());
        Pageable used = captor.getValue();
        var order = used.getSort().getOrderFor("createdAt");
        assertThat(order).isNotNull();
        assertThat(order.isDescending()).isTrue(); // défaut = desc
    }
}

