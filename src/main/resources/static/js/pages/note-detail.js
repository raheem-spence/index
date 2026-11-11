// imports (what helper functions or api calls we need?)
import { fetchNoteById, updateNote } from "../api/notes.js";
import { formatDate, showToast } from "../utilities.js"

let currentNote = null;

const viewActions = document.getElementById('view-actions');
const editActions = document.getElementById('edit-actions');

const footer = document.getElementById('note-footer');
const dropzoneSection = document.getElementById('dropzone-section');

const saveChangesBtn = document.getElementById('save-changes-btn');
const cancelChangesBtn = document.getElementById('cancel-changes-btn');

const editInput = document.getElementById('edit-input');
const noteTitle = document.getElementById('note-title');

const noteBody = document.getElementById('note-body');
const editTextArea = document.getElementById('edit-textarea');

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
        showError('No note specified', `This link doesn't point to a note. Head back to all notes and pick one from the list.`, 'no-note');
        return;
    };


    renderNoteDetail(noteId);
    initializeHelpfulButton();
    initializeCopyLinkButton();
    initializeEditActions();
    
}

function initializeEditActions() {
    const editBtn = document.getElementById('edit-note-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (currentNote) enterEditMode(currentNote);
        });
    }

    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            const updatedTitle = editInput.value.trim();
            const updatedContent = editTextArea.value.trim();
            handleSaveNote(currentNote, updatedTitle, updatedContent, saveChangesBtn);
        });
    }

    if (cancelChangesBtn) {
        cancelChangesBtn.addEventListener('click', () => {
            exitEditMode(editActions, viewActions, editInput, noteTitle, footer, dropzoneSection, currentNote);
        })
    }
}


async function renderNoteDetail(noteId) {

    try {
    // get the note data
        const noteData = await fetchNoteById(noteId);
        
        if (!noteData) {
            showError('Note not found', `This note may have been deleted, or the link is incorrect.`, 'no-note');
            return;
        }

        currentNote = noteData;
        // render DOM
        // get DOM elements 
        const titleEl = document.getElementById('note-title');
        const bodyEl = document.getElementById('note-body');
        const courseEl = document.getElementById('note-course-name');
        const authorEl = document.getElementById('note-author');
        const modificationEl = document.getElementById('note-modification');
        const dateEl = document.getElementById('note-date');
        const noteCourseLinkEl = document.getElementById('note-course-link');
        const editBtnEl = document.getElementById('edit-note-btn');

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
        showError(`Couldn't load this note`, `Check your connection and try again.`, 'no-wifi', () => renderNoteDetail(noteId));
        console.error(error);
    }
}


const ERROR_ICONS = {
    // note icon with question mark
    'no-note': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
    aria-hidden="true"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z">
    </path><path d="M12 17h.01"></path><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"></path>
    </svg>`,

    'no-wifi': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 20h.01"></path><path d="M8.5 16.429a5 5 0 0 1 7 0">
    </path><path d="M5 12.859a10 10 0 0 1 5.17-2.69"></path><path d="M19 12.859a10 10 0 0 0-2.007-1.523">
    </path><path d="M2 8.82a15 15 0 0 1 4.177-2.643"></path><path d="M22 8.82a15 15 0 0 0-11.288-3.764"></path><path d="m2 2 20 20"></path>
    </svg>`
}

// error display if note is unable to load
function showError(mainMessage, helperMsg, type = 'no-note', retryFn = null) {
    // empty parent container
    const noteDetailContainer = document.getElementById('note-detail-container');

    // defensive guard if container isn't present, exit 
    if (!noteDetailContainer) return;

    noteDetailContainer.replaceChildren();

    // DOM elements for error display
    const backLink = document.createElement('a');
    backLink.href = '/notes.html';
    backLink.classList.add('back-link');

    const backArrowSvgContainer = document.createElement('div');
    backArrowSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
                                    aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>
                                    </svg>`;

    const backLinkSpan = document.createElement('span');
    backLinkSpan.textContent = "All notes";

    backLink.append(backArrowSvgContainer, backLinkSpan);

    const iconSvg = ERROR_ICONS[type] || ERROR_ICONS['no-note'] || '';
    const errorContainer = document.createElement('div');
    errorContainer.classList.add('error-container');

    const errorSvgContainer = document.createElement('div');

    errorSvgContainer.innerHTML = iconSvg;
    errorSvgContainer.classList.add('error-svg-container');

    const errorTitleMsg = document.createElement('h1');
    const errorHelperMsg = document.createElement('p');

    errorTitleMsg.textContent = mainMessage;
    errorHelperMsg.textContent = helperMsg;

    errorTitleMsg.classList.add('error-title-msg');
    errorHelperMsg.classList.add('error-helper-msg');
    
    const errorRedirectATag = document.createElement('a');
    errorRedirectATag.textContent = 'Back to All Notes';
    errorRedirectATag.href = "/notes.html";

    errorRedirectATag.classList.add('error-redirect-a-tag');

    const btnsContainer = document.createElement('div');
    btnsContainer.classList.add('btn-container');

    btnsContainer.append(errorRedirectATag);

    if ( typeof retryFn === 'function') {
        // create DOM elements
        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.classList.add('retry-btn');
        retryBtn.textContent = 'Try again';
        btnsContainer.prepend(retryBtn);
        retryBtn.addEventListener('click', () => {
            retryFn();
        })
    }

    errorContainer.append(errorSvgContainer, errorTitleMsg, errorHelperMsg, btnsContainer);
    noteDetailContainer.append( backLink, errorContainer);
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

function enterEditMode(currentNote) {
    // swap the h1 to input (prefilled with current content)
    if (!editInput) return;

    editInput.value = currentNote.title;
    noteTitle.classList.add('hidden');
    editInput.classList.remove('hidden');
    editInput.focus();

    // swap div to textarea (prefilled with current content)
    if (!noteBody || !editTextArea) return;

    editTextArea.value = currentNote.content;
    noteBody.classList.add('hidden');
    editTextArea.classList.remove('hidden');
    
    // swap the header buttons to save and cancel
    if (!viewActions || !editActions) return;

    viewActions.classList.add('hidden');
    editActions.classList.remove('hidden')
    

    // swap the footer with a dropzone for attachments
    if (!footer || !dropzoneSection) return;
    footer.classList.add('hidden');
    dropzoneSection.classList.remove('hidden');
}

function exitEditMode(editActions, viewActions, editInput, noteTitle, footer, dropzoneSection, currentNote) {
    editActions.classList.add('hidden');
    viewActions.classList.remove('hidden');

    editInput.classList.add('hidden');
    noteTitle.classList.remove('hidden');

    footer.classList.remove('hidden');
    dropzoneSection.classList.add('hidden');
    renderNoteDetail(currentNote.id);
}

async function handleSaveNote(currNote, editedTitle, editedContent, saveChangesBtn) {
    // if values are empty, alert the user
    if (editedTitle.length === 0 && editedContent.length === 0) {
        showToast('Title and content is required', 'info');
        return;
    }

    if (editedTitle.length === 0) {
        showToast('Title is required', 'info');
        return;
    }

    if (editedContent.length === 0) {
        showToast('Content is required', 'info');
        return;
    }

    // if changes are identical to original note
    if (currNote.title === editedTitle && currNote.content === editedContent) {
        console.log('no changes!');
        exitEditMode(editActions, viewActions, editInput, noteTitle, footer, dropzoneSection, currNote);
        return;
    }
    // Set save changes button to disabled and text to "Saving..." so they cant double click
    saveChangesBtn.textContent = 'Saving...';
    saveChangesBtn.disabled = true;

    const editedNoteData = {
        title: editedTitle,
        content: editedContent
    }

    try {
        const response = await updateNote(currNote.courseId, editedNoteData, currNote.id);

        if (!response) {
            showToast('Unable to save changes', 'error');
            saveChangesBtn.disabled = false;
            saveChangesBtn.textContent = 'Save changes';
            return;
        }

        saveChangesBtn.disabled = false;
        saveChangesBtn.textContent = 'Save changes';

        setTimeout(() => {
            showToast('Note changes saved');
        }, 175);
        exitEditMode(editActions, viewActions, editInput, noteTitle, footer, dropzoneSection, currNote);


    } catch (error) {
        saveChangesBtn.disabled = false;
        saveChangesBtn.textContent = 'Save changes';
        showToast('Unable to save note changes', 'error');
        console.error('Unable to save note changes:', error);
        return;
    }
}