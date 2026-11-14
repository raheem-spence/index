import { loadAllUserAccessibleNotes } from "../api/notes.js";
import { loadCurrentUser } from "../script.js";
import { formatRelativeTime } from "../utilities.js";

const noteList = document.getElementById('note-list');

let allNotes = [];
let currentUserId = null;

const filterState = {
    searchQuery: '', // search input text
    scope: 'all', // 'all' or 'mine'
    courseId: '' // '' for all courses, or courseId string
};

document.addEventListener('DOMContentLoaded', () => {
    initializeNotesPage();
})

async function initializeNotesPage() {
    // try reading cache first
    let cachedUser = JSON.parse(sessionStorage.getItem('index_user') || '{}');

    // fallback if cache is empty, fetch user
    if (!cachedUser.id) {
        cachedUser = (await loadCurrentUser()) || {};
    }

    currentUserId = cachedUser.id || null;
   
    // set up listeners
    setUpSearch();
    setUpSegmentedControl();
    setUpCourseDropdown();

    // load data
    loadAllNotes();
}

// =======================================================
// Data Fetching
// =======================================================
async function loadAllNotes() {
    const response = await loadAllUserAccessibleNotes();

    if (!response || !response.success || !response.data || response.data.length === 0) {
        allNotes = [];
    } else {
        allNotes = response.data;
        populateCourseFilterFromNotes(allNotes);
    }

    applyFilters();
}

// automatically populates dropdown with courses present in notes
function populateCourseFilterFromNotes(notes) {
    const menu = document.getElementById('course-filter-menu');
    if (!menu) return;

    // get unique courses from notes
    // Map is a built in collection for key-value pairs: allows functions, objects, numbers,
    // booleans as keys using .set(key, value)
    const uniqueCourses = new Map();
    notes.forEach(note => {
        if (note.courseId && note.courseName) {
            uniqueCourses.set(String(note.courseId), note.courseName);
        }
    });

    menu.innerHTML = `
        <button type="button" class="filter-option active" data-course-id="">All courses</button>
    `;

    uniqueCourses.forEach((name, id) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-option';
        btn.dataset.courseId = id;
        btn.textContent = name;
        menu.appendChild(btn);
    });
}

// =======================================================
// Filter Pipeline (source of truth)
// =======================================================
function applyFilters() {
    const query = filterState.searchQuery.toLowerCase().trim();

    const filtered = allNotes.filter(note => {
        // check scope -- 'all' vs 'mine'
        if (filterState.scope === 'mine') {
            // check ownerId against current user id
            if (note.ownerId !== currentUserId) {
                return false;
            }
        }

        // check course dropdown
        if (filterState.courseId && String(note.courseId) !== String(filterState.courseId)) {
            return false;
        }

        // check search query
        if (query) {
            const titleMatch = note.title?.toLowerCase().includes(query);
            const courseMatch = note.courseName?.toLowerCase().includes(query);
            if (!titleMatch && !courseMatch) {
                return false;
            }
        }

        return true;
    });

    // single source of truth in header
    updateNotesCount(filtered.length);

    if (filtered.length === 0) {
        renderEmptyFilteredNotes();
    } else {
        renderAllNotesView(filtered);
    }
}

// =======================================================
// Event Setup Functions
// =======================================================
function setUpSearch() {
    const searchInput = document.getElementById('notes-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        filterState.searchQuery = e.target.value;
        applyFilters();
    });
    
}

function setUpSegmentedControl() {
    const buttons = document.querySelectorAll('.segmented-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScope = button.dataset.scope; // 'all' or 'mine'
            if (filterState.scope === targetScope) return; // button already selected, do nothing

            // update filterState
            filterState.scope = targetScope;

            // update button styles and ARIA attributes
            buttons.forEach(btn => {
                const isActive = btn === button;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });

            applyFilters();
        })
    })
}

function setUpCourseDropdown() {
    const trigger = document.getElementById('course-filter-trigger');
    const menu = document.getElementById('course-filter-menu');
    const label = document.getElementById('selected-course-label');
    if (!trigger || !menu) return;

    // open / close dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !isHidden);
        trigger.setAttribute('aria-expanded', String(isHidden));
    });

    // close when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
            menu.classList.add('hidden');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    // option selected
    menu.addEventListener('click', (e) => {
        const option = e.target.closest('.filter-option');
        if (!option) return;

        filterState.courseId = option.dataset.courseId || '';
        if (label) label.textContent = option.textContent.trim();

        menu.querySelectorAll('.filter-option').forEach(opt => {
            opt.classList.toggle('active', opt === option);
        });

        menu.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');

        applyFilters();
    });
}


// =======================================================
// Rendering & Helpers
// =======================================================

function renderAllNotesView(notesToRender) {
    noteList.replaceChildren();

    updateNotesCount(notesToRender.length);
    
    for (const note of notesToRender) {
        const noteElement = addNote(note);
        noteList.append(noteElement);
    }
}

function addNote(newNoteData) {
    const noteLi = document.createElement('li');
    const noteATag = document.createElement('a');
    noteATag.href = `/note-detail.html?id=${newNoteData.id}`;

    const noteTitle = document.createElement('span');
    const noteOwnerClsDiv = document.createElement('div');
    const noteCourseDiv = document.createElement('div');
    const noteOwner = document.createElement('span');
    const noteCls = document.createElement('span');

    const noteTime = document.createElement('span');

    noteATag.classList.add('note-a-tag');
    noteTitle.classList.add('note-title', 'truncate');
    noteOwner.classList.add('note-owner');
    noteTime.classList.add('note-time');
    noteOwnerClsDiv.classList.add('note-owner-cls-div');
    noteCourseDiv.classList.add('note-course-div');
    noteCls.classList.add('note-course-name');

    noteLi.dataset.id = newNoteData.id;

    noteTitle.textContent = newNoteData.title;
    noteOwner.textContent = newNoteData.ownerFirstName + " " + newNoteData.ownerLastName;
    noteCls.textContent = `${newNoteData.courseName}`;
    noteTime.textContent = formatRelativeTime(newNoteData.updatedAt);

    noteCourseDiv.append(noteCls, noteOwner)
    noteOwnerClsDiv.append(noteTitle, noteCourseDiv);
    noteATag.append(noteOwnerClsDiv, noteTime);
    noteLi.append(noteATag);

    return noteLi;
}

function updateNotesCount(count) {
    const notesCount = document.getElementById('notes-count');
    if (!notesCount) return;

    notesCount.textContent = `${count} note${count === 1 ? '' : 's'}`;
}

function renderEmptyFilteredNotes() {
    noteList.replaceChildren();

    const noResults = document.createElement('div');
    noResults.classList.add('no-results-state');

    const title = document.createElement('p');
    title.classList.add('no-results-title');

    if (filterState.searchQuery) {
        title.textContent = `No notes matching "${filterState.searchQuery}"`;
    } else if (filterState.scope === 'mine') {
        title.textContent = `You haven't uploaded any notes yet.`;
    } else {
        title.textContent = `No notes found.`;
    }

    noResults.append(title);
    noteList.append(noResults);
}
