package com.raheemspence.controller;

import com.raheemspence.service.SavedNoteService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.raheemspence.service.SavedNoteService.SavedNoteSummaryDTO;
import com.raheemspence.service.SavedNoteService.SaveStatusResponse;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/notes")
public class SavedNoteController {

    private final SavedNoteService savedNoteService;

    public SavedNoteController(SavedNoteService savedNoteService) {
        this.savedNoteService = savedNoteService;
    }

    // get saved note state
    @GetMapping("/{noteId}/save")
    public SaveStatusResponse getSavedState(@PathVariable Long noteId, HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized");
        }

        return savedNoteService.hasUserSaved(noteId, userId);
    }

    // get all saved notes for user
    @GetMapping("/saved")
    public List<SavedNoteSummaryDTO> getSavedNotes(HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized");
        }

        return savedNoteService.getSavedNotes(userId);
    }

    @PostMapping("/{noteId}/save")
    public SaveStatusResponse toggleSave(@PathVariable Long noteId, HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized");
        }

        return savedNoteService.toggleSave(noteId, userId);
    }
}
