package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import java.util.Objects;
import java.util.stream.Collectors;

import java.util.HashMap;

@RestController
public class PostController {
    @Autowired
    private PostRepository postRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @GetMapping("/api/posts")
    public List<Post> getPosts(@RequestParam(required = false) String subject) {
        if (subject != null && !subject.isEmpty()) {
            return postRepository.findBySubjectOrderByCreatedAtDesc(subject);
        }
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/api/posts/{id}")
    public ResponseEntity<?> getPost(@PathVariable Long id, HttpSession session) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("게시글을 찾을 수 없습니다.");
        }
        Post post = postOpt.get();
        Long userId = (Long) session.getAttribute("userId");
        boolean isAuthor = (userId != null && post.getAuthor().getId().equals(userId));
        Map<String, Object> result = new HashMap<>();
        result.put("id", post.getId());
        result.put("title", post.getTitle());
        result.put("content", post.getContent());
        result.put("subject", post.getSubject());
        result.put("createdAt", post.getCreatedAt());
        Map<String, Object> author = new HashMap<>();
        author.put("id", post.getAuthor().getId());
        author.put("username", post.getAuthor().getUsername());
        result.put("author", author);
        result.put("isAuthor", isAuthor); // ★ 로그인한 사용자가 작성자인지 여부
        return ResponseEntity.ok(result);
    }

//    @GetMapping("/api/subjects")
//    public List<String> getAllSubjects() {
//        return subjectRepository.findAll()
//                .stream()
//                .map(Subject::getName)
//                .collect(Collectors.toList());
//    }

    @PostMapping("/api/posts")
    public Map<String, Object> createPost(@RequestBody Post post, HttpSession session) {
        // 로그인 확인
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Map.of("error", "로그인이 필요합니다.");
        }

        // 필수 필드 검증
        if (post.getTitle() == null || post.getTitle().trim().isEmpty()) {
            return Map.of("error", "제목을 입력해주세요.");
        }
        if (post.getContent() == null || post.getContent().trim().isEmpty()) {
            return Map.of("error", "내용을 입력해주세요.");
        }
        if (post.getSubject() == null || post.getSubject().trim().isEmpty()) {
            return Map.of("error", "과목을 선택해주세요.");
        }

        // 사용자 정보 가져오기
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Map.of("error", "사용자 정보를 찾을 수 없습니다.");
        }

        try {
            post.setAuthor(userOpt.get());
            post.setId(null); // ID를 null로 설정하여 데이터베이스가 새 ID를 생성하도록 함
            Post savedPost = postRepository.save(post);
            
            return Map.of(
                "id", savedPost.getId(),
                "title", savedPost.getTitle(),
                "content", savedPost.getContent(),
                "subject", savedPost.getSubject(),
                "createdAt", savedPost.getCreatedAt(),
                "author", savedPost.getAuthor().getUsername()
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", "글 작성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @PutMapping("/api/posts/{id}")
    public Map<String, Object> updatePost(
            @PathVariable Long id,
            @RequestBody Post updatedPost,
            HttpSession session) {
        // 로그인 확인
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Map.of("error", "로그인이 필요합니다.");
        }

        // 게시글 존재 여부 확인
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return Map.of("error", "게시글을 찾을 수 없습니다.");
        }

        Post post = postOpt.get();

        // 작성자 확인
        if (!post.getAuthor().getId().equals(userId)) {
            return Map.of("error", "권한이 없습니다.");
        }

        // 게시글 업데이트
        post.setTitle(updatedPost.getTitle());
        post.setContent(updatedPost.getContent());
        postRepository.save(post);

        return Map.of("message", "게시글이 수정되었습니다.");
    }

    @DeleteMapping("/api/posts/{id}")
    public Map<String, Object> deletePost(@PathVariable Long id, HttpSession session) {
        // 로그인 확인
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Map.of("error", "로그인이 필요합니다.");
        }

        // 게시글 존재 여부 확인
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return Map.of("error", "게시글을 찾을 수 없습니다.");
        }

        Post post = postOpt.get();

        // 작성자 확인
        if (!post.getAuthor().getId().equals(userId)) {
            return Map.of("error", "권한이 없습니다.");
        }

        postRepository.delete(post);
        return Map.of("message", "게시글이 삭제되었습니다.");
    }
}