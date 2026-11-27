// imports (what helper functions or api calls we need?)
import { deleteNote, fetchNoteById, updateNote, fetchReactionState, toggleReaction, togglePublicNote } from "../api/notes.js";
import { initializeSaveNoteButton } from "../script.js";
import { formatDate, showToast, formatFileSize, copyToClipboard} from "../utilities.js"
import { fetchAttachments, deleteAttachment, uploadAttachment } from "../api/noteAttachments.js";

const MAX_FILES = 5;
const MAX_FILE_SIZE_BTYES = 25 * 1024 * 1024;

// MIME (Multipurpose Internet Mail Extension) types are the univeral internet standards for file types
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp'
];

const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
                class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2">
                </rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                </svg>`;


let currentNote = null;
let stagedFiles = [];
const stagedDeletions = new Set();
let currentAttachmentCount = 0;


const viewActions = document.getElementById('view-actions');
const editActions = document.getElementById('edit-actions');

const footer = document.getElementById('note-footer');
const dropzoneSection = document.getElementById('dropzone-section');

const saveChangesBtn = document.getElementById('save-changes-btn');
const cancelChangesBtn = document.getElementById('cancel-changes-btn');

const deleteBtn = document.getElementById('delete-note-btn');
const deleteText = document.getElementById('delete-text');
const yesDeleteBtn = document.getElementById('yes-delete-btn');
const noDeleteBtn = document.getElementById('no-delete-btn');
const deleteConfirmGroup = document.getElementById('delete-confirm-group');

// share popup trigger button
const shareNoteBtn = document.getElementById('share-note-btn');

// share popup trigger button icon
const shareNoteBtnIcon = document.getElementById('share-btn-icon');

// icon inside the share popover
const shareIcon = document.getElementById('access-icon');

// share popup div
const sharePopover = document.getElementById('share-popover');

// share options button within popover
const shareOptionsBtn = document.getElementById('access-btn');

const shareOptionsBtnText = document.getElementById('access-text');

// share choice container
const shareChoiceContainer = document.getElementById('access-choice-container');

const accessHelperText = document.getElementById('access-helper-text');

const footerText = document.getElementById('footer-text');
const footerUpdateIcon = document.getElementById('footer-update-icon');

const copyShareLinkBtn = document.getElementById('copy-share-link');

const courseMembersOptionBtn = document.getElementById('course-members-option-btn');

const publicOptionBtn = document.getElementById('public-option-btn');

const privateCheckmarkIcon = document.getElementById('private-checkmark');
const publicCheckmarkIcon = document.getElementById('public-checkmark');

const copyIconDiv = document.getElementById('copy-icon-div');

const editInput = document.getElementById('edit-input');
const noteTitle = document.getElementById('note-title');

const noteBody = document.getElementById('note-body');
const editTextArea = document.getElementById('edit-textarea');

const noteAttachmentsEl = document.getElementById('note-attachments');
const attachmentsGridEl = document.getElementById('attachments-grid');


const saveNoteBtn = document.getElementById('save-note-btn');

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
    const from = urlParams.get('from');

    const backATag = document.getElementById('back-link');
    const backDestination = document.getElementById('back-destination');
    
    if (backATag && backDestination) {
        if (from === 'dashboard') {
            backATag.href = '/dashboard.html';
            backDestination.textContent = 'Dashboard';
        } else {
            backATag.href = '/notes.html';
            backDestination.textContent = 'All notes'
        }
    }

    if (!noteId) {
        showError('No note specified', `This link doesn't point to a note. Head back to all notes and pick one from the list.`, 'no-note');
        return;
    };


    renderNoteDetail(noteId);
    loadAndRenderAttachments(noteId);
    initializeHelpfulButton(noteId);
    initializeSaveNoteButton(saveNoteBtn, noteId)
    initializeEditActions();
    initializeDeleteActions();
    initializeShareActions(noteId);
    initializeAttachmentsActions();
    setUpAttachments();
    
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

function initializeDeleteActions() {
    deleteBtn.addEventListener('click', showDeleteConfirmation);

    noDeleteBtn.addEventListener('click', hideDeleteConfirmation);

    yesDeleteBtn.addEventListener('click', handleDeleteNote);
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

        updateShareUI(currentNote.isPublic);

        const user = getCurrentUser();

        // check if current user is the author
        const isOwner = user && currentNote && (user.id === currentNote.ownerId);

        if (isOwner) {
            document.getElementById('owner-actions').classList.remove('hidden');
        } else {
            document.getElementById('owner-actions').classList.add('hidden');
        }
        
        // render DOM
        // get DOM elements 
        const titleEl = document.getElementById('note-title');
        const bodyEl = document.getElementById('note-body');
        const courseEl = document.getElementById('note-course-name');
        const authorEl = document.getElementById('note-author');
        const modificationEl = document.getElementById('note-modification');
        const dateEl = document.getElementById('note-date');
        const noteCourseLinkEl = document.getElementById('note-course-link');
       

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
async function initializeHelpfulButton(noteId) {
    // get DOM elements
    const helpfulBtnEl = document.getElementById('helpful-btn');
    const helpfulCountEl = document.getElementById('helpful-count');

    // if either element doesn't exist on the page, exit
    if (!helpfulBtnEl || !helpfulCountEl) return;

    // get reaction state to render initial state of button
    try {
        const reactionState = await fetchReactionState(noteId);

        if (reactionState.reacted) {
            helpfulBtnEl.classList.add('has-voted');
        } else {
            helpfulBtnEl.classList.remove('has-voted');
        }

        helpfulCountEl.textContent = reactionState.count;

    } catch (error) {
        console.error('Unable to get reaction state:', error);
    }


    let isPending = false;

    helpfulBtnEl.addEventListener('click', async () => {

        if (isPending) return;

        try {
            isPending = true;
            helpfulBtnEl.disabled = true;
            const toggleResponse = await toggleReaction(noteId);

            
            if (toggleResponse.reacted) {
                helpfulBtnEl.classList.add('has-voted');
            } else {
                helpfulBtnEl.classList.remove('has-voted');
            }

            helpfulCountEl.textContent = toggleResponse.count;

        } catch (error) {
            console.error('Unable to toggle reaction:', error);

        } finally {
            isPending = false;
            helpfulBtnEl.disabled = false;
        }
    })
}

function enterEditMode(currentNote) {
    // find all buttons and remove hidden class to show delete button
    const deleteBtns = document.querySelectorAll('.attachment-delete-btn');

    deleteBtns.forEach((button) => {
        button.classList.remove('hidden');
    })

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
    stagedDeletions.clear();
    stagedFiles = [];

    const listElement = document.getElementById('staged-files-list');
    if (listElement) listElement.innerHTML = '';

    loadAndRenderAttachments(currentNote.id);

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
    if (currNote.title === editedTitle && currNote.content === editedContent && stagedDeletions.size === 0 && stagedFiles.length === 0) {
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

        if (stagedDeletions.size > 0) {
            for (const attachmentId of stagedDeletions) {
                await deleteAttachment(currNote.id, attachmentId);
            }
        }

        for (const file of stagedFiles) {
            await uploadAttachment(currNote.id, file);
        }

        stagedFiles = [];

        stagedDeletions.clear();

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

function showDeleteConfirmation() {
    deleteBtn.classList.add('hidden');
    deleteConfirmGroup.classList.remove('hidden');
}

function hideDeleteConfirmation() {
    deleteBtn.classList.remove('hidden');
    deleteConfirmGroup.classList.add('hidden');
}

async function handleDeleteNote() {
    hideDeleteConfirmation();
    deleteBtn.disabled = true;
    deleteText.textContent = 'Deleting...';

    try {
        await deleteNote(currentNote.courseId, currentNote.id);

        sessionStorage.setItem('pendingToast', 'Note deleted');
        window.location.href = '/notes.html';

    } catch (error) {
        deleteBtn.disabled = false;
        deleteText.textContent = 'Delete';
        console.error('Delete failed:', error);
        showToast('Unable to delete note', 'error');
    }
}

function getCurrentUser() {
    try {
        const raw = sessionStorage.getItem('index_user');
        return raw ? JSON.parse(raw) :null;
    } catch {
        return null;
    }
}

async function loadAndRenderAttachments(noteId) {
    
    try {

        const attachments = await fetchAttachments(noteId);
        attachmentsGridEl.replaceChildren();

        if (!attachments || attachments.length === 0) {
            noteAttachmentsEl.classList.add('hidden');
            return;
        }
        
        noteAttachmentsEl.classList.remove('hidden');

        attachments.forEach((attachment) => {
            const attachmentLinkContainer = document.createElement('div');
            attachmentLinkContainer.classList.add('attachment-link-container');

            const isImage = attachment.contentType && attachment.contentType.startsWith('image/');
            const isPDF = attachment.contentType && attachment.contentType === 'application/pdf';

            if (isImage) {
                const imgEl = document.createElement('img');
                imgEl.classList.add('img-el');
                imgEl.loading = 'lazy';
                imgEl.src = `${attachment.downloadUrl}`;
                attachmentLinkContainer.append(imgEl);
            } else if (isPDF) {
                const pdfDiv = document.createElement('div');
                pdfDiv.classList.add('pdf-div');
                pdfDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>`;
                attachmentLinkContainer.append(pdfDiv);
            } else {
                const fileDiv = document.createElement('div');
                fileDiv.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>`;
                attachmentLinkContainer.append(fileDiv);
            }

            const attachmentLink = document.createElement('a');
            const attachmentName = document.createElement('span');
            attachmentName.classList.add('attachment-link-name', 'truncate');

            const attachmentMetaData = document.createElement('span');
            attachmentMetaData.classList.add('attachment-link-meta-data');

            const attachmentDeleteBtn = document.createElement('button');
            attachmentDeleteBtn.type = 'button';
            attachmentDeleteBtn.dataset.id = attachment.id;
            attachmentDeleteBtn.classList.add('attachment-delete-btn', 'hidden');
            attachmentDeleteBtn.setAttribute('aria-label', 'Remove attachment');
            const trashSvgContainer = document.createElement('div');
            trashSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                                            fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            </svg>`;
            attachmentDeleteBtn.append(trashSvgContainer);

            attachmentLink.href = `${attachment.downloadUrl}`;
            attachmentLink.target ="_blank";
            attachmentLink.rel = "noopener noreferrer";
            attachmentName.textContent = attachment.fileName;
            attachmentMetaData.textContent = (attachment.contentType.split('/')[1]?.toUpperCase() || 'FILE') + " · " + formatFileSize(attachment.fileSize);
            
            attachmentLink.append(attachmentName, attachmentMetaData);
            attachmentLinkContainer.append(attachmentLink, attachmentDeleteBtn);
            attachmentsGridEl.append(attachmentLinkContainer);
        });

        currentAttachmentCount = attachments.length;

    } catch (error) {
        console.error(error);
    }
}

function initializeAttachmentsActions() {
    attachmentsGridEl.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.attachment-delete-btn');
        if (!deleteBtn) return;

        const attachmentCard = deleteBtn.closest('.attachment-link-container');

        const attachmentId = Number(deleteBtn.dataset.id);

        if (stagedDeletions.has(attachmentId)) {
            stagedDeletions.delete(attachmentId);
            attachmentCard.classList.remove('staged-for-delete');
            // change icon back to trash
            deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
            fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>`;
            deleteBtn.setAttribute('aria-label', 'Remove attachment');
        } else {
            stagedDeletions.add(attachmentId);
            attachmentCard.classList.add('staged-for-delete');
            // change icon to undo icon
            deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-undo preview-icon"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`;
            deleteBtn.setAttribute('aria-label', 'Undo remove attachment');
        }

        console.log(stagedDeletions);
    })
}

function setUpAttachments() {
    const fileInput = document.getElementById('note-file-input');
    const dropzone = document.getElementById('dropzone');

    if (!fileInput || !dropzone) return;

    // Native click / file picker
    // note: a form control is any HTML element designed to collect user input inside a form:
    // - <input> (text, checkbox, radio, file, number, date)
    // - <textarea>
    // - <select>
    // each control has a value, here <input type="file"> value is a string representation of the
    // selected file path (browsers mask it)
    // change event fires when a form's control value has been modified and finalized by the user
    // e.g. on text input when you type something then click outside
    // e.g. on file input it fires when the OS file picker closes
    fileInput.addEventListener('change', (e) => {
        // remember e.target is the element that triggered the event so the input type="file" element
        // file inputs have a special property called .files
        // note: it does not give you the file path on the hard drive
        // browsers block that for privacy and security so websites can't spy on user's folder names
        // however it retunrs a browser data structure containing File objects where each gives you
        // - file.name (e.g. "lecture-notes.pdf")
        // - file.size (in bytes, e.g. 1048676 for 1 MB)
        // - file.type (the MIME type, e.g. "application/pdf")
        // - file.lastModified (timestamp of when it was saved)
        if (e.target.files && e.target.files.length > 0) {
            // e.target.files looks like an array but is not. Its a FileList which is "array-like"
            // it has a .length and you can access items with brackets but it does not have array methods
            // like .forEach(), .map(), .filter(), .some()
            // Array.from() takes an array-like structure and converts it into a real, modern JS array
            // where you can unlock standard array methods
            handleFilesAdded(Array.from(e.target.files));
        }

        // reset input value so re-selecting a file with the same name triggers 'change' again 
        fileInput.value = '';
    });

    // Drag and drop
    // browsers natively open files on drop (e.g.  replacing the tab with a PDF)
    // preventDefault() on both 'dragover' and 'drop' is mandatory to stop that behavior
    // dragover fires continuously (every few ms) as long as the dragged file is hovering inside
    // the dropzone boundaries
    dropzone.addEventListener('dragover', (e) => {
        // by default, browsers reject drops on almost all HTML elements so we need to tell the browser
        // not to reject
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });

    // dragleave fires once the cursor leaves the dropzone area without letting go of the mouse button
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
    })

    // drop fires the instant the user releases the mouse button while inside the dropzone
    dropzone.addEventListener('drop', (e) => {
        // this prevents the browsers default behavior of navigating away form the page 
        // and opening the dropped image or PDF right in the browser tab, destroying whatever note
        // the user was typing
        e.preventDefault();
        dropzone.classList.remove('drag-over');

        // e.dataTranser.files contains the FileList dropped fomr the OS desktop/finder
        // when you drag something in you OS, the OS creates and invisible "clipboard in flight" 
        // called a DataTransfer object
        // the browser exposes that object through e.dataTransfer through drap and drop events
        // when you click the labl and use the OS file dialog: files live on the e.target.files
        // when you drag a file from the desktop or Finder window: files live on the e.dataTransfer.files
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleFilesAdded(Array.from(e.dataTransfer.files));
        }
    });

    // keyboard accessibility for <label tabindex="0">
    dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });
}

function handleFilesAdded(incomingFiles) {
    // .forEach(element, index, array) 
    // the first element is the current item being processed in this loop iteration
    // the second argument is the numeric position of that item in the array starting at 0
    // the third argument is rarely need but is a reference to the entire original array itself
    // JS closures???

    incomingFiles.forEach(file => {

        // validation 1: check max count limit
        if (currentAttachmentCount - stagedDeletions.size + stagedFiles.length >= MAX_FILES) {
            showToast('Maximum 5 files per note', 'info');
            return;
        }
        // validation 2: size limit (25 MB)
        if (file.size > MAX_FILE_SIZE_BTYES) {
            showToast(`"${file.name}" exceeds the 25 MB limit.`, 'info');
            return;
        }

        // validation 3: file type check
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            showToast(`"${file.name}" is not supported. Use PDF, PNG, or JPEG.`, 'info');
            return;
        }

        // validation 4: duplicate check (matches name, byte size, and last modified timestamp)
        // .some() is an array method that asks "does at least one item in this array meet this condition"
        // it tests each item one by one and the second it finds one math that returns true, it stops checking
        // and returns true.
        // if all items have zero matches, it returns false
        const isDuplicate = stagedFiles.some((existing) => 
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );

        if (isDuplicate) {
            showToast(`"${file.name}" is already attached`, 'info');
            return;
        }

        // passed all validation checks, stage it
        stagedFiles.push(file);
    });

    renderStagedFiles();
}

function renderStagedFiles() {

    if (stagedFiles.length > 0) {
        noteAttachmentsEl.classList.remove('hidden');
    } else if (currentAttachmentCount === 0) {
        noteAttachmentsEl.classList.add('hidden');
    }

    attachmentsGridEl.querySelectorAll('.staged-card').forEach(el => el.remove());
    console.log(stagedFiles);
    stagedFiles.forEach((file, index) => {

        const attachmentLinkContainer = document.createElement('div');
        attachmentLinkContainer.classList.add('attachment-link-container', 'staged-card');
        

        const isImage = file.type && file.type.startsWith('image/');
        const isPDF = file.type && file.type === 'application/pdf';

        if (isImage) {
            const imgEl = document.createElement('img');
            imgEl.classList.add('img-el');
            imgEl.loading = 'lazy';
            imgEl.src = URL.createObjectURL(file);
            attachmentLinkContainer.append(imgEl);
        } else if (isPDF) {
            const pdfDiv = document.createElement('div');
            pdfDiv.classList.add('pdf-div');
            pdfDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>`;
            attachmentLinkContainer.append(pdfDiv);
        } else {
            const fileDiv = document.createElement('div');
            fileDiv.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>`;
            attachmentLinkContainer.append(fileDiv);
        }

        const attachmentLink = document.createElement('a');
        const attachmentName = document.createElement('span');
        attachmentName.classList.add('attachment-link-name', 'truncate');

        const attachmentMetaData = document.createElement('span');
        attachmentMetaData.classList.add('attachment-link-meta-data');

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.classList.add('remove-file-btn');
        removeBtn.setAttribute('aria-label', `Remove ${file.name}`);

        const removeSvgContainer = document.createElement('div');
        removeSvgContainer.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>`;
        removeBtn.append(removeSvgContainer);

        attachmentLink.href = URL.createObjectURL(file);
        attachmentLink.target ="_blank";
        attachmentLink.rel = "noopener noreferrer";
        attachmentName.textContent = file.name;
        attachmentMetaData.textContent = (file.type.split('/')[1]?.toUpperCase() || 'FILE') + " · " + formatFileSize(file.size);
        
        attachmentLink.append(attachmentName, attachmentMetaData);
        attachmentLinkContainer.append(attachmentLink, removeBtn);
        attachmentsGridEl.append(attachmentLinkContainer);

        // scoped event listener 
        // "scoped" means the listener is attached directly to the specific button created inside this
        // particulr loop iteration for this specific file
        // the whole document isnt searched because the li was created in memory
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent clicking row from doing anything else
            // .splice(startIndex, deleteCount) modifies an array in-place by removing, replacing, or adding items
            stagedFiles.splice(index, 1);
            renderStagedFiles();
        });

    });
}

function initializeShareActions(noteId) {
    if (!shareNoteBtn || !sharePopover) return;

    shareNoteBtn.addEventListener('click', () => {
        sharePopover.classList.remove('hidden');
        shareNoteBtn.setAttribute('aria-expanded', 'true');
    });

    // close popover on click outside
    document.addEventListener('click', (e) => {
        if (!shareNoteBtn.contains(e.target) && !sharePopover.contains(e.target)) {
            sharePopover.classList.add('hidden');
            shareNoteBtn.setAttribute('aria-expanded', 'false');

            shareChoiceContainer.classList.add('hidden');
            shareChoiceContainer.setAttribute('aria-expanded', 'false');
        }
    });

    // close popover on escape button
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !sharePopover.classList.contains('hidden')) {
            sharePopover.classList.add('hidden');
            shareNoteBtn.setAttribute('aria-expanded', 'false');
            shareNoteBtn.focus(); // return focuse to share button for screen readers

            shareChoiceContainer.classList.add('hidden');
            shareChoiceContainer.setAttribute('aria-expanded', 'false');
        }
    });


    // share access options button
    shareOptionsBtn.addEventListener('click', () => {

        if (shareChoiceContainer.classList.contains('hidden')) {
            shareChoiceContainer.classList.remove('hidden');
            shareOptionsBtn.setAttribute('aria-expanded', 'true');
        } else {
            shareChoiceContainer.classList.add('hidden');
            shareOptionsBtn.setAttribute('aria-expanded', 'false');
        }
    });


    // user clicked outside the choices buttons but on the share popover
    sharePopover.addEventListener('click', (e) => {
        e.stopPropagation();

        if (sharePopover.contains(e.target) && 
        !shareChoiceContainer.contains(e.target) && 
        !shareChoiceContainer.classList.contains('hidden') && 
        !shareOptionsBtn.contains(e.target)) {
            shareChoiceContainer.classList.add('hidden');
            shareOptionsBtn.focus();
        }
    });

    courseMembersOptionBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        try {
            const result = await togglePublicNote(noteId, false);

            currentNote.isPublic = result.isPublic;

            updateShareUI(currentNote.isPublic);

        } catch (error) {
            console.error('Failed to toggle public note view:', error);
            showToast('Unable to update share access', 'error');
        }

        shareChoiceContainer.classList.add('hidden');
        footerUpdateIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" 
                                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
                                    aria-hidden="true" data-tsd-source="/src/components/NoteShare.tsx:74:207">
                                    <path d="M20 6 9 17l-5-5"></path>
                                    </svg>`;
        footerText.textContent = 'Access updated';
    });

    publicOptionBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        try {
            const result = await togglePublicNote(noteId, true);

            currentNote.isPublic = result.isPublic;

            updateShareUI(currentNote.isPublic);

        } catch (error) {
            console.error('Failed to toggle public note view:', error);
            showToast('Unable to update share access', 'error');
        }

        shareChoiceContainer.classList.add('hidden');
        footerUpdateIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" 
                                fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
                                aria-hidden="true" data-tsd-source="/src/components/NoteShare.tsx:74:207">
                                <path d="M20 6 9 17l-5-5"></path>
                                </svg>`;
        footerText.textContent = 'Access updated';
    });


    // user copys link
    copyShareLinkBtn.addEventListener('click', () => {
        // wire up the URL
        const publicUrl = window.location.origin + '/public-note.html?id=' + noteId;
       
        copyToClipboard(copyIconDiv, copyIconSvg, publicUrl);

        if (!currentNote.isPublic) {
            showToast(`Visitor's won't be able to view note unless access is public`, 'info');
        }
    })


}

function updateShareUI(isPublic) {
    if (isPublic) {
        privateCheckmarkIcon.classList.add('hidden');
        publicCheckmarkIcon.classList.remove('hidden');
        shareOptionsBtnText.textContent = 'Anyone with the link';

        // icon within popover
        shareIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" 
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20">
                            </path><path d="M2 12h20"></path>
                            </svg>`;
        
        // icon on share trigger button
        shareNoteBtnIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" 
                                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20">
                                    </path><path d="M2 12h20"></path>
                                    </svg>`;

        accessHelperText.textContent =  'Anyone with this link can read the note. No account needed.';
    } else {
        publicCheckmarkIcon.classList.add('hidden');
        privateCheckmarkIcon.classList.remove('hidden');
        shareOptionsBtnText.textContent = 'Course members only';
        shareIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                                fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" 
                                stroke-linejoin="round" aria-hidden="true">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>`;

         shareNoteBtnIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                                fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" 
                                stroke-linejoin="round" aria-hidden="true">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>`;

        accessHelperText.textContent = 'Only signed-in members of this course can open the note.';
    }
}