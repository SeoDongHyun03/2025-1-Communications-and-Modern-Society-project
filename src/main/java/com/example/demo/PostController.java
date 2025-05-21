package com.example.demo;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class PostController {
    private final PostService postService;
    private final MarkdownService markdownService;
    private final SubjectRepository subjectRepository; // 추가

    public PostController(PostService postService, MarkdownService markdownService, SubjectRepository subjectRepository) {
        this.postService = postService;
        this.markdownService = markdownService;
        this.subjectRepository = subjectRepository; // 추가
    }

    @GetMapping("/posts")
    public List<Post> list(@RequestParam(required = false) String subject) {
        if(subject != null && !subject.isEmpty()) return postService.findBySubject(subject);
        return postService.findAll();
    }

    @GetMapping("/posts/{id}")
    public PostDetailResponse detail(@PathVariable Long id) {
        Post post = postService.findById(id);
        String html = markdownService.toHtml(post.getContent());
        return new PostDetailResponse(post, html);
    }

    @PostMapping("/posts")
    public Post create(@RequestBody PostCreateRequest req) {
        return postService.save(req.getTitle(), req.getContent(), req.getSubject());
    }

    @PutMapping("/posts/{id}")
    public Post update(@PathVariable Long id, @RequestBody PostCreateRequest req) {
        return postService.update(id, req.getTitle(), req.getContent(), req.getSubject());
    }

    @DeleteMapping("/posts/{id}")
    public void delete(@PathVariable Long id) { postService.delete(id); }

    @GetMapping("/subjects/names")
    public List<String> getSubjectNames() {
        return subjectRepository.findAll().stream()
                .map(Subject::getName)
                .toList();
    }

    public static class PostCreateRequest {
        private String title, content, subject;
        public String getTitle() { return title; }

        public void setTitle(String title) { this.title = title; }

        public String getContent() { return content; }

        public void setContent(String content) { this.content = content; }

        public String getSubject() { return subject; }

        public void setSubject(String subject) { this.subject = subject; }
    }
    public static class PostDetailResponse {
        private Post post; private String htmlContent;
        public PostDetailResponse(Post post, String htmlContent) {
            this.post = post; this.htmlContent = htmlContent;
        }

        public Post getPost() { return post; }

        public String getHtmlContent() { return htmlContent; }
    }
}