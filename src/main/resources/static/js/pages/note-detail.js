// imports (what helper functions or api calls we need?)
import { fetchNoteById } from "../api/notes.js";
import { formatDate, showToast } from "../utilities.js"

// event listener for when the DOMContentLoaded so when the HTML parser has finished loading the DOM tree except images, css styles
// helps so we dont access an element that isn't on the page yet and get null
document.addEventListener('DOMContentLoaded', () => {
    initializeNoteDetailPage();
});

// page initialization
function initializeNoteDetailPage() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const noteId = urlParams.get('id');

    if (!noteId) {
        showError('No note ID specified in URL.');
        return;
    };


    renderNoteDetail(noteId);
    initializeHelpfulButton();
    initializeCopyLinkButton();
    
}


async function renderNoteDetail(noteId) {

    try {
    // get the note data
        const noteData = await fetchNoteById(noteId);
        console.log(noteData);
        
        if (!noteData) {
            showError('Note not found or may have been deleted.');
            return;
        }

        // render DOM
        // get DOM elements 
        const titleEl = document.getElementById('note-title');
        const bodyEl = document.getElementById('note-body');
        const courseEl = document.getElementById('note-course-name');
        const authorEl = document.getElementById('note-author');
        const modificationEl = document.getElementById('note-modification');
        const dateEl = document.getElementById('note-date');
        const noteCourseLinkEl = document.getElementById('note-course-link')

        // attachments
        const attachmentsGridEl = document.getElementById('note-attachments-grid');
       

        // .filter(Boolean) strips out empty string, undefined, null, 0 
        const fullName = [noteData.ownerFirstName, noteData.ownerLastName]
        .filter(Boolean)
        .join(' ');

        // display either Created or Last Updated 
        // Boolean returns the first falsy (null, undefined, 0, '') or last value if everything is truthy
        const hasBeenUpdated = Boolean(
            noteData.updatedAt &&
            noteData.createdAt &&
            noteData.updatedAt !== noteData.createdAt
        );

        const modificationLabel = hasBeenUpdated ? 'Last Updated' : 'Created';
        const timestampToFormat = hasBeenUpdated ? noteData.updatedAt : noteData.createdAt;
        const formattedDate = formatDate(timestampToFormat) || 'Recently';

        if (modificationEl) modificationEl.textContent = modificationLabel;
        if (dateEl) dateEl.textContent = formattedDate;
        
        // make sure they're not null/undefined then add data to html elements and display data
        if (titleEl) titleEl.textContent = noteData.title || 'Index Note';
        if (bodyEl) bodyEl.textContent = noteData.content || '';
        if (authorEl) authorEl.textContent = fullName || 'Author';
        if (noteCourseLinkEl) {
            noteCourseLinkEl.href = `/course-detail.html?id=${noteData.courseId}`;
            courseEl.textContent = noteData.courseName || 'N/A';
        }

    } catch (error) {
        showError('Unable to show note. Check your connection.');
        console.error(error);
    }
}


// error display if note is unable to load
function showError(message) {

}

// helpful counter
// default parameter feature: means expect a parameter called initialCount, if a value is passed use it, if nothing is passed (or undefined) fall back to zero
// helpful later when i attach counts to notes and pass in the count from the backend
// TODO: add helpful count to notes
function initializeHelpfulButton(initialCount = 0) {
    // get DOM elements
    const helpfulBtnEl = document.getElementById('helpful-btn');
    const helpfulCountEl = document.getElementById('helpful-count');

    // if either element doesn't exist on the page, exit
    if (!helpfulBtnEl || !helpfulCountEl) return;

    let count = initialCount;
    let hasVoted = false;

    // initial rendering of the count
    helpfulCountEl.textContent = count > 0 ? count : '';

    helpfulBtnEl.addEventListener('click', () => {
        if (!hasVoted) { 
            count += 1
            hasVoted = true;
            helpfulBtnEl.classList.add('has-voted');

        } else if (hasVoted && count > 0) {
            count -= 1;
            hasVoted = false;
            helpfulBtnEl.classList.remove('has-voted');
        }

        helpfulCountEl.textContent = count > 0 ? count : '';
    })
}
// copy note button
// copy link button
function initializeCopyLinkButton() {
    const copyLinkBtnEl = document.getElementById('copy-link-btn');

    if (!copyLinkBtnEl) return;

    copyLinkBtnEl.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('Link copied to clipboard')
        } catch (error) {
            console.error('Failed to copy link:', error);
            showToast('Failed to copy link', 'error');
        }
    });
}