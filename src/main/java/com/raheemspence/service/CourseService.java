package com.raheemspence.service;

import com.raheemspence.dto.request.CreateCourseRequest;
import com.raheemspence.dto.request.JoinCourseRequest;
import com.raheemspence.dto.response.*;
import com.raheemspence.model.Course;
import com.raheemspence.model.CourseMembership;
import com.raheemspence.model.User;
import com.raheemspence.repository.CourseMembershipRepository;
import com.raheemspence.repository.CourseRepository;
import com.raheemspence.repository.NoteRepository;
import com.raheemspence.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.data.domain.Pageable;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseMembershipRepository courseMembershipRepository;
    private final NoteRepository noteRepository;

    private static final String ALPHA_NUMERIC_UPPER = "ABCDEFGHIJKLMNOPQRXTUVWXYZ0123456789";
    private static final SecureRandom secureRandom = new SecureRandom();

    public CourseService(UserRepository userRepository,
                         CourseRepository courseRepository,
                         CourseMembershipRepository courseMembershipRepository,
                         NoteRepository noteRepository
    ) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.courseMembershipRepository = courseMembershipRepository;
        this.noteRepository = noteRepository;
    }

    public List<CourseResponse> getCoursesByUserId(Long userId) {

        // Get list of course memberships
        List<CourseMembership> courseMemberships = courseMembershipRepository.findByUserId(userId);


        // Create new list to store CourseResponse dto's
        List<CourseResponse> courseResponseList = new ArrayList<>();

        // Loop through list of notes and retrieve fields to populate CourseResponse dto's
        for (CourseMembership courseMembership: courseMemberships) {
            Course course = courseMembership.getCourse();

            Long id = course.getId();
            String name = course.getName();

            long memberships = courseMembershipRepository.countByCourseId(id);
            long notes = noteRepository.countByCourseId(id);

            CourseResponse courseResponse = new CourseResponse();

            // Populate dto
            courseResponse.setId(id);
            courseResponse.setName(name);
            courseResponse.setMemberCount(memberships);
            courseResponse.setNoteCount(notes);

            // add dto to list
            courseResponseList.add(courseResponse);
        }

        return courseResponseList;
    }

    public CourseDetailsResponse getCourseDetails(Long userId, Long courseId) {
        // Find course if exists
        Optional<Course> optionalCourse = courseRepository.findById(courseId);

        if (optionalCourse.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Course not found"
            );
        }

        // Get actual course
        Course course = optionalCourse.get();


        // Verify user is a member
        if (!courseMembershipRepository.existsByUserIdAndCourseId(userId, course.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User is not in course"
            );
        }

        // Get course details and set CourseDetailsResponse dto
        CourseDetailsResponse courseDetailsResponse = new CourseDetailsResponse();

        courseDetailsResponse.setId(course.getId());
        courseDetailsResponse.setName(course.getName());
        courseDetailsResponse.setMemberCount(courseMembershipRepository.countByCourseId(course.getId()));
        courseDetailsResponse.setNoteCount(noteRepository.countByCourseId(course.getId()));
        courseDetailsResponse.setJoinCode(course.getJoinCode());

        return courseDetailsResponse;
    }

    public List<CourseMemberResponse> getCourseMembers(Long userId, Long courseId) {
        // User check
        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is unauthorized"
            );
        }
        // Verify user is a member of course
        if (!courseMembershipRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User is not in course"
            );
        }

        return courseMembershipRepository.findMembersByCourseId(courseId);
    }

    public CreateCourseResponse createCourse(Long userId, CreateCourseRequest createCourseRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Course course = new Course();

        course.setName(createCourseRequest.getCourseName());
        course.setSchool(createCourseRequest.getSchool());
        course.setCreator(user);
        course.setJoinCode(generateJoinCode());



        Course savedCourse = courseRepository.save(course);

        CourseMembership courseMembership = new CourseMembership();
        courseMembership.setCourse(savedCourse);
        courseMembership.setUser(user);

        courseMembershipRepository.save(courseMembership);


        CreateCourseResponse createCourseResponse = new CreateCourseResponse();

        createCourseResponse.setCourseName(savedCourse.getName());
        createCourseResponse.setSchool(savedCourse.getSchool());
        createCourseResponse.setCreatorFirstName(user.getFirstName());
        createCourseResponse.setCreatorLastName(user.getLastName());
        createCourseResponse.setCreator_id(user.getId());
        createCourseResponse.setCreatedAt(savedCourse.getCreatedAt());
        createCourseResponse.setJoinCode(savedCourse.getJoinCode());

        return createCourseResponse;
    }

    public String generateJoinCode() {
        // Generate code
        StringBuilder stringBuilder = new StringBuilder();

        for (int i = 0; i < 6; i ++) {
            int randomIndex = secureRandom.nextInt(ALPHA_NUMERIC_UPPER.length());
            char randomChar = ALPHA_NUMERIC_UPPER.charAt(randomIndex);
            stringBuilder.append(randomChar);
        }

        // Check if code exists already
        String code = stringBuilder.toString();
        if (courseRepository.existsByJoinCode(code)) {
           return generateJoinCode();
        }
        return code;
    }

    public JoinCourseResponse joinCourse(Long userId, JoinCourseRequest joinCourseRequest) {

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found")
                );
        // Sanitize the join code by removing dashes and spaces and converting to uppercase
        String cleanedCode = joinCourseRequest.getJoinCode()
                .replaceAll("[-\\s]", "")
                .toUpperCase();

        // Get course object, throw exception if not found
        Course course = courseRepository.findByJoinCode(cleanedCode).
                orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found")
                );

        // Check for duplicate membership join
        if (courseMembershipRepository.existsByUserIdAndCourseId(userId, course.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "User already joined class"
            );
        }



        // Create a new course membership object
        CourseMembership courseMembership = new CourseMembership();

        // Fill in object fields with data from joinCourse request
        courseMembership.setCourse(course);
        courseMembership.setUser(user);


        // Save course membership object as a row in the db
        courseMembershipRepository.save(courseMembership);

        // Create response to send back to client and fill it with appropriate data
        JoinCourseResponse joinCourseResponse = new JoinCourseResponse();

        joinCourseResponse.setCourseName(course.getName());
        joinCourseResponse.setSchool(course.getSchool());
        joinCourseResponse.setCourseId(course.getId());

        return joinCourseResponse;

    }

    public List<CourseResponse> getDashboardCourses(Long userId) {

        Pageable pageable = PageRequest.of(0, 4);

        List<Course> dashboardCourses = courseRepository.findAccessibleCoursesByUserId(userId, pageable);

        List<CourseResponse> dashboardCoursesResponse = new ArrayList<>();

        for (Course course : dashboardCourses) {
            CourseResponse courseResponse = new CourseResponse();

            courseResponse.setId(course.getId());
            courseResponse.setName(course.getName());
            courseResponse.setSchool(course.getSchool());
            courseResponse.setJoinCode(course.getJoinCode());
            courseResponse.setNoteCount(noteRepository.countByCourseId(course.getId()));
            courseResponse.setMemberCount(courseMembershipRepository.countByCourseId(course.getId()));

            dashboardCoursesResponse.add(courseResponse);
        }

        return dashboardCoursesResponse;
    }
}
