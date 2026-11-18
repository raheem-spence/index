import { fetchSavedNotes } from "../api/notes.js";
import { initializeSaveNoteButton } from "../script.js";
import { formatRelativeTime } from "../utilities.js";

const savedNotesSection = document.getElementById('saved-notes-section');

const BOOKMARK = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"></path></svg>`;

let savedNotes = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeSaveNotePage();
})

async function initializeSaveNotePage() {
    try {
        const savedNotesData = await fetchSavedNotes();
        savedNotes = savedNotesData;
    } catch (error) {
        console.error('Unable to fetch saved notes:', error);
    }

    if (savedNotes.length === 0) {
        renderEmptySavedNotes();
        return;
    } else {
        renderSavedNotes(savedNotes);
        return;
    }
}

function renderEmptySavedNotes() {

    if (!savedNotesSection) return;

    savedNotesSection.replaceChildren();

    // DOM elements for empty saved notes display
    const displayContainer = document.createElement('div');
    displayContainer.classList.add('display-container');
    const bookmarkSvgContainer = document.createElement('div');
    bookmarkSvgContainer.innerHTML = BOOKMARK;

    const displayTitleMsg = document.createElement('h2');
    const displayHelperMsg = document.createElement('p');

    displayTitleMsg.classList.add('display-title-msg');
    displayHelperMsg.classList.add('display-helper-msg');

    displayTitleMsg.textContent = 'Nothing saved yet';
    displayHelperMsg.textContent = 'Tap the bookmark on any note to keep it here for exam week.';

    const displayRedirectATag = document.createElement('a');
    displayRedirectATag.textContent = 'Browse all notes';
    displayRedirectATag.href = '/notes.html';
    displayRedirectATag.classList.add('saved-notes-redirect-a-tag');

    displayContainer.append(bookmarkSvgContainer, displayTitleMsg, displayHelperMsg, displayRedirectATag);
    savedNotesSection.append(displayContainer);
}

function renderSavedNotes(notesToRender) {

    if (!savedNotesSection) return;

    savedNotesSection.replaceChildren();

    // create list to store notes
    const savedNoteList = document.createElement('ul');

    updateNotesCount(notesToRender.length);

    // loop through saved notes and render them
    for (const note of notesToRender) {
        const noteItem = document.createElement('li');
        noteItem.dataset.id = note.noteId;
        noteItem.classList.add('note-list-element');

        const noteATag = document.createElement('a');
        noteATag.href = `/note-detail.html?id=${note.noteId}&from=dashboard`;

        const noteOwnerClsDiv = document.createElement('div');

        const saveNoteBtn = document.createElement('button');
        saveNoteBtn.type = 'button';
        const bookmarkSvgContainer = document.createElement('div');
        bookmarkSvgContainer.innerHTML = BOOKMARK;

        saveNoteBtn.appendChild(bookmarkSvgContainer);
        saveNoteBtn.classList.add('save-note-btn');

        const noteTime = document.createElement('span');

        const noteTitle = document.createElement('span');
        const noteCourseDiv = document.createElement('div');
        const noteOwner = document.createElement('span');
        const noteCls = document.createElement('span');

        noteATag.classList.add('note-a-tag');
        noteTitle.classList.add('note-title', 'truncate');
        noteOwner.classList.add('note-owner');
        noteTime.classList.add('note-time');
        noteOwnerClsDiv.classList.add('note-owner-cls-div');
        noteCls.classList.add('note-course-name');
        noteCourseDiv.classList.add('note-course-div');
        savedNoteList.classList.add('note-list');

        noteTitle.textContent = note.title;
        noteOwner.textContent = note.ownerFirstName + " " +  note.ownerLastName;
        noteCls.textContent = `${note.courseName}`;
        noteTime.textContent =  formatRelativeTime(note.updatedAt);

        noteCourseDiv.append(noteCls, noteOwner);
        noteOwnerClsDiv.append(noteTitle, noteCourseDiv);
        noteATag.append(noteOwnerClsDiv, noteTime);
        noteItem.append(noteATag, saveNoteBtn);
        savedNoteList.append(noteItem);

        initializeSaveNoteButton(saveNoteBtn, note.noteId, true, (toggleId, savedStatus) => {
            savedNotes = savedNotes.filter(savedNote => savedNote.noteId !== toggleId);
            
            if (savedNotes.length === 0) {
                updateNotesCount(savedNotes.length);
                renderEmptySavedNotes();
                return;
            } else {
                renderSavedNotes(savedNotes);
                return;
            }
        });
    }

    savedNotesSection.append(savedNoteList);
}

function updateNotesCount(count) {
    const savedNotesCount = document.getElementById('saved-notes-count');
    if (!savedNotesCount) return;

    if (count === 0) {
        savedNotesCount.textContent = ''
    } else {
        savedNotesCount.textContent = `${count} note${count === 1 ? '' : 's'}`;
    }
}
