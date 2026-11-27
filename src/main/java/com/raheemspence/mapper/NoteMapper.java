package com.raheemspence.mapper;

import com.raheemspence.dto.response.NoteResponse;
import com.raheemspence.model.Note;
import org.springframework.stereotype.Component;

@Component
public class NoteMapper {

    public NoteResponse mapToNoteResponse(Note note) {
        if (note == null) return null;

        NoteResponse noteResponse = new NoteResponse();
        noteResponse.setTitle(note.getTitle());
        noteResponse.setContent(note.getContent());
        noteResponse.setId(note.getId());
        noteResponse.setCourseName(note.getCourse().getName());
        noteResponse.setOwnerId(note.getOwner().getId());
        noteResponse.setCreatedAt(note.getCreatedAt());
        noteResponse.setUpdatedAt(note.getUpdatedAt());
        noteResponse.setAttachmentCount(noteResponse.getAttachmentCount());
        noteResponse.setOwnerFirstName(note.getOwner().getFirstName());
        noteResponse.setOwnerLastName(note.getOwner().getLastName());

        return noteResponse;
    }
}
