package com.raheemspence.repository;

import com.raheemspence.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /*
        These are custom query methods in Spring Data JPA telling Spring to generate a query based on these method names

     */

    /* This means find a user in the db where email matches the input
        Spring generates this bts: SELECT * FROM users WHERE email = ?

        It returns Optional<User> meaning user might exist so return it, if not return empty (no nulls)

        An Optional is a container object that may or may not hold a value. If forces you to handle the case when its
        empty. Its a wrapper that checks if user exists or not. If we use User user = null and forgot to check for it
        we would get NullPointerException
     */
    Optional<User> findByEmail(String email);

}
