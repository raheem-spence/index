package com.raheemspence.exception;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

/*
    This annotation means this class handles errors for ALL controllers

    The entire thing catches validation errors and returns structured JSON withe field messages
 */
@CrossOrigin(origins = "*")
@RestControllerAdvice
public class GlobalExceptionHandler {

    /*
        @ExceptionHandler means this method runs when a specific exception happens

        MethodArgumentNotValidException means Spring throws this when @Valid fails
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)

    // ResponseEntity lets me control HTTP status + response body
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Validation failed");
        response.put("errors", errors);

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}
