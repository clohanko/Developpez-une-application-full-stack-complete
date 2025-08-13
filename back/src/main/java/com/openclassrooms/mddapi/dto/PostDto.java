// src/main/java/com/openclassrooms/mddapi/dto/PostDto.java
package com.openclassrooms.mddapi.dto;

import java.time.Instant;
import java.util.List;

public record PostDto(
        Long id,
        Long topicId, String topicName,
        String title, String content,
        Long authorId, String authorUsername,
        Instant createdAt,
        List<CommentDto> comments
) {}

