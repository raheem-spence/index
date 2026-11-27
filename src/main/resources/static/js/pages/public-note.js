import { getPublicNote } from "../api/notes.js";
import { fetchAttachments } from "../api/noteAttachments.js";
import { formatDate, formatFileSize } from "../utilities.js";

const noteTitle = document.getElementById('note-title');
const noteBody = document.getElementById('note-body');
const courseEl = document.getElementById('note-course-name');
const authorEl = document.getElementById('note-author');
const modificationEl = document.getElementById('note-modification');
const dateEl = document.getElementById('note-date');

const noteAttachmentsEl = document.getElementById('note-attachments');
const attachmentsGridEl = document.getElementById('attachments-grid');

document.addEventListener('DOMContentLoaded', () => {
    initializePublicNotePage();
});

function initializePublicNotePage() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const noteId = urlParams.get('id');

    renderPublicNoteDetail(noteId);
    loadAndRenderAttachments(noteId);
}


async function renderPublicNoteDetail(noteId) {
    try {
        const noteData = await getPublicNote(noteId);
        if (!noteData) {
            showError(`Note unavailable`, `This note may be private, deleted, or the link may be incorrect. If you belong to this course, try siging in.`, 'no-note');
            return;
        }

        console.log(noteData);


        if (noteTitle) noteTitle.textContent = noteData.title;
        if (noteBody) noteBody.textContent = noteData.content;
        if (courseEl) courseEl.textContent = noteData.courseName;

        const fullName = [noteData.ownerFirstName, noteData.ownerLastName].filter(Boolean).join(' ');
        if (authorEl) authorEl.textContent = fullName || 'Author';

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



        console.log(noteData);
    } catch (error) {

        if (error.status === 404) {
            showError(`Note unavailable`, `This note may be private, deleted, or the link may be incorrect.\n If you belong to this course, try siging in.`, 'no-note');
        } else {
            showError(`Couldn't load this note`, `Check your connection and try again.`, 'no-wifi', () => renderPublicNoteDetail(noteId));
        }

        console.error('Failed to fetch public note:', error);
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
        console.log(attachments);
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

    } catch (error) {
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
    const publicNoteContainer = document.getElementById('public-note-container');

    // defensive guard if container isn't present, exit 
    if (!publicNoteContainer) return;

    publicNoteContainer.replaceChildren();

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

    const btnsContainer = document.createElement('div');
    btnsContainer.classList.add('btn-container');

    const errorRedirectATag = document.createElement('a');
    errorRedirectATag.textContent = 'Go to Home';
    errorRedirectATag.href = "/index.html";

    errorRedirectATag.classList.add('error-redirect-a-tag');

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
    } else {
        const signInBtn = document.createElement('a');
        signInBtn.href = '/signup.html';
        signInBtn.classList.add('retry-btn');
        signInBtn.textContent = 'Sign in';
        btnsContainer.prepend(signInBtn);
    }

    errorContainer.append(errorSvgContainer, errorTitleMsg, errorHelperMsg, btnsContainer);
    publicNoteContainer.append(errorContainer);
}