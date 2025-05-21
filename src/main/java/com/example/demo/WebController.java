// src/main/java/com/example/demo/WebController.java
package com.example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {
    @GetMapping({"/", "/list", "/write", "/post/{id}"})
    public String forward() {
        return "forward:/index.html";
    }
}