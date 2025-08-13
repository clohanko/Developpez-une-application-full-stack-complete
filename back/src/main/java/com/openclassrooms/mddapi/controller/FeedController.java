// src/main/java/com/openclassrooms/mddapi/controller/FeedController.java
package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.dto.PageDto;
import com.openclassrooms.mddapi.dto.PostDto;
import com.openclassrooms.mddapi.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class FeedController {

    private final PostService service;
    public FeedController(PostService service) { this.service = service; }

    @GetMapping("/feed")
    public ResponseEntity<PageDto<PostDto>> feed(@RequestParam(defaultValue = "desc") String sort,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size,
                                                 Authentication auth) {
        return ResponseEntity.ok(service.feed(auth.getName(), sort, page, size));
    }
}
