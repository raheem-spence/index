package com.raheemspence.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JoinCourseRequest {

    @NotBlank(message = "Join code cannot be empty")
    @Pattern(regexp = "^[A-Za-z0-9]{6}$", message = "Join code must be 6 alphanumeric characters")
    private String joinCode;
}
