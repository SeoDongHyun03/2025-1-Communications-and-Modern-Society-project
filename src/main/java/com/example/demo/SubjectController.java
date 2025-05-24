package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    @Autowired
    private SubjectRepository subjectRepository;

    @GetMapping
    public List<String> getAllSubjects() {
        return subjectRepository.findAll()
                .stream()
                .map(Subject::getName) // Subject 객체의 name만 추출
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> addSubject(@RequestBody Subject subject) {
        if (subject.getName() == null || subject.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "과목명을 입력하세요."));
        }

        if (subjectRepository.existsByName(subject.getName())) {
            return ResponseEntity.badRequest().body(Map.of("error", "이미 존재하는 과목입니다."));
        }

        subjectRepository.save(subject);
        return ResponseEntity.ok(Map.of("name", subject.getName(), "message", "과목이 추가되었습니다."));
    }
}