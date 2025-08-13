// src/main/java/com/openclassrooms/mddapi/payload/CreatePostRequest.java
package com.openclassrooms.mddapi.payload.request;

public record CreatePostRequest(Long topicId, String title, String content) {}
