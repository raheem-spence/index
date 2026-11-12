import { fetchCourseDetails, fetchCourseMembers } from "../api/courses.js";
import { loadNotes } from "../api/notes.js";
import { formatJoinCode, getCourseInitials, formatRelativeTime, copyToClipboard, showToast } from "../utilities.js";

const noteList = document.getElementById('note-list');
const membersDialogBtn = document.getElementById('members-dialog-btn');
const membersDialog = document.getElementById('members-dialog');
const modalMemberList = document.getElementById('modal-member-list');
const joinCodeBtn = document.getElementById('course-detail-join-code-btn');
const copySvgContainer = document.getElementById('copy-svg-container');

const COPY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                        </svg>`;

let courseNotes = []
let searchQuery = '';
let joinCode = '';

document.addEventListener('DOMContentLoaded', () => {
    initailizeCourseDetailPage();
})


function initailizeCourseDetailPage() {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString);
    const courseId = urlParams.get('id');

    if (!courseId) {
        showError('No course specified', `This link doesn't point to course. Head back to all courses and pick one from the list.`, 'no-course');
        return;
    }

    if (membersDialogBtn && membersDialog) {
        membersDialogBtn.addEventListener('click', () => {
            document.body.classList.add('no-scroll');
            membersDialog.showModal();
        });
    }

    if (membersDialog) {
        membersDialog.addEventListener('click', (e) => {
            const rect = membersDialog.getBoundingClientRect();
    
            const clickedOutside = 
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY > rect.bottom ||
            e.clientY < rect.top;
    
            if (clickedOutside) {
                membersDialog.close();
            }
        });

        membersDialog.addEventListener('close', () => {
            document.body.classList.remove('no-scroll');
        })
    }

    renderCourseDetail(courseId);
    setUpSearch();
    setUpOptionsDropDown();

    if (!joinCodeBtn) return;

    joinCodeBtn.addEventListener('click', () => {
        copyToClipboard(copySvgContainer, COPY_ICON_SVG, joinCode);
    });
}

async function renderCourseDetail(courseId) {
    window.renderCourseDetail = renderCourseDetail;

    // get course details 
    try {

        const [courseDetails, notes, courseMembers] = await Promise.all([
            fetchCourseDetails(courseId),
            loadNotes(courseId),
            fetchCourseMembers(courseId),
        ]);


        if (!courseDetails.data) {
            showError('Course not found', `This course may have been deleted, or the link is incorrect.`, 'no-course');
        }
       

        if (!notes.data) return;
         
        if (!courseMembers.data) return;

        const members = courseMembers.data;
        
        courseNotes = notes.data;
        const courseData = courseDetails.data;

        const courseMonogram = document.getElementById('course-monogram');
        const courseName = document.getElementById('course-name');
        const school = document.getElementById('school');
        const memberCount = document.getElementById('member-count');
        const joinCodeEl = document.getElementById('join-code');
        const modalMemberCount = document.getElementById('modal-member-count');


        if (courseMonogram) courseMonogram.textContent = getCourseInitials(courseData.name);
        if (courseName) courseName.textContent = courseData.name;
        if (school) school.textContent = courseData.school;
        
        const count = courseData.memberCount;
        if (memberCount) memberCount.textContent = count === 1 ? '1 member' : `${count} members`;

        joinCode = courseData.joinCode;
        if (joinCodeEl) joinCodeEl.textContent = formatJoinCode(joinCode);
        if (modalMemberCount) modalMemberCount.textContent = courseData.memberCount;

        renderNotesList(courseNotes);
        renderMemberList(members);

    } catch (error) {
        showError(`Couldn't load this course`, `Check your connection and try again.`, 'no-wifi', () => renderCourseDetail(courseId));
        console.log(error);
    }
}

function renderNotesList(notesToRender) {
    noteList.replaceChildren();

    updateNotesCount(notesToRender.length);

    if (notesToRender.length === 0) {
        renderEmptyFilteredNotes();
        return;
    }

    for (const note of notesToRender) {
        const noteElement = addNote(note);
        noteList.append(noteElement);
    }
}

function addNote(newNoteData) {
    const noteLi = document.createElement('li');
    const noteDiv = document.createElement('a');
    noteDiv.href = `/note-detail.html?id=${newNoteData.id}`;

    const noteTitle = document.createElement('span');
    const noteOwnerClsDiv = document.createElement('div');
    const noteCourseDiv = document.createElement('div');
    const noteOwner = document.createElement('span');
    const noteCls = document.createElement('span');

    const noteTime = document.createElement('span');

    noteDiv.classList.add('note-div');
    noteTitle.classList.add('note-title', 'truncate');
    noteOwner.classList.add('note-owner');
    noteTime.classList.add('note-time');
    noteOwnerClsDiv.classList.add('note-owner-cls-div');
    noteCourseDiv.classList.add('note-course-div');
    noteCls.classList.add('note-course-name');

    noteLi.dataset.id = newNoteData.id;

    noteTitle.textContent = newNoteData.title;
    noteOwner.textContent = [newNoteData.ownerFirstName, newNoteData.ownerLastName].filter(Boolean).join(' ');
    noteCls.textContent = `${newNoteData.courseName}`;
    noteTime.textContent = formatRelativeTime(newNoteData.updatedAt);

    noteCourseDiv.append(noteCls, noteOwner)
    noteOwnerClsDiv.append(noteTitle, noteCourseDiv);
    noteDiv.append(noteOwnerClsDiv, noteTime);
    noteLi.append(noteDiv);

    return noteLi;
}

function updateNotesCount(count) {
    const notesCount = document.getElementById('note-count');
    if (!notesCount) return;

    notesCount.textContent = `${count}`;

}

function setUpSearch() {
    const searchInput = document.getElementById('notes-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyFilters();
    })
}

function applyFilters() {
    const query = searchQuery.toLowerCase().trim();

    const filteredNotes = courseNotes.filter(note => {
        if (query) {
            // check for title match
            const titleMatch = note.title?.toLowerCase().includes(query);

            // checkl for author match
            const fullName = [note.ownerFirstName, note.ownerLastName].filter(Boolean).join(' ');
            const authorMatch = fullName.toLowerCase().includes(query);
            if (!titleMatch && !authorMatch) {
                return false;
            }
        }
    
        return true;
    });

    updateNotesCount(filteredNotes.length);
    if (filteredNotes.length == 0) {
        renderEmptyFilteredNotes();
    } else {
        renderNotesList(filteredNotes);
    }
}

function renderEmptyFilteredNotes() {
    noteList.replaceChildren();

    const noResults = document.createElement('div');
    noResults.classList.add('no-results-state');

    const title = document.createElement('p');
    title.classList.add('no-results-title');

    
    title.textContent = searchQuery ? 'No notes match your search' : 'No notes shared in this course yet';


    noResults.append(title);
    noteList.append(noResults);
}

function renderMemberList(members) {
    modalMemberList.replaceChildren()

    for (const member of members) {
        const listElement = document.createElement('li');
        const initials = document.createElement('span');
        const name = document.createElement('span');

        listElement.classList.add('members-modal-li');
        initials.classList.add('members-initials');
        name.classList.add('members-name');

        const firstLetter = member.firstName ? member.firstName[0].toUpperCase() : '';
        const secondLetter = member.lastName ? member.lastName[0].toUpperCase() : '';

        initials.textContent = firstLetter + secondLetter;
        name.textContent = [member.firstName, member.lastName].filter(Boolean).join(' ');

        listElement.append(initials, name);
        modalMemberList.append(listElement);
    }
}


const ERROR_ICONS = {
    // folder icon with x through it
    'no-course': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
    <path d="m9.5 10.5 5 5"></path>
    <path d="m14.5 10.5-5 5"></path>
    </svg>`,


    // no wifi icon
    'no-wifi': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 20h.01"></path><path d="M8.5 16.429a5 5 0 0 1 7 0">
    </path><path d="M5 12.859a10 10 0 0 1 5.17-2.69"></path><path d="M19 12.859a10 10 0 0 0-2.007-1.523">
    </path><path d="M2 8.82a15 15 0 0 1 4.177-2.643"></path><path d="M22 8.82a15 15 0 0 0-11.288-3.764"></path><path d="m2 2 20 20"></path>
    </svg>`
}

function showError(mainMessage, helperMsg, type = 'no-course', retryFn = null) {
    // empty parent container
    const courseDetailContainer = document.getElementById('course-detail-container');

    if (!courseDetailContainer) return;

    courseDetailContainer.replaceChildren();

    // DOM elements for error display
    const backLink = document.createElement('a');
    backLink.href = '/courses.html';
    backLink.classList.add('back-link');

    const backArrowSvgContainer = document.createElement('div');
    backArrowSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
                                    aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>
                                    </svg>`;

    const backLinkSpan = document.createElement('span');
    backLinkSpan.textContent = "All courses";

    backLink.append(backArrowSvgContainer, backLinkSpan);

    const iconSvg = ERROR_ICONS[type] || ERROR_ICONS['no-course'] || '';
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
    errorRedirectATag.textContent = 'Back to All Courses';
    errorRedirectATag.href = "/courses.html";

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
    courseDetailContainer.append( backLink, errorContainer);
}

function setUpOptionsDropDown() {
    const trigger = document.getElementById('more-actions-btn');
    const menu = document.getElementById('options-menu');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    
    if (!trigger || !menu || !copyLinkBtn) return;

    // open / close dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !isHidden);
        trigger.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    // close when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
            menu.classList.add('hidden');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    copyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('Invite link copied');
        menu.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
    })
}