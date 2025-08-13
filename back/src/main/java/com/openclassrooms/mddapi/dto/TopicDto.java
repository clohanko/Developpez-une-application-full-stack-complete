package com.openclassrooms.mddapi.dto;

import com.openclassrooms.mddapi.model.Topic;

public record TopicDto(Long id, String name, String slug, String description) {
    public static TopicDto toDto(Topic t) {
        return new TopicDto(t.getId(), t.getName(), t.getSlug(), t.getDescription());
    }
}