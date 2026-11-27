package com.raheemspence.repository;

import com.raheemspence.model.NoteAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NoteAttachmentRepository extends JpaRepository<NoteAttachment, Long> {

    // find all files attached to a specific note, ordered oldest to newest
    List<NoteAttachment> findByNoteIdOrderByCreatedAtAsc(Long noteId);

    // find an attachment by its s3 key (used for cleanup or duplicate checks)
    Optional<NoteAttachment> findByS3Key(String s3Key);

    @Query("SELECT a.note.id, COUNT(a) FROM NoteAttachment a WHERE a.note.id IN :noteIds GROUP BY a.note.id")
    List<Object[]> countAttachmentsByNoteIds(@Param("noteIds") List<Long> noteIds);

    long countByNoteId(Long noteId);
}
