package com.example.demo;

import jakarta.persistence.*;

@Entity
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    // 기본 생성자
    public Subject() {}

    // name만 받는 생성자
    public Subject(String name) {
        this.name = name;
    }

    // 모든 필드 생성자
    public Subject(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    // Getter/Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }

    public void setName(String name) { this.name = name; }
}