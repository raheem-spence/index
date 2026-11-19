package com.raheemspence.service;

import com.raheemspence.dto.request.PresignedUploadRequest;
import com.raheemspence.dto.response.NoteAttachmentResponse;
import com.raheemspence.dto.response.PresignedUploadResponse;
import com.raheemspence.model.Note;
import com.raheemspence.model.NoteAttachment;
import com.raheemspence.repository.CourseMembershipRepository;
import com.raheemspence.repository.NoteAttachmentRepository;
import com.raheemspence.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoteAttachmentService {

    private final NoteRepository noteRepository;
    private final NoteAttachmentRepository noteAttachmentRepository;
    private final CourseMembershipRepository courseMembershipRepository;
    private final S3Presigner s3Presigner;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    // max file size allowed: 25MB in bytes
    private static final long MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

    // 1. generate a pre-signed PUT URL for uploading directly to S3
    public PresignedUploadResponse generatePresignedUploadUrl(Long noteId, Long userId, PresignedUploadRequest request) {
        // find the note
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found with id: " + noteId));

        // only the note owner can upload attachments
        if (!note.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner of this note can upload attachments.");
        }

        // validate file size
        if (request.getFileSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds maximum limit of 25MB.");
        }

        // sanitize file name and create a collision-proof S3 key
        String cleanName = request.getFileName().replaceAll("[^a-zA-Z0-9._-]", "_");
        String s3Key = "courses/" + note.getCourse().getId() + "/notes/" + noteId + "/" + UUID.randomUUID() + "-" + cleanName;

        // build the AWS PutObjectRequest
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(request.getContentType())
                .build();

        // create the pre-sign request with 10min expiration
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))
                .putObjectRequest(objectRequest)
                .build();

        // generate the signed URL via S3Presigner
        PresignedPutObjectRequest presignedPutObjectRequest = s3Presigner.presignPutObject(presignRequest);
        String uploadUrl = presignedPutObjectRequest.url().toString();

        return new PresignedUploadResponse(uploadUrl, s3Key);
    }

    // 2. save attachment metadata to the database after successful S3 upload
    @Transactional
    public NoteAttachmentResponse saveAttachment(Long noteId, Long userId, PresignedUploadRequest request, String s3Key) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found with id: " + noteId));

        if (!note.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner of this note can attach files.");
        }

        NoteAttachment noteAttachment = NoteAttachment.builder()
                .note(note)
                .fileName(request.getFileName())
                .s3Key(s3Key)
                .contentType(request.getContentType())
                .fileSize(request.getFileSize())
                .build();

        NoteAttachment saved = noteAttachmentRepository.save(noteAttachment);

        // generate a fresh download URL so the frontend can immediately preview it
        String downloadUrl = generatePresignedDownloadUrl(saved.getS3Key());

        return mapToResponse(saved, downloadUrl);
    }

    // 3. fetch all attachments for a note with temporary download URLs
    @Transactional(readOnly = true)
    public List<NoteAttachmentResponse> getAttachmentsForNote(Long noteId, Long userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found with id: " + noteId));

        // user must be a member of this course to view attachments
        boolean isMember = courseMembershipRepository.existsByUserIdAndCourseId(userId, note.getCourse().getId());
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to attachments for this course.");
        }

        List<NoteAttachment> attachments = noteAttachmentRepository.findByNoteIdOrderByCreatedAtAsc(noteId);

        return attachments.stream()
                .map(att -> mapToResponse(att, generatePresignedDownloadUrl(att.getS3Key())))
                .toList();
    }

    @Transactional
    public void deleteAttachment(Long noteId, Long userId, Long attachmentId) {
        NoteAttachment noteAttachment = noteAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        if (!noteAttachment.getNote().getId().equals(noteId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment does not belong to this note");
        }

        if (!noteAttachment.getNote().getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the note owner can delete attachments");
        }

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(noteAttachment.getS3Key())
                .build();
        s3Client.deleteObject(deleteObjectRequest);

        noteAttachmentRepository.delete(noteAttachment);
    }

    // helper to generate a temporary pre-signed GET URL valid for 15min
    public String generatePresignedDownloadUrl(String s3Key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner.presignGetObject(presignRequest);

        return presignedGetObjectRequest.url().toString();
    }

    // helper to convert NoteAttachment Entity to NoteAttachmentResponse
    private NoteAttachmentResponse mapToResponse(NoteAttachment attachment, String downloadUrl) {
        return NoteAttachmentResponse.builder()
                .id(attachment.getId())
                .noteId(attachment.getNote().getId())
                .fileName(attachment.getFileName())
                .contentType(attachment.getContentType())
                .fileSize(attachment.getFileSize())
                .downloadUrl(downloadUrl)
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
