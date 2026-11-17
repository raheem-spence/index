package com.raheemspence.controller;

import com.raheemspence.service.NoteReactionService.ReactionResponse;
import com.raheemspence.service.NoteReactionService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/notes/{noteId}/reactions")
public class NoteReactionController {

    private final NoteReactionService noteReactionService;

    public NoteReactionController(NoteReactionService noteReactionService) {
        this.noteReactionService = noteReactionService;
    }

    @GetMapping
    public ReactionResponse getReactionState(@PathVariable Long noteId, HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is unauthorized");
        }

        return noteReactionService.getReactionState(noteId, userId);
    }

    @PostMapping
    public ReactionResponse toggleReaction(@PathVariable Long noteId, HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User must be logged in to view reactions");
        }

        return noteReactionService.toggleReaction(noteId, userId);
    }
}
