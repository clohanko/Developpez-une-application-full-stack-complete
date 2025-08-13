package com.openclassrooms.mddapi.controller;

import com.openclassrooms.mddapi.service.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {
    private final SubscriptionService service;

    public SubscriptionController(SubscriptionService service) { this.service = service; }

    @PostMapping("/{topicId}")
    public ResponseEntity<String> subscribe(@PathVariable Long topicId, Authentication auth) {
        service.subscribe(auth.getName(), topicId);
        return ResponseEntity.ok("ok");
    }

    @DeleteMapping("/{topicId}")
    public ResponseEntity<String> unsubscribe(@PathVariable Long topicId, Authentication auth) {
        service.unsubscribe(auth.getName(), topicId);
        return ResponseEntity.ok("ok");
    }

    @GetMapping
    public ResponseEntity<List<Long>> mySubscriptions(Authentication auth) {
        return ResponseEntity.ok(service.listTopicIds(auth.getName()));
    }
}
