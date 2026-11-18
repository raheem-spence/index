

export async function loadDashboardNotes() {
    try {
        // 1. send the network request
        const response = await fetch(`/courses/notes`, {
            method: 'GET',
            credentials: 'include'
        });


        // 2. check if response is ok
        if (!response.ok) {
            return {
                success: false,
                status: response.status
            }
        }

        //3. parse the stream data into JSON object
        const recentNotes = await response.json();
        return {
            success: true,
            data: recentNotes
        }
    } catch (error) {
        console.error('Fetch failed: ', error);
        return {
            success: false,
            status: null
        }
    }
}

export async function loadAllUserAccessibleNotes() {
    try {
        const response = await fetch(`/courses/notes/all`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            return {
                success: false,
                status: response.status
            }
        }

        const allNotes = await response.json();
        return {
            success: true,
            data: allNotes
        }
    } catch (error) {
        console.error('Fetch failed:', error);
        return {
            success: false,
            status: null
        }
    }
}


export async function loadNotes(courseId) {
    try {
        // 1. send the network request
        const response = await fetch(`/courses/${courseId}/notes`, {
            method: 'GET',
            credentials: 'include'
        });

        // 2. check if response status is OK
        if (!response.ok) {
            return {
                success: false,
                status: response.status
            }
        }

        // 3. parse the stream data into a JSON object
        const notes = await response.json();
        return {
            success: true,
            data: notes
        }
    } catch (error) {
        // catches network errors or errors thrown above
        console.error('Fetch failed:', error);
        return {
            success: false,
            status: null
        }
    }
}


export async function createNote(courseId, noteData) {
    try {
        const response = await fetch(`/courses/${courseId}/notes`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noteData) // converts JS object into a JSON string
        });

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
        const response = await fetch(`/courses/${courseId}/notes/${noteId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noteData)
        });

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
        const response = await fetch(`/courses/${courseId}/notes/${noteId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

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

export async function fetchNoteById(noteId) {
    
    try {
        const response = await fetch(`/notes/${noteId}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.info("Direct endpoint not available, falling back to note collection.");
    }

    // fallback: endpoint isnt deployed yet
    // fetch all notes and find it (keeps testing going)
    const allResponse = await fetch('/courses/notes/all', {
        method: 'GET',
        credentials: 'include'
    });

    if (!allResponse.ok) {
        throw new Error(`Failed to fetch notes: ${allResponse.status}`);
    }

    const notes = await allResponse.json();
    return notes.find(n => String(n.id) === String(noteId) || null);
}

export async function fetchReactionState(noteId) {
    const response = await fetch(`/notes/${noteId}/reactions`, {
        method: 'GET',
        credentials: 'include'  
    });

    if (!response.ok) {
        throw new Error(`Failed to get reaction state: ${response.status}`);
    }
    
    return await response.json();
}

export async function toggleReaction(noteId) {
    const response = await fetch(`/notes/${noteId}/reactions`, {
        method: 'POST',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Failed to toggle reaction: ${response.status}`);
    }

    return await response.json();
}

export async function fetchSavedNoteState(noteId) {
    const response = await fetch(`/notes/${noteId}/save`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Failed to get saved note state: ${response.status}`);
    }

    return await response.json();
}

export async function fetchSavedNotes() {
    const response = await fetch('/notes/saved', {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Failed to get saved notes: ${response.status}`);
    }

    return await response.json();
}

export async function toggleSaveNote(noteId) {
    const response = await fetch(`/notes/${noteId}/save`, {
        method: 'POST',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Failed to toggle save note: ${response.status}`);
    }

    return await response.json();
}