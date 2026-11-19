package com.raheemspence.controller;

import com.raheemspence.dto.request.PresignedUploadRequest;
import com.raheemspence.dto.response.NoteAttachmentResponse;
import com.raheemspence.dto.response.PresignedUploadResponse;
import com.raheemspence.service.NoteAttachmentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/notes/{noteId}/attachments")
public class NoteAttachmentController {

    private final NoteAttachmentService noteAttachmentService;

    public NoteAttachmentController(NoteAttachmentService noteAttachmentService) {
        this.noteAttachmentService = noteAttachmentService;
    }

    @GetMapping
    public List<NoteAttachmentResponse> getNoteAttachments(@PathVariable Long noteId, HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized.");
        }

        return noteAttachmentService.getAttachmentsForNote(noteId, userId);
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public NoteAttachmentResponse confirmUpload(@PathVariable Long noteId,
                                                @RequestBody PresignedUploadRequest presignedUploadRequest,
                                                @RequestParam String s3Key,
                                                HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized.");
        }

        return noteAttachmentService.saveAttachment(noteId, userId, presignedUploadRequest, s3Key);
    }

    @PostMapping("/presign")
    public PresignedUploadResponse requestUpload(@PathVariable Long noteId,
                                                 @RequestBody PresignedUploadRequest presignedUploadRequest,
                                                 HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized.");
        }

        return noteAttachmentService.generatePresignedUploadUrl(noteId, userId, presignedUploadRequest);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{attachmentId}")
    public void deleteAttachment(@PathVariable Long noteId,
                                 @PathVariable Long attachmentId,
                                 HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized");
        }

        noteAttachmentService.deleteAttachment(noteId, userId, attachmentId);
    }
}
