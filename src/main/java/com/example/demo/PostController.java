package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class PostController {
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/api/posts")
    public List<Post> getPosts() {
        return postRepository.findAll();
    }

    @GetMapping("/api/posts/{id}")
    public Post getPost(@PathVariable Long id) {
        return postRepository.findById(id).orElse(null);
    }

    @PostMapping("/api/posts")
    public Map<String, Object> createPost(@RequestBody Post post, HttpSession session) {
        // 로그인 확인
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Map.of("error", "로그인이 필요합니다.");
        }
        
        // 사용자 정보 가져오기
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Map.of("error", "사용자 정보를 찾을 수 없습니다.");
        }
        
        post.setAuthor(userOpt.get());
        Post savedPost = postRepository.save(post);
        return Map.of(
            "id", savedPost.getId(),
            "title", savedPost.getTitle(),
            "content", savedPost.getContent(),
            "author", savedPost.getAuthor().getUsername()
        );
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