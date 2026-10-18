package com.raheemspence.controller;

import com.raheemspence.dto.request.CreateCourseRequest;
import com.raheemspence.dto.request.JoinCourseRequest;
import com.raheemspence.dto.response.*;
import com.raheemspence.model.User;
import com.raheemspence.service.CourseService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://127.0.0.1:5500")
@RestController
@RequestMapping("/course")
public class CourseController {
    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping("/my-courses")
    public List<CourseResponse> getCourses(HttpSession httpSession) {
        // Get user by id
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            return List.of();
        }

        return courseService.getCoursesByUserId(userId);
    }

    @GetMapping("/dashboard")
    public List<CourseResponse> getDashboardCourses(HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        if (userId == null) {
            return List.of();
        }

        return courseService.getDashboardCourses(userId);
    }

    @GetMapping("/{courseId}")
    public CourseDetailsResponse getCourseDetails(@PathVariable Long courseId, HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        return courseService.getCourseDetails(userId, courseId);
    }

    @GetMapping("/{courseId}/members")
    public List<CourseMemberResponse> getCourseMembers(@PathVariable Long courseId, HttpSession httpSession) {
        Long userId = (Long) httpSession.getAttribute("userId");

        return courseService.getCourseMembers(userId, courseId);
    }


    @PostMapping("/create")
    public CreateCourseResponse createCourse(@Valid @RequestBody CreateCourseRequest createCourseRequest,
                                             HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("userId");

        return courseService.createCourse(userId, createCourseRequest);
    }

    @PostMapping("/join")
    public JoinCourseResponse joinCourse(@RequestBody JoinCourseRequest joinCourseRequest,
                                         HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("userId");

        return courseService.joinCourse(userId, joinCourseRequest);
    }


}
