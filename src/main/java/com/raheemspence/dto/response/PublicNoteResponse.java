package com.raheemspence.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class PublicNoteResponse {

    private Long id;
    private String courseName;
    private String title;
    private String content;
    private String ownerFirstName;
    private String ownerLastName;
    private Instant createdAt;
    private Instant updatedAt;
}
