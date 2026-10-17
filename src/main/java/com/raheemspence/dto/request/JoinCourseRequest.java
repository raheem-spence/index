package com.raheemspence.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JoinCourseRequest {

    @NotBlank(message = "Join code cannot be empty")
    private String joinCode;

}
