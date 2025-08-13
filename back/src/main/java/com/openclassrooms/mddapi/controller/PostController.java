// src/main/java/com/openclassrooms/mddapi/controller/PostController.java
package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.dto.PostDto;
import com.openclassrooms.mddapi.dto.CommentDto;
import com.openclassrooms.mddapi.payload.request.CreateCommentRequest;
import com.openclassrooms.mddapi.payload.request.CreatePostRequest;
import com.openclassrooms.mddapi.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService service;
    public PostController(PostService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<PostDto> create(@RequestBody CreatePostRequest req, Authentication auth) {
        return ResponseEntity.ok(service.create(auth.getName(), req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDto> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getOne(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto> addComment(@PathVariable Long id,
                                                 @RequestBody CreateCommentRequest req,
                                                 Authentication auth) {
        return ResponseEntity.ok(service.addComment(auth.getName(), id, req));
    }
}
