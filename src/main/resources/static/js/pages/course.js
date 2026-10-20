// imports
import { fetchCourses, fetchCourseDetails, fetchCourseMembers } from "../api/courses.js";
import { fetchCurrentUser } from "../api/users.js";
import { loadNotes, createNote, deleteNote, updateNote } from "../api/notes.js"
import { formatRelativeTime, delay, formatDate, showToast } from "../utilities.js";

// constanst / URL params / DOM elements
const baseCourseUrl = '/course.html'
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const courseId = Number(urlParams.get('courseId'));


const currSiteLocation = document.getElementById('site-location-div');

async function initializeApp() {
    const coursesResult = await fetchCourses();
    if (!coursesResult.success) {
        return; 
    }
    const courses = coursesResult.data;
    renderSideBarCourses(courses);
    renderRoute(courseId);
    renderUser();
}


const courseContainer = document.getElementById('course-container');

const dropdownMenu = document.getElementById('dropdown-menu');
const sidebarDropdownBtn = document.getElementById('sidebar-label');
const sidebarArrow = document.getElementById('sidebar-arrow');
const ulContainer = document.getElementById('course-list');


const userBtn = document.getElementById('user-icon-btn');
const dropdownModal = document.getElementById('dropdown-modal');
const profileArrow = document.getElementById('profile-arrow');

const userDiv = document.getElementById("user-info");
const userIconName = document.getElementById('user-icon-name');
const userInitials = document.getElementById('initials');

const toast = document.createElement('div');
const toastTxt = document.createElement('span');
const checkMarkSvgContainer = document.createElement('div');
checkMarkSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clip-rule="evenodd"/>
                                    </svg>`;

toast.classList.add('toast', 'hidden');
checkMarkSvgContainer.classList.add('toast-checkmark');
toast.append(checkMarkSvgContainer, toastTxt);
document.body.appendChild(toast);



// function definitions
async function renderCourseView(courseId) {
    // get course details
    const courseDetailsResult = await fetchCourseDetails(courseId);

    if (!courseDetailsResult.success) {
        return;
    }
    const courseDetails = courseDetailsResult.data;

    // get course members
    const courseMembersResult = await fetchCourseMembers(courseId);

    if (!courseMembersResult.success) {
        return;
    }
    const courseMembers = courseMembersResult.data;

    // get course notes
    const courseNotesResult = await loadNotes(courseId);

    if (!courseNotesResult.success) {
        return;
    }
    const courseNotes = courseNotesResult.data;

    // get current user
    const currentUserResult = await fetchCurrentUser();

    if (!currentUserResult.success) {
        return;
    }

    const currentUser = currentUserResult.data;

    const membersModal = renderMembersModal(courseMembers, currentUser);
    const notesContainer = renderCourseNotes(courseNotes, courseDetails);


    // dom elements
    const courseHeaderDiv = document.createElement('div');
    const courseInfoDiv = document.createElement('div');
    const courseInviteDiv = document.createElement('div');

    const courseDataDiv = document.createElement('div');
    const membersBtn = document.createElement('button');
    const membersSpan = document.createElement('span');

    const joinCodeBtn = document.createElement('button');
    const joinCodeSpan = document.createElement('span');
    const joinCodeDivider = document.createElement('span');
    const joinCodeText = document.createElement('span');

    

    const courseName = document.createElement('h1');

    const copySvgContainer = document.createElement('div');
    const copySvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy" 
                            style="color: var(--muted-foreground);"><rect width="14" height="14" x="8" y="8" rx="2" ry="2">
                            </rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                            </svg>`



  

    copySvgContainer.innerHTML = copySvgString;


    joinCodeBtn.addEventListener('click', async () => {
        try {
                // copy code to clipboard
                await navigator.clipboard.writeText(courseDetails.joinCode);

                // change the icon
                const checkMarkString = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" 
                                        stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path>
                                        </svg>`;
                copySvgContainer.style.opacity = 0;

                setTimeout(() => {
                    copySvgContainer.innerHTML = checkMarkString;
                    copySvgContainer.style.opacity = 1;
                }, 150);

                setTimeout(() => {
                    copySvgContainer.style.opacity = 0;

                    setTimeout(() => {
                        copySvgContainer.innerHTML = copySvgString;
                        copySvgContainer.style.opacity = 1;
                    }, 150);
                }, 1500);

            } catch (error) {
                console.error('Failed to copy:', error);
            }
       
    });

    
    membersBtn.addEventListener('click', () => {
        membersModal.showModal();
        document.body.style.overflow = 'hidden';
    })


    const memberSvgContainer = document.createElement('div');
    const memberSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users" style="color: var(--muted-foreground);"><circle cx="9" cy="7" r="4">
                            </circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>`;
    memberSvgContainer.innerHTML = memberSvgString;

    joinCodeSpan.textContent = courseDetails.joinCode;
    joinCodeDivider.textContent = "|";
    joinCodeText.textContent = "Join code";

    courseName.textContent = courseDetails.name;
    membersSpan.textContent = `${courseDetails.memberCount} members`;


    // css classes
    courseHeaderDiv.classList.add('course-header-div');
    courseInfoDiv.classList.add('course-info-div');
    courseDataDiv.classList.add('course-data-div');
    courseName.classList.add('course-view-name');
    membersBtn.classList.add('members-btn');

    joinCodeBtn.classList.add('join-code-btn');
    joinCodeDivider.classList.add('join-code-divider');
    joinCodeText.classList.add('join-code-text');
    joinCodeSpan.classList.add('join-code');

    copySvgContainer.classList.add('copy-svg-container');

    


    // append to DOM
    joinCodeBtn.append(joinCodeText, joinCodeDivider, joinCodeSpan, copySvgContainer);
    membersBtn.append(memberSvgContainer, membersSpan);
    courseDataDiv.append(courseName, membersBtn);
    courseInfoDiv.append(courseDataDiv);
    courseInviteDiv.append(joinCodeBtn);
    courseHeaderDiv.append(courseInfoDiv, courseInviteDiv);
    courseContainer.append(courseHeaderDiv, membersModal, notesContainer);
}

function renderCourseNotes(courseNotes, courseDetails) {

    // notes section/container
    const notesContainer = document.createElement('section');

    // notes header
    const notesHeader = document.createElement('div');

    const searchDiv = document.createElement('div');
    const searchSvgContainer = document.createElement('div');
    const searchSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"
                            style="color: var(--muted-foreground); flex-shrink: 0;"><circle cx="11" cy="11" r="8">
                            </circle><path d="m21 21-4.3-4.3"></path>
                            </svg>`;

    const searchBar = document.createElement('input');
    searchBar.type = "search";

    const createNoteBtn = document.createElement('button');

    const createNoteModal = renderCreateNoteModal(courseDetails, insertNewNote);

    createNoteBtn.addEventListener('click', () => {
        createNoteModal.showModal();
        document.body.style.overflow = 'hidden';
    })

    const plusSvgContainer = document.createElement('div');
    const plusSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
                            <path d="M5 12h14"></path><path d="M12 5v14"></path>
                            </svg>`;
    plusSvgContainer.innerHTML = plusSvgString;

   
    // notes list heading
    const notesListHeadingDiv = document.createElement('div');
    const noteSectionTitle = document.createElement('span');
    const notesTotal = document.createElement('span');

    noteSectionTitle.textContent = "All Notes";
    notesTotal.textContent = courseDetails.noteCount;

    // notes list
    const noteList = document.createElement('ul');

    function insertNewNote(newNoteData) {
        courseNotes.unshift(newNoteData);
        renderFilteredNotes(searchBar.value, courseNotes, noteList, notesTotal, noteSectionTitle);
    }

    if (courseNotes.length === 0) {
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
        secondMsg.textContent = "Be the first to share a note with your classmates."
        
        emptySearchNotesDiv.append(noteSvgContainer, mainMsg, secondMsg)
        noteList.append(emptySearchNotesDiv);
    } else {
        for (const note of courseNotes) {
            const noteElement = addNote(note);
            noteList.append(noteElement);
        }
    }

    searchNotes(courseNotes, searchBar, noteList, notesTotal, noteSectionTitle);

    noteList.addEventListener('click', (event) => {
        // find the closest li
        const closestLi = event.target.closest('li');

        if (closestLi && noteList.contains(closestLi)) {

            const clickedNoteId = parseInt(closestLi.dataset.id);
            const note = courseNotes.find(note => note.id === clickedNoteId);

            if (note) {
                urlParams.set('noteId', note.id);
                const newQueryString = urlParams.toString();
                const newUrl = baseCourseUrl + '?' + newQueryString;
                history.pushState(null, '', newUrl);
                renderNoteDetailView(note);
            }
        }
    })

    notesHeader.classList.add('course-notes-header');
    searchDiv.classList.add('search-bar-container');
    searchSvgContainer.classList.add('search-icon');
    createNoteBtn.classList.add('create-note-btn-course');

    notesContainer.classList.add('course-notes-container');

    noteList.classList.add('note-list');
    notesListHeadingDiv.classList.add('notes-list-heading-div');
    noteSectionTitle.classList.add('notes-section-title');
    notesTotal.classList.add('notes-total');


    searchSvgContainer.innerHTML = searchSvgString;
    createNoteBtn.textContent = "Create note";
    searchBar.placeholder = "Search notes...";

    notesListHeadingDiv.append(noteSectionTitle, notesTotal);

    searchDiv.append(searchSvgContainer, searchBar);
    createNoteBtn.prepend(plusSvgContainer);
    notesHeader.append(searchDiv, createNoteBtn);


    notesContainer.append(notesHeader, notesListHeadingDiv, createNoteModal, noteList);
    return notesContainer;
}

function renderCreateNoteModal(courseDetails, insertNewNote) {

    let isNoteSuccessful = false;

    // create note modal
    const createNoteModal = document.createElement('dialog');

    // header div
    const createNoteModalHeader = document.createElement('div');
    const createNoteTitle = document.createElement('h3');
    const createNoteMessage = document.createElement('p');

    createNoteTitle.textContent = "Create a note";
    createNoteMessage.textContent = "Share with your classmates.";



    // course/close btn div
    const createModalCloseDiv = document.createElement('div');
    const courseName = document.createElement('span');
   
    const createModalCloseBtn = document.createElement('button');
    const closeBtnString = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
                            <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;   
    
    createModalCloseBtn.innerHTML = closeBtnString;
    createModalCloseBtn.setAttribute('aria-label', 'Close');

    courseName.textContent = courseDetails.name;
    createModalCloseDiv.append(courseName, createModalCloseBtn);

    // note title div
    const modalNoteTitleDiv = document.createElement('div')
    const modalNoteTitleLabel = document.createElement('label');
    const modalNoteTitleInput = document.createElement('input');
    const titleError = document.createElement('p');
    titleError.textContent = "Title needed";
    titleError.classList.add('field-error', 'hidden');


    modalNoteTitleLabel.htmlFor = 'create-note-title';
    modalNoteTitleLabel.textContent = "Note title";

    modalNoteTitleInput.id = 'create-note-title';
    modalNoteTitleInput.placeholder = "Note title...";

    // note content div
    const modalNoteContentDiv = document.createElement('div');
    const modalNoteContentLabel = document.createElement('label');
    const modalNoteContent = document.createElement('textarea');
    const contentError = document.createElement('p');
    contentError.textContent = "Content needed";
    contentError.classList.add('field-error', 'hidden');

    modalNoteContentLabel.htmlFor = 'create-note-content';
    modalNoteContentLabel.textContent = 'Note content';

    modalNoteContent.id = 'create-note-content';
    modalNoteContent.placeholder = "Start writing your note...";

    // share button div
    const modalShareFooter = document.createElement('footer');
    const modalShareBtn = document.createElement('button');
    const modalShareBtnTxt = document.createElement('span');
    const shareArrowSvgContainer = document.createElement('div');
    const shareArrowString = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right">
                            <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`;

    shareArrowSvgContainer.setAttribute('aria-hidden', 'true');

    modalShareBtnTxt.textContent = "Share with class";
    shareArrowSvgContainer.innerHTML = shareArrowString;

    createNoteModal.classList.add('create-modal');
    createNoteModalHeader.classList.add('create-note-modal-header');
    createNoteTitle.classList.add('create-note-title');
    createNoteMessage.classList.add('create-note-msg');
    createModalCloseBtn.classList.add('modal-close-btn');
    createModalCloseDiv.classList.add('modal-close-div');
    courseName.classList.add('modal-course-badge');

    modalNoteTitleInput.classList.add('modal-note-title');
    modalNoteTitleLabel.classList.add('visually-hidden');
    modalNoteTitleDiv.classList.add('modal-note-title-div');
    modalNoteContentDiv.classList.add('modal-content-div');

    modalNoteContent.classList.add('modal-textarea');
    modalNoteContentLabel.classList.add('visually-hidden');

    modalShareBtn.classList.add('share-btn');
    modalShareFooter.classList.add('share-footer');

    let titleHasError = false;
    let contentHasError = false;

    createModalCloseBtn.addEventListener('click', () => {
        createNoteModal.close();
    })

    createNoteModal.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'opacity') {
            createNoteModal.close();
        }
    })


    createNoteModal.addEventListener('close', () => {
        document.body.style.overflow = '';
        resetCreateNoteModal(titleError, contentError, createNoteModal, modalNoteTitleInput, modalNoteContent, modalShareBtn, modalShareBtnTxt, shareArrowSvgContainer, shareArrowString);
        if (isNoteSuccessful) {
            showToast("Note shared with class");
            modalShareBtn.classList.remove('success');
        }

        console.log("modal closed");
        console.log(isNoteSuccessful);

        titleHasError = false;
        contentHasError = false;
        isNoteSuccessful = false;
    })

    modalShareBtn.append(modalShareBtnTxt, shareArrowSvgContainer);
    modalShareFooter.append(modalShareBtn);
    modalNoteTitleDiv.append(modalNoteTitleLabel, modalNoteTitleInput, titleError);
    modalNoteContentDiv.append(modalNoteTitleDiv, modalNoteContentLabel, modalNoteContent, contentError);

    createNoteModalHeader.append(createModalCloseDiv, createNoteTitle, createNoteMessage);
   
    createNoteModal.append(createNoteModalHeader, modalNoteContentDiv, modalShareFooter);

    modalNoteTitleInput.addEventListener('input', () => {

        if (!titleHasError) {
            if (modalNoteTitleInput.value.trim() === "") {
                titleError.classList.add('hidden');
                modalNoteTitleInput.classList.remove('input-error');
            }
        } else {
            if (modalNoteTitleInput.value.trim() !== "") {
                titleError.classList.add('hidden');
                modalNoteTitleInput.classList.remove('input-error');
                titleHasError = false;
            } else {
                titleError.classList.remove('hidden');
                modalNoteTitleInput.classList.add('input-error');
            }
        }
    })

    modalNoteContent.addEventListener('input', () => {

        if (!contentHasError) {
            if (modalNoteContent.value.trim() === "") {
                contentError.classList.add('hidden');
                modalNoteContent.classList.remove('content-error');
            }
        } else {
            if (modalNoteContent.value.trim() !== "") {
                contentError.classList.add('hidden');
                modalNoteContent.classList.remove('content-error');
                contentHasError = false;
            } else {
                contentError.classList.remove('hidden');
                modalNoteContent.classList.add('content-error');
            }
        }
    })

    modalShareBtn.addEventListener('click', async () => {
        const noteData = {
            title: modalNoteTitleInput.value,
            content: modalNoteContent.value
        }

        const validated = validateNoteData(noteData.title, noteData.content);

        if (validated.titleHasError) {
            titleError.classList.remove('hidden');
            modalNoteTitleInput.classList.add('input-error');
            titleHasError = true;
        }

        if (validated.contentHasError) {
            contentError.classList.remove('hidden');
            modalNoteContent.classList.add('content-error');
            contentHasError = true;
        }

        if (validated.titleHasError || validated.contentHasError) {
            return;
        }
        
        modalShareBtnTxt.textContent = "Sharing...";
        shareArrowSvgContainer.innerHTML = "";

      
        const result = await Promise.all([
            createNote(courseId, noteData),
            delay(800)
        ]);
        
        if (result[0]) {
            const newNoteData = result[0];
            insertNewNote(newNoteData);
            isNoteSuccessful = true;
            modalShareBtnTxt.textContent = "Shared";
            shareArrowSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                                                stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check preview-icon">
                                                <path d="M20 6 9 17l-5-5"/></svg>`;
            modalShareBtn.classList.add('success');
            await delay(800);
            createNoteModal.classList.add('closing');
        } else {
            modalShareBtnTxt.textContent = "Share with class";
            shareArrowSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" 
                                                stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right">
                                                <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`;
            modalShareBtn.classList.remove('success');
        }
    
    
    })

    return createNoteModal;
}

function resetCreateNoteModal(titleError, contentError, createNoteModal, modalNoteTitleInput, modalNoteContent, modalShareBtn, modalShareBtnTxt, shareArrowSvgContainer, shareArrowString) {
    
    modalNoteTitleInput.value = "";
    modalNoteContent.value = "";

    modalNoteTitleInput.classList.remove('input-error');
    modalNoteContent.classList.remove('content-error');

    titleError.classList.add('hidden');
    contentError.classList.add('hidden');

 
    modalShareBtnTxt.textContent = "Share with class";
    shareArrowSvgContainer.innerHTML = shareArrowString;
    createNoteModal.classList.remove('closing');

}

function renderMembersModal(courseMembers, currentUser) {

    // members modal wrapper div
    const membersModalDiv = document.createElement('div');

    // members modal
    const membersModal = document.createElement('dialog');

    // header div
    const membersModalHeader = document.createElement('div');


    // title div
    const membersCloseDiv = document.createElement('div');
    const memberCount = document.createElement('h3');
    const closeBtn = document.createElement('button');
    const closeSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
                            <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
    closeBtn.innerHTML = closeSvgString;
    
 
    // members container
    const memberContainer = document.createElement('div');

    // build members list
    const memberList = document.createElement('ul');

    for (const member of courseMembers) {
        // create a li tag
        const memberItem = document.createElement('li');

        // div for member avatar
        const memberInitials = document.createElement('div');
        const memberInitialsSpan = document.createElement('span');
        memberInitialsSpan.textContent = member.firstName[0].toUpperCase() + member.lastName[0].toUpperCase();

        // div for name and joined at date
        const memberInfo = document.createElement('div');
        const memberNameDiv = document.createElement('div');
        const memberName = document.createElement('p');
        const joinedDate = document.createElement('span');

        if (currentUser.id === member.id) {
            const currUserSpan = document.createElement('span');
            currUserSpan.textContent = "You";

            currUserSpan.classList.add('current-user-span');

            memberNameDiv.append(memberName, currUserSpan);
        } else {
            memberNameDiv.append(memberName);
        }
        
        memberItem.classList.add('member-item');
        memberInitials.classList.add('member-initials');
        memberInfo.classList.add('member-info-div');
        memberName.classList.add('member-name');
        joinedDate.classList.add('joined-date');
        memberNameDiv.classList.add('member-name-div');

        memberName.textContent = member.firstName + " " + member.lastName;
        joinedDate.textContent = `Joined ${formatDate(member.joinedAt)}`;

        memberInitials.append(memberInitialsSpan);
        memberInfo.append(memberNameDiv, joinedDate);
        memberItem.append(memberInitials, memberInfo);

        memberList.append(memberItem);
    }

    closeBtn.addEventListener('click', () => {
        membersModal.close();
        document.body.style.overflow = '';
    })

    membersModalDiv.classList.add('members-modal-div');
    membersModal.classList.add('members-modal');
    membersModalHeader.classList.add('modal-header');
    membersCloseDiv.classList.add('modal-close-div');
    closeBtn.classList.add('modal-close-btn');
    memberContainer.classList.add('member-container');

    // members modal 
    memberCount.textContent = `${courseMembers.length} Members`;

    memberContainer.append(memberList);
    membersCloseDiv.append(memberCount, closeBtn);
    membersModalHeader.append(membersCloseDiv);
    membersModalDiv.append(membersModalHeader, memberContainer);
    membersModal.append(membersModalDiv);

    return membersModal;
}

function searchNotes(courseNotes, searchBar, noteList, notesTotal, noteSectionTitle) {
    searchBar.addEventListener('input', (event) => {
        const searchString = event.target.value.toLowerCase();

        renderFilteredNotes(searchString, courseNotes, noteList, notesTotal, noteSectionTitle);

    })
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

async function renderNoteDetailView(noteData) {
    courseContainer.replaceChildren();

    const noteDetailContainer = document.createElement('div');

    const allBtnsDiv = document.createElement('div');
    
    const currUserResult = await fetchCurrentUser();
    if (!currUserResult.success) {
        return;
    }

    const currUser = currUserResult.data;

    const backBtn = document.createElement('button');
    const backArrowSvgContainer = document.createElement('div');
    const backArrowString = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5M12 5l-7 7 7 7" data-fg-eeut183="10.10:270.389:/src/app/components/CoursePage.tsx:525:11:28779:35:e:path">
                            </path></svg>`;
    
    backArrowSvgContainer.innerHTML = backArrowString;

    backBtn.addEventListener('click', () => {
        urlParams.delete('noteId');
        const newQstring = urlParams.toString();
        const newUrl = baseCourseUrl + '?' + newQstring;
        history.pushState(null, '', newUrl);

        renderRoute(courseId);
    })

    const noteCourseDiv = document.createElement('div');
    const noteCourseATag = document.createElement('a');

    
    noteCourseATag.textContent = noteData.courseName;
    noteCourseATag.href = `course.html?courseId=${noteData.courseId}`;

    noteCourseATag.classList.add('note-course-a-tag');
    noteCourseDiv.classList.add('note-course-div');

    noteCourseDiv.append(noteCourseATag);

    const noteTitle = document.createElement('h1');
    const noteContent = document.createElement('p');

    const metadataSeparator = document.createElement('p');
    metadataSeparator.textContent = "·";

    const metadataSeparatorTwo = document.createElement('p');
    metadataSeparatorTwo.textContent = "·";

    const noteMetaDataDiv = document.createElement('div');
    const date = document.createElement('p');
    const initialsDiv = document.createElement('div');
    const initalsSpan = document.createElement('span');

    const noteOwnerDateDiv = document.createElement('div');
    const noteOwner = document.createElement('p');

    backBtn.textContent = "All notes";

    initalsSpan.textContent = noteData.ownerFirstName[0].toUpperCase() + noteData.ownerLastName[0].toUpperCase();
    noteTitle.textContent = noteData.title;
    noteContent.textContent = noteData.content;
    noteOwner.textContent = noteData.ownerFirstName + " " + noteData.ownerLastName;

    noteDetailContainer.classList.add('note-detail-container');
    backBtn.classList.add('back-btn');
    noteTitle.classList.add('note-view-title');
    noteContent.classList.add('note-view-content');
    noteMetaDataDiv.classList.add('note-meta-data-div');
    noteOwner.classList.add('note-view-owner');
    initialsDiv.classList.add('initials-div');
    initalsSpan.classList.add('initials-span');
    date.classList.add('note-view-date');
    noteOwnerDateDiv.classList.add('note-owner-date-div');
    allBtnsDiv.classList.add('all-btns-div');



    if (noteData.updatedAt != noteData.createdAt) {
        date.textContent = `Updated ${formatDate(noteData.updatedAt)}`;
    } else {
        date.textContent = `Created ${formatDate(noteData.createdAt)}`;
    }


    if (currUser.id === noteData.ownerId) {

        const actionButtonsDiv = document.createElement('div');
        const editSvgContainer = document.createElement('div');
        const editBtn = document.createElement('button');
        const editIconString = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" 
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" 
                                stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil" 
                                style="color: var(--muted-foreground);"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z">
                                </path><path d="m15 5 4 4"></path></svg>`;
        editSvgContainer.innerHTML = editIconString;
    
        const delSvgContainer = document.createElement('div');
        const delIconString = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" 
                                fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" 
                                class="lucide lucide-trash2 lucide-trash-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6">
                                </path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line>
                                </svg>`;
        delSvgContainer.innerHTML = delIconString;
        const deleteDiv = document.createElement('div');
        const deleteLabel = document.createElement('p');
        const deleteConfirmLabel = document.createElement('p');
        deleteLabel.textContent = "Delete";
        deleteConfirmLabel.textContent = "Delete?";
        
        const yesBtn = document.createElement('button');
        const noBtn = document.createElement('button');
    
        yesBtn.textContent = "Yes";
        noBtn.textContent = "No";
    
        yesBtn.classList.add('yes-btn');
        noBtn.classList.add('no-btn');
    
        yesBtn.style.display = 'none';
        noBtn.style.display = 'none';
        deleteConfirmLabel.style.display = 'none';
    
    
        editBtn.addEventListener('click', () => {
           renderNoteEditView(noteData, noteDetailContainer);
        })
    
        deleteDiv.addEventListener('click', (event) => {
           
            deleteDiv.classList.add('clicked');
    
            delSvgContainer.style.display = 'none';
            yesBtn.style.display = '';
            noBtn.style.display = '';
            deleteLabel.style.display = 'none';
            deleteConfirmLabel.style.display = '';
    
        })
    
        yesBtn.addEventListener('click', async (event) => {
            // stop the event from bubbling up to the parent
            event.stopPropagation();
    
            // delete note
            const deleted = await deleteNote(courseId, noteData.id);
            if (deleted) {
                resetDeleteBtn(deleteDiv, deleteLabel, deleteConfirmLabel, delSvgContainer, yesBtn, noBtn);
                
                const currUrlParams = new URLSearchParams(window.location.search);
                currUrlParams.delete('noteId');
    
                const currUrl = baseCourseUrl + '?' + currUrlParams.toString();
                history.replaceState(null, '', currUrl);
    
                renderRoute(courseId);
                showToast("Note deleted");
            }
    
        })
    
        noBtn.addEventListener('click', (event) => {
            // stop the event from bubbling up to the parent
            event.stopPropagation();
            resetDeleteBtn(deleteDiv, deleteLabel, deleteConfirmLabel, delSvgContainer, yesBtn, noBtn);
        })
    
        document.addEventListener('click', (event) => {
            const isClickInside = deleteDiv.contains(event.target);
    
            if (!isClickInside) {
               resetDeleteBtn(deleteDiv, deleteLabel, deleteConfirmLabel, delSvgContainer, yesBtn, noBtn);
            }
        })
    
    
        editBtn.textContent = "Edit";

        actionButtonsDiv.classList.add('action-buttons-div');
        allBtnsDiv.classList.add('all-btns-div');
        editBtn.classList.add('note-view-edit-btn');
        deleteDiv.classList.add('note-view-del-btn');

        editBtn.prepend(editSvgContainer);
        deleteDiv.append(delSvgContainer, deleteLabel, deleteConfirmLabel, yesBtn, noBtn);
    
        actionButtonsDiv.append(editBtn, deleteDiv);
        allBtnsDiv.append(backBtn, actionButtonsDiv);
        noteOwnerDateDiv.append(noteOwner, metadataSeparator, date);
        initialsDiv.append(initalsSpan);
        noteMetaDataDiv.append(initialsDiv, noteOwnerDateDiv, metadataSeparatorTwo, noteCourseDiv);
        backBtn.prepend(backArrowSvgContainer);
        noteDetailContainer.append(allBtnsDiv, noteTitle, noteMetaDataDiv, noteContent);
        courseContainer.append(noteDetailContainer);
    } else {
        const viewOnlyDiv = document.createElement('div');
        const eyeIconSvgContainer = document.createElement('div');
        eyeIconSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                                        class="lucide lucide-eye preview-icon">
                                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                                        <circle cx="12" cy="12" r="3"/>
                                        </svg>`;
        const viewOnlyTxt = document.createElement('span');
        viewOnlyTxt.textContent = "View only";

        viewOnlyDiv.classList.add('view-only-div');
        viewOnlyTxt.classList.add('view-only-span');

        viewOnlyDiv.append(eyeIconSvgContainer, viewOnlyTxt);
        allBtnsDiv.append(backBtn, viewOnlyDiv);
        noteOwnerDateDiv.append(noteOwner, metadataSeparator, date);
        initialsDiv.append(initalsSpan);
        noteMetaDataDiv.append(initialsDiv, noteOwnerDateDiv, metadataSeparatorTwo, noteCourseDiv);
        backBtn.prepend(backArrowSvgContainer);
        noteDetailContainer.append(allBtnsDiv, noteTitle, noteMetaDataDiv, noteContent);
        courseContainer.append(noteDetailContainer);
    }
}

function renderNoteEditView(noteData, noteDetailContainer) {
    let hasAttemptedSave = false;

    noteDetailContainer.replaceChildren();

    const topLvlDiv = document.createElement('div');

    const editingNoteDiv = document.createElement('div');
    const editIconSvgContainer = document.createElement('div');
    const editTxtSpan = document.createElement('span');

    editTxtSpan.textContent = "Editing note";
    editIconSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" 
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                                    stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil" 
                                    style="color: var(--primary);"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z">
                                    </path><path d="m15 5 4 4"></path></svg>`;

    const btnOptionsDiv = document.createElement('div');
    const cancelBtn = document.createElement('button');
    const saveChangesBtn = document.createElement('button');

    cancelBtn.textContent = "Cancel";
    saveChangesBtn.textContent = "Save Changes";

    const editTitleDiv = document.createElement('div');
    const editTitleInput = document.createElement('input');
    const editTitleLabel = document.createElement('label');
    editTitleLabel.textContent = "Title";
    editTitleInput.value = noteData.title;
    editTitleInput.placeholder = "Note title...";

    const editTitleError = document.createElement('p');
    editTitleError.textContent = "Title needed";
    editTitleError.classList.add('edit-input-error', 'field-error', 'hidden');

    const editContentError = document.createElement('p');
    editContentError.textContent = "Content needed";
    editContentError.classList.add('field-error', 'hidden');


    const editContentDiv = document.createElement('div');
    const editContentLabel = document.createElement('label');
    const editContentTxtArea = document.createElement('textarea');
    editContentLabel.textContent = "Content";
    editContentTxtArea.value = noteData.content;
    editContentTxtArea.placeholder = "Start editing your note...";

    editingNoteDiv.classList.add('editing-note-div');
    btnOptionsDiv.classList.add('btn-options-div');
    topLvlDiv.classList.add('top-lvl-div');
    editIconSvgContainer.classList.add('edit-icon-svg');
    cancelBtn.classList.add('cancel-btn');
    saveChangesBtn.classList.add('save-btn');
    editTitleInput.classList.add('edit-input-bar');
    editContentDiv.classList.add('edit-content-div');
    editContentLabel.classList.add('edit-label');
    editTitleLabel.classList.add('edit-label');
    editContentTxtArea.classList.add('edit-txt-area');
    editTitleDiv.classList.add('edit-title-div');

    cancelBtn.addEventListener('click', () => {
        renderNoteDetailView(noteData);
    })

    editTitleInput.addEventListener('input', () => {
        const validated = validateNoteData(editTitleInput.value, editContentTxtArea.value);

        if (hasAttemptedSave) {
            if (!validated.titleHasError) {
                editTitleError.classList.add('hidden');
                editTitleInput.classList.remove('has-error', 'input-error');
            } else {
                editTitleError.classList.remove('hidden');
                editTitleInput.classList.add('has-error', 'input-error');
            }
        }
    })


    editContentTxtArea.addEventListener('input', () => {
        const validated = validateNoteData(editTitleInput.value, editContentTxtArea.value);

        if(hasAttemptedSave) {
            if (validated.contentHasError) {
                editContentError.classList.remove('hidden');
                editContentTxtArea.classList.add('has-error', 'content-error');
            } else {
                editContentError.classList.add('hidden');
                editContentTxtArea.classList.remove('has-error', 'content-error');
            }
        }
    })

    saveChangesBtn.addEventListener('click', async () => {
        hasAttemptedSave = true;

        const validated = validateNoteData(editTitleInput.value, editContentTxtArea.value);

        if (validated.titleHasError) {
            editTitleError.classList.remove('hidden');
            editTitleInput.classList.add('has-error', 'input-error');
        }

        if (validated.contentHasError) {
            editContentError.classList.remove('hidden');
            editContentTxtArea.classList.add('has-error', 'content-error');
        }

        if (validated.titleHasError || validated.contentHasError) {
            return;
        }

        const editNoteData = {
            title: editTitleInput.value,
            content: editContentTxtArea.value
        }

        const result = await updateNote(courseId, editNoteData, noteData.id);

        if (result) {
            const currUrlParams = new URLSearchParams(window.location.search);
            currUrlParams.delete('noteId');

            const currUrl = baseCourseUrl + '?' + currUrlParams.toString();
            history.replaceState(null, '', currUrl);

            renderRoute(courseId);
            showToast("Note saved successfully");
        }

        })

        editTitleDiv.append(editTitleLabel, editTitleInput);
        editingNoteDiv.append(editIconSvgContainer, editTxtSpan);
        btnOptionsDiv.append(cancelBtn, saveChangesBtn);

        topLvlDiv.append(editingNoteDiv, btnOptionsDiv);
        editContentDiv.append(editContentLabel, editContentTxtArea, editContentError);
        editTitleDiv.append(editTitleLabel, editTitleInput, editTitleError);

        noteDetailContainer.append(topLvlDiv, editTitleDiv, editContentDiv);

        editTitleInput.focus();
}


function resetDeleteBtn(deleteDiv, deleteLabel, deleteConfirmLabel, delSvgContainer, yesBtn, noBtn) {
    noBtn.style.display = 'none';
    yesBtn.style.display = 'none';
    deleteDiv.classList.remove('clicked');
    deleteLabel.style.display = '';
    deleteConfirmLabel.style.display = 'none';
    delSvgContainer.style.display = '';
}

async function renderBreadCrumb(courses, courseId) {
    const currCourse = document.createElement('p');
   
    for (const course of courses) {
        if (course.id === courseId) {
            currCourse.textContent = course.name;
        }
    }

    currCourse.classList.add('current-course');

    currSiteLocation.append(currCourse);
}


function renderSideBarCourses(courses) {
    // clear ul container
    ulContainer.replaceChildren();

    if (courses.length === 0) {
        const emptyMsgSidebarDiv = document.createElement('div');

        emptyMsgSidebarDiv.textContent = "You have no courses yet..."
        emptyMsgSidebarDiv.classList.add('empty-sidebar');
        ulContainer.appendChild(emptyMsgSidebarDiv);
        
    } else {
        const fieldName = "courseId";

        for (const course of courses) {
            const url = new URL(baseCourseUrl, window.location.origin);
            const courseLi = document.createElement('li');
            courseLi.classList.add('course');


            const courseATag = document.createElement('a');
            const fieldValue = course.id;
            url.searchParams.set(fieldName, fieldValue);

            courseATag.href = url.toString();

            const courseName = document.createElement('span');
            courseName.classList.add('sidebar-course-name');
            courseName.textContent = course.name;

            courseATag.appendChild(courseName);

            courseLi.appendChild(courseATag);
            ulContainer.appendChild(courseLi);
        }

        dropdownMenu.appendChild(ulContainer);

        const sideBarCourses = document.querySelectorAll('li.course');

    }
}

function renderFilteredNotes(searchString, courseNotes, noteList,  notesTotal, noteSectionTitle) {
    noteList.replaceChildren();

    const filteredNotes = courseNotes.filter((note) => {
        return note.title.toLowerCase().includes(searchString);
    })

    if (courseNotes.length === 0) {
        // no notes yet
        const emptyState = createNotesEmptyState(
            "No notes yet",
            "Be the first to share a note with your classmates"
        );
        noteList.append(emptyState);
    }else if (filteredNotes.length === 0) {
        // no notes match search
        const emptyState = createNotesEmptyState(
            "No notes match your search",
            "Try a different search or clear your search to see all notes."
        );

        noteList.append(emptyState);
    } else {
        // render searched notes

        filteredNotes.forEach(note => {
            const noteElement = addNote(note);

            noteList.append(noteElement);
        })
    }

    if (searchString === "") {
        noteSectionTitle.textContent = "All notes";
    } else {
        noteSectionTitle.textContent = "Results";
    }
    notesTotal.textContent = filteredNotes.length;
}

function createNotesEmptyState(mainMessage, secondaryMessage) {
    const emptySearchNotesDiv = document.createElement('div');
    const noteSvgContainer = document.createElement('div');
    const mainMsg = document.createElement('p');
    const secondaryMsg = document.createElement('p');
    
    emptySearchNotesDiv.classList.add('empty-search-notes');
    mainMsg.classList.add('main-msg-empty-notes');
    secondaryMsg.classList.add('second-msg-empty-notes');
    noteSvgContainer.classList.add('empty-note-svg');
    
    noteSvgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" 
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" 
                                stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text" 
                                style="color: var(--primary);"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z">
                                </path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>
                                </svg>`;
    mainMsg.textContent = mainMessage;
    secondaryMsg.textContent = secondaryMessage;
    
    emptySearchNotesDiv.append(noteSvgContainer, mainMsg, secondaryMsg)
    return emptySearchNotesDiv;
}

async function renderUser() {

    const userResult = await fetchCurrentUser();
    if(!userResult.success) {
        return;
    }

    const user = userResult.data;

    const usernamePara = document.createElement('p');
    const userEmailPara = document.createElement('p');

    usernamePara.textContent = user.firstName + " " + user.lastName;
    usernamePara.classList.add("username");

    userEmailPara.textContent = user.email;
    userEmailPara.classList.add("user-email")
    
    userDiv.appendChild(usernamePara);
    userDiv.appendChild(userEmailPara);

    userIconName.textContent = user.firstName + " " + user.lastName[0] + ".";
    userInitials.textContent = user.firstName[0].toUpperCase() + user.lastName[0].toUpperCase();

}

async function renderRoute(courseId) {
    // read current URL
    const currUrlParams = new URLSearchParams(window.location.search);
    const currNoteId = currUrlParams.get('noteId');
    let currNote = null;

    if (currNoteId !== null) {
        const notesResult = await loadNotes(courseId);
        if (!notesResult.success) {
            return;
        }
        const notes = notesResult.data;
        currNote = notes.find(note => note.id === Number(currNoteId));
    }

    if (currNote) {
        renderNoteDetailView(currNote);
    } else {
        courseContainer.replaceChildren();
        renderCourseView(courseId)
    }
}

function validateNoteData(title, content) {
    let titleHasError = false;
    let contentHasError = false;

    if (title.trim() === "") {
        // do something
        titleHasError = true;
    }

    if (content.trim() === "") {
        // do something
        contentHasError = true;
    }

    return {
        titleHasError, 
        contentHasError
    };
}


// event listeners 
userBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdownModal.classList.toggle('show');

    if (userBtn.classList.contains('white-bg')) {
        userBtn.classList.remove('white-bg');
        userBtn.classList.remove('shadow');
        profileArrow.classList.remove('rotate');
    } else {
        userBtn.classList.add('white-bg');
        userBtn.classList.add('shadow');
        profileArrow.classList.add('rotate');
    }
});

window.addEventListener('click', () => {
    if (dropdownModal.classList.contains('show')) {
        dropdownModal.classList.remove('show')
    }
    
    if (userBtn.classList.contains('white-bg')) {
        userBtn.classList.remove('white-bg');
        userBtn.classList.remove('shadow');
        profileArrow.classList.remove('rotate');
    }
});

sidebarDropdownBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('open');
    sidebarArrow.classList.toggle('rotate');
})

window.addEventListener('popstate', () => {
   renderRoute(courseId);
})


// initial page setup / function calls
initializeApp();