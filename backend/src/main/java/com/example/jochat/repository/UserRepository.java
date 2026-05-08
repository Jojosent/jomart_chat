package com.example.jochat.repository;

import com.example.jochat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByPhone(String phone);

    // Поиск по имени или username (исключая себя)
    @Query("""
        SELECT u FROM User u
        WHERE u.email != :excludeEmail
        AND u.emailVerified = true
        AND (
            LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%'))
        )
        ORDER BY u.fullName ASC
    """)
    List<User> searchUsers(
        @Param("query") String query,
        @Param("excludeEmail") String excludeEmail
    );
}