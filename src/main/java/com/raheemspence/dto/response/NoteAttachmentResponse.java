package com.raheemspence.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteAttachmentResponse {

    private Long id;
    private Long noteId;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private String downloadUrl; // pre-signed GET URL so students can view/download the file
    private Instant createdAt;
}
