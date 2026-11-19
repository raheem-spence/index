package com.raheemspence.repository;

import com.raheemspence.model.NoteAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteAttachmentRepository extends JpaRepository<NoteAttachment, Long> {

    // find all files attached to a specific note, ordered oldest to newest
    List<NoteAttachment> findByNoteIdOrderByCreatedAtAsc(Long noteId);

    // find an attachment by its s3 key (used for cleanup or duplicate checks)
    Optional<NoteAttachment> findByS3Key(String s3Key);
}
