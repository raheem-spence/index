package com.raheemspence.service;

import com.raheemspence.dto.request.LoginRequest;
import com.raheemspence.dto.request.SignUpRequest;
import com.raheemspence.dto.response.SignUpResponse;
import com.raheemspence.model.User;
import com.raheemspence.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


/*
    This annotation is for business logic. It marks a class as a Spring managed business logic component that Spring
    automatically creates and injects where needed, otherwise we would have to manually do new AuthService() because
    Spring would ignore this class without the annotation.
 */
@Service
public class AuthService {

    /*
        We use final for safety because we dont want our repo to accidentally change like userRepository = null or
        something. Using final makes this dependency fixed for the lifetime of the service.

        Spring automatically provides objects (dependencies) to a class instead of a class creating them manually aka
        dependency injection
     */
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Signup Logic
    public SignUpResponse signup(SignUpRequest request) {
        SignUpResponse signUpResponse = new SignUpResponse();
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {

            signUpResponse.setStatus("Error");
            signUpResponse.setMessage("Email already exists.");

            return signUpResponse;
        }

        if(!request.getPassword().equals(request.getConfirmPassword())) {

            signUpResponse.setStatus("Error");
            signUpResponse.setMessage("Passwords do not match");

            return signUpResponse;
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(hashedPassword);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        userRepository.save(user);

        signUpResponse.setStatus("Success");
        signUpResponse.setMessage("User created successfully");

        return signUpResponse;
    }

    // Login logic
    public User login(LoginRequest request) {

        // Find user by email, throw exception if credentials invalid
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid credentials"
                ));


        if(!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Optional.of means im creating an Optional (container) that definitely contains a value so it must not be null
            // In other words, its like saying here is a box and i guarantee there is something inside it
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid credentials"
            );
        }

        return user;
    }

}
