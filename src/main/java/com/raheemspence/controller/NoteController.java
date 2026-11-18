package com.raheemspence.controller;

import com.raheemspence.dto.request.NoteRequest;
import com.raheemspence.dto.response.NoteResponse;
import com.raheemspence.model.Note;
import com.raheemspence.service.NoteService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


import java.util.List;

@CrossOrigin(origins = "http://127.0.0.1:5500")
@RestController
@RequestMapping("/courses")
public class NoteController {

    private final NoteService noteService;


    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping("/notes/all")
    public List<NoteResponse> getAllNotes(HttpSession httpSession) {
        // Get user by id
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            return List.of();
        }

        return noteService.getAllNotes(userId);
    }

    @GetMapping("/notes")
    public List<NoteResponse> getRecentNotes(HttpSession httpSession) {
        // Get user by id
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            return List.of();
        }

        return noteService.getRecentNotes(userId);
    }

    @GetMapping("/notes/{noteId}")
    public NoteResponse getNoteById(@PathVariable Long noteId, HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized");
        }

        return noteService.getNoteById(noteId);
    }

    @GetMapping("/{courseId}/notes")
    public List<NoteResponse> getNotes(@PathVariable Long courseId, HttpSession httpSession) {

        // Get user by id
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            return List.of();
        }
        return noteService.getNotesByCourseId(userId, courseId);
    }

    /*
        @RequestBody tells Spring to take the incoming HTTP request JSON body and convert it into a Java object (dto)

        @Valid tells Spring that before calling my method, validate the request body using annotations like @NotBlank
     */
    @PostMapping("/{courseId}/notes")
    public NoteResponse createNote(@Valid @RequestBody NoteRequest noteRequest, @PathVariable Long courseId,
                                   HttpSession httpSession) {
        // Get user id
        Long userId = (Long) httpSession.getAttribute("userId");

        return noteService.createNote(userId, courseId, noteRequest);

    }

    @DeleteMapping("/{courseId}/notes/{noteId}")
    public void deleteNote(@PathVariable Long noteId, @PathVariable Long courseId, HttpSession httpSession) {
        // Get user id
        Long userId = (Long) httpSession.getAttribute("userId");

        noteService.deleteNote(userId, noteId, courseId);
    }

    /*
        @PathVariable takes data from the URL and passes it into a method parameter
     */
    @PutMapping("/{courseId}/notes/{noteId}")
    public NoteResponse updateNote(@PathVariable Long noteId,
                                   @Valid @RequestBody NoteRequest noteRequest,
                                   HttpSession httpSession, @PathVariable Long courseId) {
        // Get user id from session
        Long userId = (Long) httpSession.getAttribute("userId");

        return noteService.updateNote(userId, noteId, courseId, noteRequest);
    }
}
