// src/main/java/com/openclassrooms/mddapi/service/PostService.java
package com.openclassrooms.mddapi.service;

import com.openclassrooms.mddapi.dto.CommentDto;
import com.openclassrooms.mddapi.dto.PageDto;
import com.openclassrooms.mddapi.dto.PostDto;
import com.openclassrooms.mddapi.model.Comment;
import com.openclassrooms.mddapi.model.Post;
import com.openclassrooms.mddapi.model.Topic;
import com.openclassrooms.mddapi.model.User;
import com.openclassrooms.mddapi.payload.request.CreateCommentRequest;
import com.openclassrooms.mddapi.payload.request.CreatePostRequest;
import com.openclassrooms.mddapi.repository.CommentRepository;
import com.openclassrooms.mddapi.repository.PostRepository;
import com.openclassrooms.mddapi.repository.SubscriptionRepository;
import com.openclassrooms.mddapi.repository.TopicRepository;
import com.openclassrooms.mddapi.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepo;
    private final CommentRepository commentRepo;
    private final TopicRepository topicRepo;
    private final UserRepository userRepo;
    private final SubscriptionRepository subRepo; // ⬅️ NEW

    public PostService(PostRepository p,
                       CommentRepository c,
                       TopicRepository t,
                       UserRepository u,
                       SubscriptionRepository s) { // ⬅️ NEW
        this.postRepo = p;
        this.commentRepo = c;
        this.topicRepo = t;
        this.userRepo = u;
        this.subRepo = s; // ⬅️ NEW
    }

    @Transactional
    public PostDto create(String principal, CreatePostRequest req) {
        if (req == null || req.topicId() == null || req.title() == null || req.title().length() < 3
                || req.content() == null || req.content().isBlank()) {
            throw new IllegalArgumentException("Invalid post data");
        }
        User author = findUser(principal);
        Topic topic = topicRepo.findById(req.topicId()).orElseThrow();

        Post p = new Post();
        p.setAuthor(author);
        p.setTopic(topic);
        p.setTitle(req.title().trim());
        p.setContent(req.content().trim());
        p = postRepo.save(p);

        return toDto(p, List.of());
    }

    @Transactional(readOnly = true)
    public PostDto getOne(Long id) {
        Post p = postRepo.findById(id).orElseThrow();
        var comments = commentRepo.findByPostOrderByCreatedAtAsc(p)
                .stream().map(this::toDto).toList();
        return toDto(p, comments);
    }

    @Transactional
    public CommentDto addComment(String principal, Long postId, CreateCommentRequest req) {
        if (req == null || req.content() == null || req.content().isBlank()) {
            throw new IllegalArgumentException("Empty comment");
        }
        User author = findUser(principal);
        Post post = postRepo.findById(postId).orElseThrow();

        Comment c = new Comment();
        c.setAuthor(author);
        c.setPost(post);
        c.setContent(req.content().trim());
        c = commentRepo.save(c);

        return toDto(c);
    }

    // ===== NEW: FEED des topics suivis (paginated + tri) =====
    @Transactional(readOnly = true)
    public PageDto<PostDto> feed(String principal, String sort, int page, int size) {
        User user = findUser(principal);

        var topicIds = subRepo.findByUser(user).stream()
                .map(s -> s.getTopic().getId())
                .toList();

        if (topicIds.isEmpty()) {
            return new PageDto<>(List.of(), page, size, 0);
        }

        Sort srt = "asc".equalsIgnoreCase(sort)
                ? Sort.by("createdAt").ascending()
                : Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, srt);

        var postsPage = postRepo.findByTopic_IdIn(topicIds, pageable);
        var items = postsPage.getContent().stream()
                .map(p -> toDto(p, List.of())) // feed léger: sans commentaires
                .toList();

        return new PageDto<>(items,
                postsPage.getNumber(),
                postsPage.getSize(),
                postsPage.getTotalElements());
    }

    // ---- mapping helpers ----
    private PostDto toDto(Post p, List<CommentDto> comments) {
        return new PostDto(
                p.getId(),
                p.getTopic().getId(), p.getTopic().getName(),
                p.getTitle(), p.getContent(),
                p.getAuthor().getId(), p.getAuthor().getUsername(),
                p.getCreatedAt(),
                comments
        );
    }

    private CommentDto toDto(Comment c) {
        return new CommentDto(
                c.getId(),
                c.getAuthor().getId(), c.getAuthor().getUsername(),
                c.getContent(), c.getCreatedAt()
        );
    }

    private User findUser(String principal) {
        return userRepo.findByEmail(principal)
                .or(() -> userRepo.findByUsername(principal))
                .orElseThrow();
    }
}
