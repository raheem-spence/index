package com.raheemspence.model;

import lombok.*;

import java.io.Serializable;

@NoArgsConstructor
@EqualsAndHashCode
@AllArgsConstructor
@Getter
@Setter
public class NoteReactionId implements Serializable {

    private Long noteId;
    private Long userId;

}
