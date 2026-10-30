package com.raheemspence.repository;

import com.raheemspence.model.Course;
import com.raheemspence.model.Note;
import com.raheemspence.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByJoinCode(String joinCode);

    List<Course> findByCreatorId(Long creatorId);

    @Query("SELECT c FROM Course c JOIN CourseMembership cm on cm.course = c WHERE cm.user.id = :userId ORDER BY cm.joinedAt DESC")
    List<Course> findAccessibleCoursesByUserId(@Param("userId") Long userId, Pageable pageable);

    Boolean existsByJoinCode(String joinCode);
}
