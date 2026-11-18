package com.raheemspence.repository;

import com.raheemspence.model.SavedNote;
import com.raheemspence.model.SavedNoteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedNoteRepository extends JpaRepository<SavedNote, SavedNoteId> {

    // check if user already saved note
    boolean existsByNoteIdAndUserId(Long noteId, Long userId);

    // get all saved notes from newest to oldest for current user
    @Query("SELECT s FROM SavedNote s " +
            "JOIN FETCH s.note n " +
            "JOIN FETCH n.course " +
            "JOIN FETCH n.owner " +
            "WHERE s.userId = :userId " +
            "AND EXISTS (SELECT 1 FROM CourseMembership cm WHERE cm.course.id = n.course.id " +
            "AND cm.user.id = :userId) "+
            " ORDER BY s.createdAt DESC")
    List<SavedNote> findByUserIdWithNotes(@Param("userId") Long userId);
}