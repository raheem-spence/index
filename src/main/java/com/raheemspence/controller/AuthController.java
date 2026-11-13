package com.raheemspence.controller;

import com.raheemspence.dto.request.LoginRequest;
import com.raheemspence.dto.request.SignUpRequest;
import com.raheemspence.dto.response.SignUpResponse;
import com.raheemspence.model.User;
import com.raheemspence.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


// Means this class handles HTTP requests and returns data (not HTML pages)
@RestController

// Means all routes in this class start with /auth
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession httpSession) {
        User user = authService.login(request);

        httpSession.setAttribute("userId", user.getId());

        return ResponseEntity.ok("Login successful");
    }

    @PostMapping("/signup")
    public ResponseEntity<SignUpResponse> signup(@RequestBody SignUpRequest request) {
        SignUpResponse signUpResponse = authService.signup(request);

        if (signUpResponse.getStatus().equals("Error")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(signUpResponse);
        } else {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(signUpResponse);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> destroySession(HttpSession httpSession, HttpServletResponse response) {
        if (httpSession != null) {
            // destroys the session and unbinds any object tied to it
            httpSession.invalidate();
        }

        Cookie cookie = new Cookie("JSESSIONID", null);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0); // tells browser to delete it immediately
        response.addCookie(cookie);

        return ResponseEntity.ok("Logged out successfully");
    }
}