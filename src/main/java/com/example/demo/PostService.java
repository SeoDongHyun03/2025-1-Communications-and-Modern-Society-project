package com.example.demo;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class PostService {
    private final PostRepository repo;
    public PostService(PostRepository repo) { this.repo = repo; }

    public List<Post> findAll() {
        List<Post> list = repo.findAll();
        list.sort(Comparator.comparing(Post::getId).reversed());
        return list;
    }

    public List<Post> findBySubject(String subject) {
        return repo.findBySubjectOrderByCreatedAtDesc(subject);
    }

    public List<String> findSubjects() {
        Set<String> subjects = new HashSet<>();
        for(Post p : repo.findAll()) {
            if(p.getSubject() != null && !p.getSubject().isEmpty()) subjects.add(p.getSubject());
        }
        List<String> result = new ArrayList<>(subjects);
        Collections.sort(result);
        return result;
    }

    public Post findById(Long id) { return repo.findById(id).orElse(null); }

    public Post save(String title, String content, String subject) {
        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setSubject(subject);
        post.setCreatedAt(LocalDateTime.now());
        return repo.save(post);
    }

    public Post update(Long id, String title, String content, String subject) {
        Post post = repo.findById(id).orElse(null);
        if(post != null) {
            post.setTitle(title); post.setContent(content); post.setSubject(subject);
            repo.save(post);
        }
        return post;
    }

    public void delete(Long id) { repo.deleteById(id); }
}