// src/main/java/com/openclassrooms/mddapi/dto/PageDto.java
package com.openclassrooms.mddapi.dto;

import java.util.List;

public record PageDto<T>(List<T> items, int page, int size, long total) {}
