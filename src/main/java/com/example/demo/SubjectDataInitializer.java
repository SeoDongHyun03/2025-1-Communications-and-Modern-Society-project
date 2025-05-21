package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class SubjectDataInitializer implements CommandLineRunner {
    @Autowired
    private SubjectRepository subjectRepository;

    @Override
    public void run(String... args) {
        String[] defaultSubjects = {"과학과창의적사고", "네트워크최신기술", "인공지능보안", "정보통신과현대생활", "정보보안기사"};
        for (String name : defaultSubjects) {
            if (!subjectRepository.existsByName(name)) {
                subjectRepository.save(new Subject(name));
            }
        }
    }
}