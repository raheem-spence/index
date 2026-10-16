import { handleAuth } from "./auth.js";

export async function fetchCourses() {
    try {
        // 1. send the network request
        const response = await fetch('/course/my-courses', {
            method: 'GET',
            credentials: 'include'
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }

        // 2. check if response status is ok
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        // 3. parse the stream data into a json object
        const courses = await response.json();
        return courses;

    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

export async function fetchCourseDetails(courseId) {
    try {
        const response = await fetch(`/course/${courseId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const courseDetails = await response.json();
        return courseDetails;

    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

export async function fetchCourseMembers(courseId) {
    try {
        const response = await fetch(`/course/${courseId}/members`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const courseMembers = await response.json()
        return courseMembers;

    } catch(error) {
        console.error('Fetch failed:', error)
    }
}

export async function createCourse(courseName) {
    try {
        const response = await fetch(`/course/create`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseName)
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const newCourse = await response.json();
        return newCourse;

    } catch(error) {
        console.error('Error:', error);
        return false;
    }
}