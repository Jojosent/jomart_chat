package com.example.jochat.repository;

import com.example.jochat.entity.Group;
import com.example.jochat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long> {

    // LEFT JOIN FETCH — работает даже если members пустой
    @Query("""
        SELECT g FROM Group g
        LEFT JOIN FETCH g.admin
        LEFT JOIN FETCH g.members
        LEFT JOIN FETCH g.chat
        WHERE g.id = :id
    """)
    Optional<Group> findByIdWithMembers(@Param("id") Long id);

    // Все группы где пользователь участник
    @Query("""
        SELECT DISTINCT g FROM Group g
        LEFT JOIN FETCH g.admin
        LEFT JOIN FETCH g.members m2
        LEFT JOIN FETCH g.chat
        WHERE EXISTS (
            SELECT 1 FROM Group g2
            JOIN g2.members m
            WHERE g2.id = g.id AND m = :user
        )
    """)
    List<Group> findAllByMember(@Param("user") User user);

    // Все группы где пользователь админ
    List<Group> findByAdmin(User admin);
}
