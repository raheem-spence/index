package com.raheemspence.service;


import com.raheemspence.model.Note;
import com.raheemspence.model.SavedNote;
import com.raheemspence.model.SavedNoteId;
import com.raheemspence.repository.NoteRepository;
import com.raheemspence.repository.SavedNoteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.time.Instant;
import java.util.List;

@Service
public class SavedNoteService {

    private final SavedNoteRepository savedNoteRepository;
    private final NoteRepository noteRepository;

    public SavedNoteService(SavedNoteRepository savedNoteRepository, NoteRepository noteRepository) {
        this.savedNoteRepository = savedNoteRepository;
        this.noteRepository = noteRepository;
    }

    public record SavedNoteSummaryDTO(Long noteId,
                                      String title,
                                      String courseName,
                                      String ownerFirstName,
                                      String ownerLastName,
                                      Instant createdAt,
                                      Instant updatedAt) {}

    public record SaveStatusResponse(boolean saved) {}

    // Get all saved notes from user
    public List<SavedNoteSummaryDTO> getSavedNotes(Long userId) {

        List<SavedNote> savedNotes =  savedNoteRepository.findByUserIdWithNotes(userId);

        return savedNotes.stream()
                .map(savedNote -> {
                    Note note = savedNote.getNote();
                    return new SavedNoteSummaryDTO(
                            note.getId(),
                            note.getTitle(),
                            note.getCourse().getName(),
                            note.getOwner().getFirstName(),
                            note.getOwner().getLastName(),
                            note.getCreatedAt(),
                            note.getUpdatedAt()
                    );
                }).
                toList();
    }

    // Get saved state
    public SaveStatusResponse hasUserSaved(Long noteId, Long userId) {
        return new SaveStatusResponse(savedNoteRepository.existsByNoteIdAndUserId(noteId, userId));
    }


    // Save a note
    @Transactional
    public SaveStatusResponse toggleSave(Long noteId, Long userId) {

        if (!noteRepository.existsById(noteId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Note not found"
            );
        }

        // Check saved status
        boolean saved =  savedNoteRepository.existsByNoteIdAndUserId(noteId, userId);

        // if note is saved, delete it, else save it
        if (saved) {
            savedNoteRepository.deleteById(new SavedNoteId(noteId, userId));
            return new SaveStatusResponse(false);
        } else {
            SavedNote savedNote = new SavedNote();

            savedNote.setNoteId(noteId);
            savedNote.setUserId(userId);

            savedNoteRepository.save(savedNote);
            return new SaveStatusResponse(true);
        }
    }
}
