package com.raheemspence.repository;

import com.raheemspence.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByOwnerId(Long ownerId);


    List<Note> findByCourseIdOrderByUpdatedAtDesc(Long courseId);

    @Query("SELECT n FROM Note n JOIN CourseMembership cm ON n.course = cm.course WHERE cm.user.id = :userId ORDER BY n.updatedAt DESC NULLS LAST")
    List<Note> findAccessibleNotesByUserIdLimit5(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT n FROM Note n JOIN CourseMembership cm on n.course = cm.course WHERE cm.user.id = :userId ORDER BY n.updatedAt DESC NULLS LAST")
    List<Note> findAllNotesAccessibleByUser(@Param("userId") Long userId);

    // Get note count for a course
    long countByCourseId(Long courseId);
}
