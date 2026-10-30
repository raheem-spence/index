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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseMembershipRepository courseMembershipRepository;

    public NoteService(NoteRepository noteRepository,
                       UserRepository userRepository,
                       CourseRepository courseRepository,
                       CourseMembershipRepository courseMembershipRepository) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.courseMembershipRepository = courseMembershipRepository;
    }

    public List<NoteResponse> getAllNotes(Long userId) {
        List<Note> allNotes = noteRepository.findAllNotesAccessibleByUser(userId);

        List<NoteResponse> allNotesResponse = new ArrayList<>();

        for (Note note: allNotes) {
            NoteResponse noteResponse = new NoteResponse();

            noteResponse.setId(note.getId());
            noteResponse.setTitle(note.getTitle());
            noteResponse.setContent(note.getContent());
            noteResponse.setCreatedAt(note.getCreatedAt());
            noteResponse.setUpdatedAt(note.getUpdatedAt());
            noteResponse.setOwnerId(note.getOwner().getId());
            noteResponse.setOwnerFirstName(note.getOwner().getFirstName());
            noteResponse.setOwnerLastName(note.getOwner().getLastName());
            noteResponse.setCourseName(note.getCourse().getName());
            noteResponse.setCourseId(note.getCourse().getId());

            allNotesResponse.add(noteResponse);
        }

        return allNotesResponse;
    }

    public List<NoteResponse> getRecentNotes(Long userId) {

        Pageable pageable = PageRequest.of(0, 5);

        List<Note> recentNotes = noteRepository.findAccessibleNotesByUserIdLimit5(userId, pageable);

        List<NoteResponse> recentNotesResponse = new ArrayList<>();

        for (Note note: recentNotes) {
            Long id = note.getId();
            String title = note.getTitle();
            String content = note.getContent();
            Instant createdAt = note.getCreatedAt();
            Instant updatedAt = note.getUpdatedAt();
            Long ownerId = note.getOwner().getId();
            String firstName = note.getOwner().getFirstName();
            String lastName = note.getOwner().getLastName();

            NoteResponse noteResponse = new NoteResponse();

            noteResponse.setId(id);
            noteResponse.setTitle(title);
            noteResponse.setContent(content);
            noteResponse.setCreatedAt(createdAt);
            noteResponse.setUpdatedAt(updatedAt);
            noteResponse.setOwnerId(ownerId);
            noteResponse.setOwnerFirstName(firstName);
            noteResponse.setOwnerLastName(lastName);
            noteResponse.setCourseId(note.getCourse().getId());
            noteResponse.setCourseName(note.getCourse().getName());

            recentNotesResponse.add(noteResponse);

        }

        return recentNotesResponse;
    }

    public List<NoteResponse> getNotesByCourseId(Long userId, Long courseId) {
        // Check if user is a member of the course
        if (!courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have access to course"
            );
        }

        // Get course
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found")
                );

        // Get notes as a list
        List<Note> notes = noteRepository.findByCourseIdOrderByUpdatedAtDesc(courseId);

        // Create new list to store NoteResponse dto's
        List<NoteResponse> noteResponseList = new ArrayList<>();

        // Loop through list of notes and retrieve fields to populate NoteResponse dto's
        for (Note note: notes) {
            Long id = note.getId();
            String title = note.getTitle();
            String content = note.getContent();
            Instant createdAt = note.getCreatedAt();
            Instant updatedAt = note.getUpdatedAt();
            Long ownerId = note.getOwner().getId();
            String firstName = note.getOwner().getFirstName();
            String lastName = note.getOwner().getLastName();

            // Create NoteResponse dto
            NoteResponse noteResponse = new NoteResponse();

            // Populate dto
            noteResponse.setId(id);
            noteResponse.setTitle(title);
            noteResponse.setContent(content);
            noteResponse.setCreatedAt(createdAt);
            noteResponse.setUpdatedAt(updatedAt);
            noteResponse.setOwnerId(ownerId);
            noteResponse.setOwnerFirstName(firstName);
            noteResponse.setOwnerLastName(lastName);
            noteResponse.setCourseId(course.getId());
            noteResponse.setCourseName(course.getName());

            // Add dto to list
            noteResponseList.add(noteResponse);
        }

        return noteResponseList;
    }

    public NoteResponse createNote(Long userId, Long courseId, NoteRequest noteRequest) {
        // Check if user is member of the course
        if (!courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have access to course"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found")
                );

        Note note = new Note();

        Instant now = Instant.now();

        note.setTitle(noteRequest.getTitle());
        note.setContent(noteRequest.getContent());
        note.setOwner(user);
        note.setCourse(course);
        note.setCreatedAt(now);
        note.setUpdatedAt(now);


        Note savedNote = noteRepository.save(note);

        NoteResponse noteResponse = new NoteResponse();

        noteResponse.setTitle(savedNote.getTitle());
        noteResponse.setContent(savedNote.getContent());
        noteResponse.setOwnerId(userId);
        noteResponse.setOwnerFirstName(user.getFirstName());
        noteResponse.setOwnerLastName(user.getLastName());
        noteResponse.setCreatedAt(savedNote.getCreatedAt());
        noteResponse.setUpdatedAt(savedNote.getUpdatedAt());
        noteResponse.setId(savedNote.getId());
        noteResponse.setCourseId(course.getId());
        noteResponse.setCourseName(course.getName());

        return noteResponse;

    }

    public void deleteNote(Long userId, Long noteId, Long courseId) {
        // Check if user is member of the course
        if (!courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have access to course"
            );
        }

        // Get note else throw exception 404 NOT FOUND
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));

        // Check if user is allowed to delete note else throw 403 FORBIDDEN
        if (!note.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to delete this note"
            );
        }
        noteRepository.delete(note);
    }

    public NoteResponse updateNote(Long userId, Long noteId, Long courseId, NoteRequest noteRequest) {
        // Check if user is member of the course
        if (!courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not have access to course"
            );
        }

        // Get note else throw exception 404 NOT FOUND
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));

        // Check if user is allowed to update note else throw 403 FORBIDDEN
        if (!note.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
            "You are not allowed to update this note"
            );
        }

        // Get course
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found")
                );


        // Set title and content from NoteRequest
        Instant now = Instant.now();
        note.setTitle(noteRequest.getTitle());
        note.setContent(noteRequest.getContent());
        note.setCourse(course);
        note.setUpdatedAt(now);

        Note savedNote = noteRepository.save(note);

        NoteResponse noteResponse = new NoteResponse();
        noteResponse.setId(savedNote.getId());
        noteResponse.setTitle(savedNote.getTitle());
        noteResponse.setContent(savedNote.getContent());
        noteResponse.setOwnerId(savedNote.getOwner().getId());
        noteResponse.setOwnerFirstName(savedNote.getOwner().getFirstName());
        noteResponse.setOwnerLastName(savedNote.getOwner().getLastName());
        noteResponse.setCreatedAt(savedNote.getCreatedAt());
        noteResponse.setCourseName(course.getName());
        noteResponse.setCourseId(courseId);
        noteResponse.setUpdatedAt(savedNote.getUpdatedAt());

        return noteResponse;
    }
}


