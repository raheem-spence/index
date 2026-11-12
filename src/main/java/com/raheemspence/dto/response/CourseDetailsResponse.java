package com.raheemspence.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseDetailsResponse {
    private Long id;
    private String name;
    private Long memberCount;
    private Long noteCount;
    private String joinCode;
    private String school;
}
