package com.raheemspence.mapper;

import com.raheemspence.dto.response.PublicNoteResponse;
import com.raheemspence.model.Note;
import org.springframework.stereotype.Component;

@Component
public class PublicNoteMapper {

    public PublicNoteResponse mapToPublicNoteResponse(Note note) {

        if (note == null) return  null;

        PublicNoteResponse publicNoteResponse = new PublicNoteResponse();
        publicNoteResponse.setContent(note.getContent());
        publicNoteResponse.setCourseName(note.getCourse().getName());
        publicNoteResponse.setId(note.getId());
        publicNoteResponse.setTitle(note.getTitle());
        publicNoteResponse.setOwnerFirstName(note.getOwner().getFirstName());
        publicNoteResponse.setOwnerLastName(note.getOwner().getLastName());
        publicNoteResponse.setCreatedAt(note.getCreatedAt());
        publicNoteResponse.setUpdatedAt(note.getUpdatedAt());

        return publicNoteResponse;
    }
}
