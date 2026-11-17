package com.raheemspence.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "note_reactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@IdClass(NoteReactionId.class)
public class NoteReaction {

    @Id
    @Column(name = "note_id")
    private Long noteId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
