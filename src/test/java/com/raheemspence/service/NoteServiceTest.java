package com.raheemspence.service;

import com.raheemspence.dto.request.NoteRequest;
import com.raheemspence.dto.response.NoteResponse;
import com.raheemspence.model.Course;
import com.raheemspence.model.Note;
import com.raheemspence.model.User;
import com.raheemspence.repository.CourseMembershipRepository;
import com.raheemspence.repository.CourseRepository;
import com.raheemspence.repository.NoteRepository;
import com.raheemspence.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;


import java.time.Instant;
import java.util.List;
import java.util.Optional;


import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseMembershipRepository courseMembershipRepository;

    @InjectMocks
    private NoteService noteService;

    // ==================== createNote ====================
    @Test
    void createNoteValidRequestReturnsNoteResponse() {
        // 1. Arrange
        Long userId = 1L;
        Long courseId = 1L;

        User user = new User();
        user.setId(userId);
        user.setFirstName("John");
        user.setLastName("Doe");

        Course course = new Course();
        course.setId(courseId);
        course.setName("Physics");

        String title = "Physics Notes";
        String content = "Chapter 1...";

        NoteRequest noteRequest = new NoteRequest();
        noteRequest.setTitle(title);
        noteRequest.setContent(content);

        Note note = new Note();
        Instant now = Instant.now();

        Long id = 1L;

        note.setId(id);
        note.setTitle(title);
        note.setContent(content);
        note.setOwner(user);
        note.setCourse(course);
        note.setCreatedAt(now);
        note.setUpdatedAt(now);

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        when(noteRepository.save(any(Note.class))).thenReturn(note);

        // 2. Act
        NoteResponse noteResponse = noteService.createNote(userId, courseId, noteRequest);

        // 3. Assert
        assertNotNull(noteResponse);
        assertEquals(title, noteResponse.getTitle());
        assertEquals(content, noteResponse.getContent());
        assertEquals(userId, noteResponse.getOwnerId());
        assertEquals(user.getFirstName(), noteResponse.getOwnerFirstName());
        assertEquals(user.getLastName(), noteResponse.getOwnerLastName());
        assertEquals(courseId, noteResponse.getCourseId());
        assertEquals(course.getName(), noteResponse.getCourseName());
        assertNotNull(noteResponse.getCreatedAt());
        assertNotNull(noteResponse.getUpdatedAt());
    }

    @Test
    void createNoteUserNotMemberThrowsForbidden() {
        // 1. Arrange
        Long userId = 1L;
        Long courseId = 1L;

        NoteRequest noteRequest = new NoteRequest();
        noteRequest.setTitle("Comida");
        noteRequest.setContent("tacos");

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(false);

        // 2/3. Act/Assert
         ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.createNote(userId, courseId, noteRequest);
                });

         assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void createNoteUserDoesNotExistThrowsNotFound() {
        // 1. Arrange
        Long userId = 1L;
        Long courseId = 1L;

        NoteRequest noteRequest = new NoteRequest();
        noteRequest.setTitle("Hola");
        noteRequest.setContent("Como estas?");

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.createNote(userId, courseId, noteRequest);
                });

        // 3. Assert
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

    }

    @Test
    void createNoteCourseDoesNotExistThrowsNotFound() {
        // 1. Arrange
        Long userId = 1L;
        Long courseId = 1L;

        User user = new User();
        user.setId(userId);
        user.setFirstName("Jane");
        user.setLastName("Doe");

        NoteRequest noteRequest = new NoteRequest();
        noteRequest.setTitle("Im tired");
        noteRequest.setContent("go to sleep then");

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.createNote(userId, courseId, noteRequest);
                });

        // 3. Assert
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    // ==================== deleteNote ====================
    @Test
    // happy path
    void deleteNoteValidOwnerDeletesNote() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        User user = new User();
        user.setId(userId);

        Course course = new Course();
        course.setId(courseId);

        Note note = new Note();
        note.setId(noteId);
        note.setCourse(course);
        note.setOwner(user);

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));

        // 2. Act
        noteService.deleteNote(userId, noteId, courseId);

        // 3. Assert
        verify(noteRepository).delete(note);
    }


    // user not a course member -- 403 FORBIDDEN
    @Test
    void deleteNoteUserNotCourseMemberThrowsForbidden() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(false);

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.deleteNote(userId, noteId, courseId);
                });

        // 3. Assert
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    // note doesnt exist -- 404 NOT FOUND
    @Test
    void deleteNoteNoteDoesNotExistThrowsNotFound() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(noteRepository.findById(noteId)).thenReturn(Optional.empty());

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.deleteNote(userId, noteId, courseId);
                });

        // 3. Assert
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    // user is not note owner -- 403 FORBIDDEN
    @Test
    void deleteNoteUserNotNoteOwnerThrowsForbidden() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        User noteOwner = new User();
        noteOwner.setId(2L);

        Course course = new Course();
        course.setId(courseId);

        Note note = new Note();
        note.setId(noteId);
        note.setOwner(noteOwner);
        note.setCourse(course);

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.deleteNote(userId, noteId, courseId);
                });

        // 3. Assert
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    // ==================== updateNote ====================
    @Test
    // happy path
    void updateNoteValidRequestReturnsNoteResponse() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        User user = new User();
        user.setId(userId);
        user.setFirstName("Jojo");
        user.setLastName("Bizarro");

        Course course = new Course();
        course.setId(courseId);
        course.setName("Anime");

        Note note = new Note();
        note.setTitle("Anime characters");
        note.setContent("Who are the best?");
        note.setId(noteId);
        note.setCourse(course);
        note.setOwner(user);
        note.setCreatedAt(Instant.now());

        NoteRequest noteRequest = new NoteRequest();
        noteRequest.setTitle("Anime side characters");
        noteRequest.setContent("Who are the best side characters?");


        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenReturn(note);

        // 2. Act
        NoteResponse noteResponse = noteService.updateNote(userId, noteId, courseId, noteRequest);

        // 3. Assert
        assertNotNull(noteResponse);
        assertEquals(noteRequest.getTitle(), noteResponse.getTitle());
        assertEquals(noteRequest.getContent(), noteResponse.getContent());
        assertEquals(userId, noteResponse.getOwnerId());
        assertEquals(courseId, noteResponse.getCourseId());
        assertEquals(course.getName(), noteResponse.getCourseName());
        assertEquals(note.getCreatedAt(), noteResponse.getCreatedAt());
        assertNotNull(noteResponse.getUpdatedAt());
    }

    // user not a member of course -- 403 FORBIDDEN
    @Test
    void updateNoteUserNotCourseMemberThrowsForbidden() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        NoteRequest noteRequest = new NoteRequest();

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(false);

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.updateNote(userId, noteId, courseId, noteRequest);
                });

        // 3. Assert
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    // note doesnt exist -- 404 NOT FOUND
    @Test
    void updateNoteNoteDoesNotExistThrowsNotFound() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        NoteRequest noteRequest = new NoteRequest();

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(noteRepository.findById(noteId)).thenReturn(Optional.empty());

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.updateNote(userId, noteId, courseId, noteRequest);
                });

        // 3. Assert
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    // user is not note owner thus cannot update note -- 403 FORBIDDEN
    @Test
    void updateNoteUserNotNoteOwnerThrowsForbidden() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        User noteOwner = new User();
        noteOwner.setId(2L);

        Note note = new Note();
        note.setOwner(noteOwner);
        note.setId(noteId);


        NoteRequest noteRequest = new NoteRequest();

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.updateNote(userId, noteId, courseId, noteRequest);
                });

        // 3. Assert
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    // course doesnt exist -- 404 NOT FOUND
    @Test
    void updateNoteCourseDoesNotExistThrowsNotFound() {
        // 1. Arrange
        Long userId = 1L;
        Long noteId = 1L;
        Long courseId = 1L;

        User user = new User();
        user.setId(userId);

        Note note = new Note();
        note.setId(noteId);
        note.setOwner(user);

        NoteRequest noteRequest = new NoteRequest();

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.updateNote(userId, noteId, courseId, noteRequest);
                });

        // 3. Assert
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    // ==================== getRecentNotes ====================
    // happy path
    @Test
    void getRecentNotesValidRequestReturnsNotesList() {
        // 1. Arrange
        Long userId = 1L;

        User user = new User();
        user.setFirstName("Naruto");
        user.setLastName("Uzumaki");
        user.setId(userId);

        Course course = new Course();
        course.setName("Anime");
        course.setId(1L);

        Note note1 = new Note();
        note1.setId(1L);
        note1.setOwner(user);
        note1.setTitle("Sharingan");
        note1.setContent("Sasuke");
        note1.setCreatedAt(Instant.now());
        note1.setUpdatedAt(Instant.now());
        note1.setCourse(course);

        Note note2 = new Note();
        note2.setId(2L);
        note2.setOwner(user);
        note2.setTitle("bakugan");
        note2.setContent("Sakura");
        note2.setCreatedAt(Instant.now());
        note2.setUpdatedAt(Instant.now());
        note2.setCourse(course);

        List<Note> noteList = List.of(note1, note2);

        when(noteRepository.findAccessibleNotesByUserIdLimit5(eq(userId), any(Pageable.class))).thenReturn(noteList);

        // 2. Act
        List<NoteResponse> recentNotesResponse = noteService.getRecentNotes(userId);

        // 3. Assert
        assertNotNull(recentNotesResponse);
        assertEquals(noteList.size(), recentNotesResponse.size());
        assertEquals(noteList.getFirst().getTitle(), recentNotesResponse.getFirst().getTitle());
        assertEquals(noteList.getFirst().getContent(), recentNotesResponse.getFirst().getContent());
        assertEquals(noteList.getFirst().getOwner().getId(), recentNotesResponse.getFirst().getOwnerId());
        assertEquals(noteList.getFirst().getCourse().getId(), recentNotesResponse.getFirst().getCourseId());
        assertEquals(noteList.getFirst().getCourse().getName(), recentNotesResponse.getFirst().getCourseName());
        assertEquals(noteList.getFirst().getOwner().getFirstName(), recentNotesResponse.getFirst().getOwnerFirstName());
        assertEquals(noteList.getFirst().getOwner().getLastName(), recentNotesResponse.getFirst().getOwnerLastName());
        assertEquals(noteList.getFirst().getCreatedAt(), recentNotesResponse.getFirst().getCreatedAt());
        assertEquals(noteList.getFirst().getUpdatedAt(), recentNotesResponse.getFirst().getUpdatedAt());
        assertEquals(noteList.get(1).getTitle(), recentNotesResponse.get(1).getTitle());
        assertEquals(noteList.get(1).getContent(), recentNotesResponse.get(1).getContent());
        assertEquals(noteList.get(1).getOwner().getId(), recentNotesResponse.get(1).getOwnerId());
        assertEquals(noteList.get(1).getCourse().getId(), recentNotesResponse.get(1).getCourseId());
        assertEquals(noteList.get(1).getCourse().getName(), recentNotesResponse.get(1).getCourseName());
        assertEquals(noteList.get(1).getOwner().getFirstName(), recentNotesResponse.get(1).getOwnerFirstName());
        assertEquals(noteList.get(1).getOwner().getLastName(), recentNotesResponse.get(1).getOwnerLastName());
        assertEquals(noteList.get(1).getCreatedAt(), recentNotesResponse.get(1).getCreatedAt());
        assertEquals(noteList.get(1).getUpdatedAt(), recentNotesResponse.get(1).getUpdatedAt());
    }

    // notes list empty
    @Test
    void getRecentNotesValidRequestReturnsEmptyList() {
        // 1. Arrange
        Long userId = 1L;

        when(noteRepository.findAccessibleNotesByUserIdLimit5(eq(userId), any(Pageable.class))).thenReturn(List.of());

        // 2. Act
        List<NoteResponse> emptyList = noteService.getRecentNotes(userId);

        // 3. Assert
        assertNotNull(emptyList);
        assertTrue(emptyList.isEmpty());
    }

    // ==================== getNotesByCourseId ====================
    // happy path
    @Test
    void getNotesByCourseIdReturnsNotesList() {
        // 1. Arrange
        Long userId = 1L;
        Long courseId = 1L;

        Course course = new Course();
        course.setName("Jamaican History");
        course.setId(courseId);

        User user1 = new User();
        user1.setId(1L);
        user1.setFirstName("Ra");
        user1.setLastName("Ra");

        User user2 = new User();
        user2.setId(2L);
        user2.setFirstName("Heem");
        user2.setLastName("Boy");

        Note note1 = new Note();
        note1.setId(1L);
        note1.setCourse(course);
        note1.setTitle("Jamaica");
        note1.setContent("Coconut Milk");
        note1.setOwner(user1);
        note1.setCreatedAt(Instant.parse("2026-10-10T10:00:00Z"));
        note1.setUpdatedAt(Instant.parse("2026-10-12T10:00:00Z"));

        Note note2 = new Note();
        note2.setId(2L);
        note2.setCourse(course);
        note2.setTitle("Ackee and Saltfish");
        note2.setContent("Food");
        note2.setOwner(user2);
        note2.setCreatedAt(Instant.parse("2017-09-05T10:00:00Z"));
        note2.setUpdatedAt(Instant.parse("2026-10-12T10:43:00Z"));

        List<Note> noteList = List.of(note2, note1);

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(noteRepository.findByCourseIdOrderByUpdatedAtDesc(courseId)).thenReturn(noteList);

        // 2. Act
        List<NoteResponse> noteResponse = noteService.getNotesByCourseId(userId, courseId);

        // 3. Assert
        assertNotNull(noteResponse);
        assertEquals(noteList.size(), noteResponse.size());
        assertEquals(noteList.get(0).getOwner().getId(), noteResponse.get(0).getOwnerId());
        assertEquals(noteList.get(0).getOwner().getFirstName(), noteResponse.get(0).getOwnerFirstName());
        assertEquals(noteList.get(0).getOwner().getLastName(), noteResponse.get(0).getOwnerLastName());
        assertEquals(noteList.get(0).getId(), noteResponse.get(0).getId());
        assertEquals(noteList.get(0).getTitle(), noteResponse.get(0).getTitle());
        assertEquals(noteList.get(0).getContent(), noteResponse.get(0).getContent());
        assertEquals(noteList.get(0).getCourse().getName(), noteResponse.get(0).getCourseName());
        assertEquals(noteList.get(0).getCourse().getId(), noteResponse.get(0).getCourseId());
        assertEquals(noteList.get(0).getCreatedAt(), noteResponse.get(0).getCreatedAt());
        assertEquals(noteList.get(0).getUpdatedAt(), noteResponse.get(0).getUpdatedAt());

        assertEquals(noteList.get(1).getOwner().getId(), noteResponse.get(1).getOwnerId());
        assertEquals(noteList.get(1).getOwner().getFirstName(), noteResponse.get(1).getOwnerFirstName());
        assertEquals(noteList.get(1).getOwner().getLastName(), noteResponse.get(1).getOwnerLastName());
        assertEquals(noteList.get(1).getId(), noteResponse.get(1).getId());
        assertEquals(noteList.get(1).getTitle(), noteResponse.get(1).getTitle());
        assertEquals(noteList.get(1).getContent(), noteResponse.get(1).getContent());
        assertEquals(noteList.get(1).getCourse().getName(), noteResponse.get(1).getCourseName());
        assertEquals(noteList.get(1).getCourse().getId(), noteResponse.get(1).getCourseId());
        assertEquals(noteList.get(1).getCreatedAt(), noteResponse.get(1).getCreatedAt());
        assertEquals(noteList.get(1).getUpdatedAt(), noteResponse.get(1).getUpdatedAt());

    }

    // notes list empty
    @Test
    void getNotesByCourseIdReturnsEmptyList() {
        // 1. Arrange
        Long userId = 1L;
        Long courseId = 1L;

        Course course = new Course();
        course.setId(courseId);

        List<Note> emptyList = List.of();

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(noteRepository.findByCourseIdOrderByUpdatedAtDesc(courseId)).thenReturn(emptyList);

        // 2. Act
        List<NoteResponse> emptyNoteResponse = noteService.getNotesByCourseId(userId, courseId);

        // 3. Assert
        assertNotNull(emptyNoteResponse);
        assertTrue(emptyNoteResponse.isEmpty());
    }

    // user not member 403 -- FORBIDDEN
    @Test
    void getNotesByCourseIdUserNotCourseMemberThrowsForbidden() {
        // 1. Arrange
        Long userId = 1L;
        Long courseId = 1L;

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(false);

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.getNotesByCourseId(userId, courseId);
                });

        // 3. Assert
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    // course note found 404 -- NOT FOUND
    @Test
    void getNotesByCourseIdCourseDoesNotExistThrowsNotFound() {
        // 1. Arrange
        Long userId = 1L;
        Long courseId = 1L;

        when(courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)).thenReturn(true);
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());

        // 2. Act
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> {
                    noteService.getNotesByCourseId(userId, courseId);
                });

        // 3. Assert
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }
}