// src/main/java/com/openclassrooms/mddapi/dto/CommentDto.java
package com.openclassrooms.mddapi.dto;

import java.time.Instant;

public record CommentDto(
        Long id, Long authorId, String authorUsername,
        String content, Instant createdAt
) {}
