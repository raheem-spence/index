package com.raheemspence.dto.response;


import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class CourseResponse {
    private Long id;
    private String name;
    private String school;
    private Long memberCount;
    private Long noteCount;
    private String joinCode;
}
