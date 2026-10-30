import { loadAllUserAccessibleNotes } from "../api/notes.js";
import { formatRelativeTime } from "../utilities.js";

const notesContainer = document.getElementById('notes-container');
const allNotesHeader = document.createElement('div');
const allNotesTitleContainer = document.createElement('div');
const allNotesTitle = document.createElement('h1');
const allNotesMessage = document.createElement('p');


const allNotesResult = await loadAllUserAccessibleNotes();
const allNotes = allNotesResult.data;


function renderAllNotesView() {

    const createNoteBtn = document.createElement('button');
    const plusSvgContainer = document.createElement('div');
    const plusSignString = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" 
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                            class="lucide lucide-plus preview-icon"><path d="M5 12h14"/><path d="M12 5v14"/>
                            </svg>`;
    plusSvgContainer.innerHTML = plusSignString;
    createNoteBtn.textContent = "Create note";

    createNoteBtn.classList.add('create-note-btn');

    const notesToolBar = document.createElement('div');

    const notesToggleContainer = document.createElement('div');
    const allNotesTab = document.createElement('button');
    const myNotesTab = document.createElement('button');
    const allNotesTotal = document.createElement('span');
    const myNotesTotal = document.createElement('span');

    allNotesTab.textContent = "All Notes";
    myNotesTab.textContent = "My Notes";

    const notesSearchControls = document.createElement('div');
    const searchBarContainer = document.createElement('div');
    const searchIconSvgContainer = document.createElement('div');
    const searchIconString = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                            stroke-linejoin="round" class="lucide lucide-search preview-icon"><path d="m21 21-4.34-4.34"/>
                            <circle cx="11" cy="11" r="8"/>
                            </svg>`;
    searchIconSvgContainer.innerHTML = searchIconString;
    const searchInput = document.createElement('input');
    searchInput.placeholder = "Search notes...";

    const courseFilterBtn = document.createElement('button');
    const filterSvgContainer = document.createElement('div');
    const filterSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
                            stroke-linejoin="round" class="lucide lucide-funnel preview-icon"><path d="M10 20a1 1 0 0 0 .553.895l2 
                            1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>
                            </svg>`;
    filterSvgContainer.innerHTML = filterSvgString;

    const chevronDownSvgContainer = document.createElement('div');
    const chevronDownString = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                             class="lucide lucide-chevron-down preview-icon"><path d="m6 9 6 6 6-6"/>
                             </svg>`;
    chevronDownSvgContainer.innerHTML = chevronDownString;

    const noteList = document.createElement('ul');
    noteList.classList.add('note-list');

    const notesSection = document.createElement('section');

    if (allNotes.length === 0) {
        const emptySearchNotesDiv = document.createElement('div');
        const noteSvgContainer = document.createElement('div');
        const mainMsg = document.createElement('p');
        const secondMsg = document.createElement('p');
        
        emptySearchNotesDiv.classList.add('empty-search-notes');
        mainMsg.classList.add('main-msg-empty-notes');
        secondMsg.classList.add('second-msg-empty-notes');
        noteSvgContainer.classList.add('empty-note-svg');
        
        noteSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" 
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" 
                                    stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text" 
                                    style="color: var(--primary);"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z">
                                    </path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>
                                    </svg>`;
        mainMsg.textContent = "No notes yet";
        secondMsg.textContent = "Be the first to share a note with your classmates.";

        emptySearchNotesDiv.append(noteSvgContainer, mainMsg, secondMsg);
        noteList.append(emptySearchNotesDiv);
    } else {
        for (const note of allNotes) {
            const noteElement = addNote(note);
            noteList.append(noteElement);
        }
    }


    courseFilterBtn.textContent = "All Courses";

    allNotesTitle.textContent = "Notes";
    allNotesMessage.textContent = "Your notes and your classmates' notes, all in one place."

    notesToolBar.classList.add('notes-toolbar');

    notesToggleContainer.classList.add('notes-toggle-container');
    allNotesTab.classList.add('all-notes-tab');
    myNotesTab.classList.add('my-notes-tab');

    notesSearchControls.classList.add('notes-search-controls');
    searchBarContainer.classList.add('search-bar-container');

    courseFilterBtn.classList.add('course-filter-btn');

    allNotesTitle.classList.add('dashboard-title');
    allNotesMessage.classList.add('dashboard-msg');
    allNotesHeader.classList.add('all-notes-header');
    allNotesTitleContainer.classList.add('dashboard-title-container');
    
    notesToggleContainer.append(allNotesTab, myNotesTab);
    searchBarContainer.append(searchIconSvgContainer, searchInput);
    courseFilterBtn.prepend(filterSvgContainer);
    courseFilterBtn.append(chevronDownSvgContainer);
    notesSearchControls.append(searchBarContainer, courseFilterBtn);
    notesToolBar.append(notesSearchControls, notesToggleContainer)
    createNoteBtn.prepend(plusSvgContainer);
    allNotesTitleContainer.append(allNotesTitle, allNotesMessage);
    allNotesHeader.append(allNotesTitleContainer, createNoteBtn);
    notesSection.append(noteList);

    notesContainer.append(allNotesHeader, notesToolBar, notesSection);
}


function addNote(newNoteData) {
    const noteLi = document.createElement('li');
    const noteDiv = document.createElement('div');

    const noteTitleDiv = document.createElement('div');
    const noteTitle = document.createElement('p');
    const noteOwnerDiv = document.createElement('div');
    const noteInitialsDiv = document.createElement('div');
    const noteInitials = document.createElement('span');
    const noteOwner = document.createElement('p');

    const noteTimeDiv = document.createElement('div');
    const clockSvgContainer = document.createElement('div');
    const clockSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock">
                            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                            </svg>`;
    const noteTime = document.createElement('p');

    noteDiv.classList.add('note-div');
    noteTitleDiv.classList.add('note-title-div');
    noteTitle.classList.add('note-title');
    noteOwner.classList.add('note-owner');
    noteTime.classList.add('note-time');
    noteTimeDiv.classList.add('note-time-div');
    noteInitialsDiv.classList.add('note-initials-div');
    noteInitials.classList.add('note-initials');
    noteOwnerDiv.classList.add('note-owner-div');

    noteLi.dataset.id = newNoteData.id;

    noteTitle.textContent = newNoteData.title;
    noteOwner.textContent = newNoteData.ownerFirstName + " " + newNoteData.ownerLastName;
    noteInitials.textContent = newNoteData.ownerFirstName[0].toUpperCase() + newNoteData.ownerLastName[0].toUpperCase();
    noteTime.textContent = formatRelativeTime(newNoteData.updatedAt);

    clockSvgContainer.innerHTML = clockSvgString;

    noteTitleDiv.append(noteTitle, noteOwnerDiv);
    noteTimeDiv.append(clockSvgContainer, noteTime);
    noteInitialsDiv.append(noteInitials);
    noteOwnerDiv.append(noteInitialsDiv, noteOwner);
    noteDiv.append(noteTitleDiv, noteTimeDiv);
    noteLi.append(noteDiv);

    return noteLi;
}

renderAllNotesView();