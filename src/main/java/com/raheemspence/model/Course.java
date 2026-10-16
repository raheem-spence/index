package com.raheemspence.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.List;

/*
    This annotation tells JPA (Java Persistence API) that this class should be persisted in a db table where each
    instance of this class corresponds to a row in the table

    Requirements:
    1. The class must have a no-args constructor
    2. Must have a pk field annotated with @Id
    3. Must be a non-final class
    4. Should be a POJO(Plain Old Java Object)
 */
@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
public class Course {

    // Class id
    @Id

    /* The identity strategy relies on the db to generate the pk using an auto-increment column so the db will handle
        the generation of unique values

        The @GeneratedValue annotation in JPA is used to automatically generate unique values for pk columns in db
        tables
     */

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Class name
    @Column(nullable = false)
    private String name;

    // Class description (optional)
    private String description;

    // School (optional)
    private String school;

    // Professor (optional)
    private String professor;

    // Semester (optional)
    private String semester;

    // Join code
    @Column(nullable = false, unique = true)
    private String joinCode;

    // Creation time
    /*
        This annotation automatically sets the field value to the current timestamp when the entity is first saved
     */
    @CreationTimestamp
    private Instant createdAt;

    // Who created it
    @ManyToOne(fetch = FetchType.LAZY)

    /*
        This tells hibernate that to figure out which User belongs to the creator field, use the creator_id column.
        So when hibernate sees for example creator_id = 1, it knows to look in users table find user with id = 1 and
        put that User into the creator field
     */
    @JoinColumn(name = "creator_id")

    /*
     This line tells hibernate that this fields stores the relationship to another entity

     We need User creator so Hibernate can automatically convert a foreign key (creator_id) into a usable User object,
     letting us navigate relationships instead of manually querying IDs.

     This field means every class has a creator and that creator is a User.

     IMPORTANT: This class has a connection to a User NOT this class stores a User

     Relationship fields(User creator, List<Class> creatorClasses, etc.) model connections between entities rather than
     simple column values. Hibernate uses these fields plus annotations like @JoinColumn to translate fks into navigable
     Java objects
     */
    private User creator;

    @OneToMany(mappedBy = "course", fetch = FetchType.LAZY)
    private List<Note> notes;

}
