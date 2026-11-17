package com.raheemspence.repository;

import com.raheemspence.model.NoteReaction;
import com.raheemspence.model.NoteReactionId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteReactionRepository extends JpaRepository<NoteReaction, NoteReactionId> {

    // check if user already reacted to a note
    boolean existsByNoteIdAndUserId(Long noteId, Long userId);

    // count how many total reactions a note has
    long countByNoteId(Long noteId);
}
