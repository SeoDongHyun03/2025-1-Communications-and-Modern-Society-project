// src/main/java/com/example/demo/SubjectRepository.java
package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    boolean existsByName(String name);
}