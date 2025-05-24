package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import java.util.Optional;

@RestController
public class AuthController {
    @Autowired 
    private UserRepository userRepository;

    @PostMapping("/api/login")
    public Map<String, String> login(@RequestBody Map<String, String> req, HttpSession session) {
        String username = req.get("username");
        String password = req.get("password");
        
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return Map.of("error", "아이디와 비밀번호를 모두 입력하세요.");
        }
        
        Optional<User> opt = userRepository.findByUsername(username);
        if (opt.isEmpty() || !opt.get().getPassword().equals(password)) {
            return Map.of("error", "아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        
        User user = opt.get();
        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        
        return Map.of("username", user.getUsername());
    }

    @PostMapping("/api/register")
    public Map<String, String> register(@RequestBody Map<String, String> req) {
        String username = req.get("username");
        String password = req.get("password");
        
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return Map.of("error", "아이디와 비밀번호를 모두 입력하세요.");
        }
        
        if (userRepository.findByUsername(username).isPresent()) {
            return Map.of("error", "이미 사용 중인 아이디입니다.");
        }
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(password); // 실제 프로젝트에서는 비밀번호 해싱이 필요
        userRepository.save(user);
        
        return Map.of("message", "회원가입이 완료되었습니다.");
    }

    @PostMapping("/api/logout")
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        return Map.of("message", "로그아웃 되었습니다.");
    }

    @GetMapping("/api/me")
    public Map<String, Object> me(HttpSession session) {
        Object username = session.getAttribute("username");
        Object userId = session.getAttribute("userId");
        
        if (username == null || userId == null) {
            return Map.of("isLoggedIn", false);
        }
        
        return Map.of(
            "isLoggedIn", true,
            "username", username,
            "userId", userId
        );
    }
}