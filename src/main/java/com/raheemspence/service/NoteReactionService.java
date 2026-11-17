package com.raheemspence.service;

import com.raheemspence.model.NoteReaction;
import com.raheemspence.model.NoteReactionId;
import com.raheemspence.repository.NoteReactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoteReactionService {

    private final NoteReactionRepository noteReactionRepository;

    public NoteReactionService(NoteReactionRepository noteReactionRepository) {
        this.noteReactionRepository = noteReactionRepository;
    }

    public long getReactionCount(Long noteId) {
        return noteReactionRepository.countByNoteId(noteId);
    }

    public record ReactionResponse(boolean reacted, long count) {}

    @Transactional
    public ReactionResponse toggleReaction(Long noteId, Long userId) {
        boolean exists = noteReactionRepository.existsByNoteIdAndUserId(noteId, userId);

        if (exists) {
            noteReactionRepository.deleteById(new NoteReactionId(noteId, userId));
        } else {
            NoteReaction noteReaction = new NoteReaction();

            noteReaction.setNoteId(noteId);
            noteReaction.setUserId(userId);

            noteReactionRepository.save(noteReaction);
        }

        return new ReactionResponse(!exists, getReactionCount(noteId));
    }

    public boolean hasUserReacted(Long noteId, Long userId) {
        return noteReactionRepository.existsByNoteIdAndUserId(noteId, userId);
    }

    public ReactionResponse getReactionState(Long noteId, Long userId) {
        long count = getReactionCount(noteId);
        boolean hasReacted = hasUserReacted(noteId, userId);
        return new ReactionResponse(hasReacted, count);
    }
}
