// src/main/java/com/openclassrooms/mddapi/repository/UserRepository.java
package com.openclassrooms.mddapi.repository;

import com.openclassrooms.mddapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username); // ← AJOUT

    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    Boolean existsByEmailIgnoreCase(String email);
}
