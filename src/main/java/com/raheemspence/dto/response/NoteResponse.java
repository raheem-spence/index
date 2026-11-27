package com.raheemspence.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class NoteResponse {

    private Long id;
    private String title;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;
    private Long ownerId;
    private String ownerFirstName;
    private String ownerLastName;
    private String courseName;
    private Long courseId;
    private Long attachmentCount;
    private Boolean isPublic;
}
