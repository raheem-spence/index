package com.raheemspence.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.Singular;

@Getter
@Setter
public class CreateCourseRequest {

    @NotBlank(message = "Course name is required")
    @Size(min = 2, max = 80, message = "Course name must be between 2 and 80 characters")
    @Pattern(
            regexp = ".*[a-zA-Z].*",
            message = "Course name must contain at least one letter"
    )
    private String courseName;

    @Size(max = 100, message = "School name cannot exceed 100 characters")
    private String school;
}
