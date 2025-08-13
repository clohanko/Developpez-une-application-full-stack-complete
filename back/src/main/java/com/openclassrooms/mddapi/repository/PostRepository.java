// src/main/java/com/openclassrooms/mddapi/repository/PostRepository.java
package com.openclassrooms.mddapi.repository;

import com.openclassrooms.mddapi.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * Page de posts dont le topic est dans la liste fournie.
     * Utilisé pour le feed des sujets suivis, avec tri/pagination via Pageable.
     */
    Page<Post> findByTopic_IdIn(Collection<Long> topicIds, Pageable pageable);
}
