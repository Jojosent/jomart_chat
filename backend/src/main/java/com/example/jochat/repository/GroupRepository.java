package com.example.jochat.repository;

import com.example.jochat.entity.Group;
import com.example.jochat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {

    // Все группы где пользователь участник
    @Query("SELECT g FROM Group g JOIN g.members m WHERE m = :user")
    List<Group> findAllByMember(@Param("user") User user);

    // Все группы где пользователь админ
    List<Group> findByAdmin(User admin);
}