package com.raheemspence.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "notes")
@Getter
@Setter
@NoArgsConstructor
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many notes belong to one user
    /*
        This annotation means many instances of this entity can be associated with one instance of another entity

        Fetching means loading data from the db. Lazy means only load the User if someone asks for it, so dont load it
        right away. Lazy is used because say we have 1000 notes, if every note automatically loaded owner, permissions,
        etc. you'd get tons of data you may never use. Lazy avoids that -- leads to less data, less memory, faster queries,
        more control.

        ManytoOne means many Note objects can reference one User object
     */
    @ManyToOne(fetch = FetchType.LAZY)

    /* Means which db column stores the foreign key for this relationship. Tells hibernate that the column below is
    the foreign key. W/o it hibernate has to guess the column name. It connects User owner to owner_id in the db.
     */
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private String title;

    /*
        This annotation specifies that when mapping this column, use the db TEXT type rather than hibernate typically
        mapping a String to varchar(255) which can be limiting for notes that can easily be longer than 255 chars.
     */
    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean isPublic = false;

    private Instant updatedAt;
    private Instant deletedAt;

}
