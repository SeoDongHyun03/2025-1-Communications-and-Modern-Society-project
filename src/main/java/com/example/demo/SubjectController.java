package com.example.demo;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/subjects")
public class SubjectController {
    private final SubjectRepository subjectRepository;

    public SubjectController(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @GetMapping
    public List<Subject> getSubjects() {
        return subjectRepository.findAll();
    }

    @PostMapping
    public Subject addSubject(@RequestBody Subject subject) {
        if (!subjectRepository.existsByName(subject.getName())) {
            return subjectRepository.save(subject);
        }
        throw new IllegalArgumentException("이미 존재하는 과목입니다.");
    }
}