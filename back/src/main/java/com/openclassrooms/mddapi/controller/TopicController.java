package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.dto.TopicDto;
import com.openclassrooms.mddapi.model.Topic;
import com.openclassrooms.mddapi.repository.TopicRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
public class TopicController {
    private final TopicRepository repo;

    public TopicController(TopicRepository repo) { this.repo = repo; }

    @GetMapping
    public ResponseEntity<List<TopicDto>> list() {
        var dtos = repo.findAll().stream()
                .map(t -> new TopicDto(t.getId(), t.getName(), t.getSlug(), t.getDescription()))
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
