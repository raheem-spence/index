package com.raheemspence.controller;

import com.raheemspence.config.SecurityConfig;
import com.raheemspence.dto.request.LoginRequest;
import com.raheemspence.dto.request.SignUpRequest;
import com.raheemspence.dto.response.SignUpResponse;
import com.raheemspence.model.User;
import com.raheemspence.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;


// Means this class handles HTTP requests and returns data (not HTML pages)
@RestController

// Means all routes in this class start with /auth
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(AuthService authService,
                          SecurityContextRepository securityContextRepository) {
        this.authService = authService;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
                                   HttpServletResponse httpResponse,
                                   HttpServletRequest httpRequest,
                                   HttpSession httpSession) {

        // verify user credentials
        User user = authService.login(request);
        httpSession.setAttribute("userId", user.getId());

        // create the Spring Security badge
        // parameters: principal/identity, credentials/password, authorities/roles
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of());

        // create an empty SecurityContext and pin the badge to it
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication((authToken));

        // save the SecurityContext into the session using Spring's repository
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

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