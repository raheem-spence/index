/*
    Why do we need SecurityConfig?

    Without Spring Security, every endpoint is automatically public meaning it is accessible without authentication or
    logging in
     - NOTE: public DOESNT mean no security exists, no backend checks or server logic, it only means no authentication
     is required to access the endpoint

     With Spring Security, every endpoint is treated as protected by default unless you explicitly allow it.
     A protected request means Spring will not let the request reach the controller unless the user is authenticated
     - protected = access control is enforced
     - protected does not mean encrypted or hidden it just means you must be logged in (authenticated) to access it
 */
package com.raheemspence.config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.web.cors.CorsConfigurationSource;


import java.util.List;

/*
    This annotation basically means this class contains Spring configuration (setup instructions)
    IMPORTANT: this class is NOT business logic

    @Configuration tells Spring "this class contains bean definitions (setup instructions) that you should load at
    startup"

    bean = an object managed by Spring's container (Spring creates it, stores it, injects it where needed)

    Takeaway:  This annotation marks a class as a source of bean definitions. Spring processes it at startup and uses it
    to build and manage objects inside the application context, ensuring consistent lifecycle and dependency management
 */
@Configuration

/*
    This means "turn on Spring Security's web security system for this application"
    - turn on here means start applying security filters to HTTP requests because when Spring Boot starts, by defualt
    the Spring Security classes exist but they are not actively enforcing rules unless enabled/configured.

    This annotation triggers Spring to enable the following:
    1. Create a Security Filter Chain - pipeline that every HTTP request passes through
    request -> security filters -> controller

    2. Intercept ALL HTTP requests
    before the controller runs, Spring inserts itself in the middle:

    client request
          |
    spring security filters (ACTIVE NOW_
          |
    your controller

    3. Activate authentication logic
    it enables things like:
        - login processing
        - session checking
        - authorization rules

    Simple analogy:
    w/o @EnableWebSecurity --> security system installed but turned OFF

    w/ @EnableWebSecurity --> security system is ON and actively checking every door
 */
@EnableWebSecurity
public class SecurityConfig {

    /*
        This annotation means "this method produces an object that Spring should manage" i.o. take whatever this method
        returns and store it inside Spring so it can be reused.
     */
    @Bean

    /*
        This means "this method will produce a SecurityFilterChain object" essentially saying Spring, build me something
        that matches your SecurityFilerChain contract
            - SecurityFilterChain object is an interface
            - represents a security filter pipeline
            - Spring will create the actual implementation

        interface = defines required behavior, while a class provides the actual implementation

        HttpSecurity http -- this is not the final security system but rather a configuration builder that Spring gives
        us. Spring is basically handing us a "setup object" and saying tell me how you want security to behave
            - NOTE: we are configuring how Spring should build the final object
     */
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        System.out.println("🔥 SECURITY CONFIG LOADED");
        System.out.println("🔥 CSRF DISABLED");

        HttpSessionSecurityContextRepository repo = securityContextRepository();  // reference your bean

        // http -- the security configuration object Spring gave us, it already exists we are just modifying it
        http
                // 🔥 disable CSRF for now (simplifies API development)
                .csrf(csrf -> csrf.disable())

                // 🔥 CORS (IMPORTANT for frontend on 127.0.0.1:5500)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .securityContext(ctx ->                    // ← ADD THIS
                        ctx.securityContextRepository(repo)   // ← tells Spring where sessions live
                )
                .authorizeHttpRequests(auth -> auth
                        // public pages and assets (anyone can visit)
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/login.html",
                                "/signup.html",
                                "/auth/**", // login, register endpoints
                                "/css/**", // styles
                                "/js/**", // scripts need for login
                                "/assets/**", // images, logos
                                "/favicon.svg"
                                ).permitAll()

                        // protected HTML pages (MUST be authenticated)
                        .requestMatchers(
                                "/dashboard.html",
                                "/courses.html",
                                "/notes.html",
                                "/create-note.html"
                        ).authenticated()

                        // all API routes require authentication (except /auth/** above)
                        .requestMatchers("/api/**").authenticated()

                        // any other request
                        .anyRequest().permitAll()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            // if unauthenticated user tries to visit a protected page,
                            // send an instant HTTP 302 Found redirect to /login.html
                            response.sendRedirect("/login.html");
                        })
                );


                /* this tells Spring to actually construct the real security system cause before we were configuring the
        builder basically designing the security system blueprint. Everything before this line is configuration(instructions)

        This is what happens when it is called, Spring does 4 things:
        1. Reads your configuration(instructions):
            - Looks at everything you set -- csrf enabled, formLogin enabled, httpBasic enabled (if present), authorize rules
            So it now has the full "security blueprint"
        2. Creates security filters
            - Spring converts your config into real objects like:
                - CSRF filter
                - Authentication Filter (form login or basic auth)
                - Authorization filter
                - Session management filter
            These are real Java objects
        3. Orders them into a pipeline:
            - Spring arranges them in a specific order:
            Request ->
                CSRF Filter ->
                Authentication Filter ->
                Authorization Filter ->
                Controller
            This ordered structure is the "chain"
        4. Wraps everything into a SecurityFilterChain object
            - Now Spring creates: SecurityFilterChain (final object) which contains the full ordered list of filters
        5. That object is returned from your method
            - because of @Bean Spring stores it in the ApplicationContext

        Before build()
            You are designing a security system blueprint
        After build()
            The actual security system is installed and active

        */

        return http.build();
    }


//
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
//
//
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ✅ Allow both origins
        config.setAllowedOrigins(List.of(
                "http://127.0.0.1:5500",
                "http://localhost:5500"       // ← add this line
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public HttpSessionSecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
