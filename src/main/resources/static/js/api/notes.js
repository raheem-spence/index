import { handleAuth } from "./auth.js";

export async function loadDashboardNotes() {
    try {
        // 1. send the network request
        const response = await fetch(`http://127.0.0.1:8080/courses/notes`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }

        // 2. check if response is ok
        if (!response.ok) {
            throw new Error(`Http error! Status: ${response.status}`);
        }

        //3. parse the stream data into JSON object
        const recentNotes = await response.json();
        return recentNotes;
    } catch (error) {
        console.error('Fetch failed: ', error);
    }
}


export async function loadNotes(courseId) {
    try {
        // 1. send the network request
        const response = await fetch(`http://127.0.0.1:8080/courses/${courseId}/notes`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }

        // 2. check if response status is OK
        if (!response.ok) {
            throw new Error(`Http error! Status: ${response.status}`);
        }

        // 3. parse the stream data into a JSON object
        const notes = await response.json();
        return notes;
    } catch (error) {
        // catches network errors or errors thrown above
        console.error('Fetch failed:', error);
    }
}


export async function createNote(courseId, noteData) {
    try {
        const response = await fetch(`http://127.0.0.1:8080/courses/${courseId}/notes`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noteData) // converts JS object into a JSON string
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }

        if(!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const newNoteData = await response.json();

        return newNoteData;

    } catch (error) {
        console.error('Error:', error);
        return false;
    } 
}

export async function updateNote(courseId, noteData, noteId) {
    try {
        const response = await fetch(`http://127.0.0.1:8080/courses/${courseId}/notes/${noteId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noteData)
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }

        if (response.status === 403) {
            return false;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const newEditNoteData = await response.json();
        return newEditNoteData;

    } catch (error) {
        console.log('Error:', error)
    }
}

export async function deleteNote(courseId, noteId) {
    try {
        const response = await fetch(`http://127.0.0.1:8080/courses/${courseId}/notes/${noteId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = handleAuth(response);

        if (!result) {
            return false;
        }

        if (response.status === 403) {
            return false;
        }

        if (!response.ok) {
            throw new Error(`Http error! Status: ${response.status}`);
        }

        return true;

    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}