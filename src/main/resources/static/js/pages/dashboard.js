import { fetchCourses, createCourse } from "../api/courses.js";
import { fetchCurrentUser } from "../api/users.js";
import { loadDashboardNotes, deleteNote } from "../api/notes.js";
import { formatRelativeTime, formatDate} from "../utilities.js";

// ---------- Configuration ---------- 
const baseCourseUrl = '/course.html';
const baseDashboardUrl = '/dashboard.html';
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const courseId = urlParams.get('courseId');



// ---------- DOM Elements ---------- 
const courseTitle = document.getElementById('course-title');

const noteContainer = document.getElementById("notes-container");

const ulContainer = document.getElementById('course-list');

const userDiv = document.getElementById("user-info");

const dashboardDiv = document.getElementById("dashboard-container");
const dashboardHeader = document.createElement('div');
const dashboardTitleContainer = document.createElement('div');
const dashboardTitle = document.createElement('h1');
const dashboardMessage = document.createElement('p');

const currSiteLocation = document.getElementById('current-site-location');

const dropdownMenu = document.getElementById('dropdown-menu');
const sidebarDropdownBtn = document.getElementById('sidebar-label');
const sidebarArrow = document.getElementById('sidebar-arrow');


const userBtn = document.getElementById('user-icon-btn');
const dropdownModal = document.getElementById('dropdown-modal');
const profileArrow = document.getElementById('profile-arrow');

const userIconName = document.getElementById('user-icon-name');
const userInitials = document.getElementById('initials');

const recentNotes = await loadDashboardNotes();


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


function renderDashboard() {

    dashboardDiv.replaceChildren();

    const btnContainer = document.createElement('div');

    const joinClsBtn = document.createElement('button');
    const createClsBtn = document.createElement('button');

    const coursesSection = document.createElement('section');
    const coursesHeader = document.createElement('div');
    const coursesHeading = document.createElement('h2');
    const allCoursesBtn = document.createElement('button');
    const coursesGrid = document.createElement('div');

    const notesSection = document.createElement('section');
    const recentNotesHeader = document.createElement('div');
    const recentNotesHeading = document.createElement('h2');
    const allNotesBtn = document.createElement('button');

    joinClsBtn.textContent = "# Join course";
    createClsBtn.textContent = "+  Create course";
    coursesHeading.textContent = "My courses";
    recentNotesHeading.textContent = "Recent Notes"

    allCoursesBtn.textContent = "View all →";
    allNotesBtn.textContent = "All notes →";

    btnContainer.append(joinClsBtn, createClsBtn);

    dashboardTitle.classList.add('dashboard-title');
    dashboardMessage.classList.add('dashboard-msg');
    dashboardHeader.classList.add('dashboard-header');
    joinClsBtn.classList.add('join-btn');
    createClsBtn.classList.add('create-cls-btn');
    btnContainer.classList.add('btn-container');
    dashboardTitleContainer.classList.add('dashboard-title-container');

    coursesHeader.classList.add('courses-header');
    recentNotesHeader.classList.add('courses-header');
    recentNotesHeading.classList.add('courses-heading');
    coursesHeading.classList.add('courses-heading');
    allCoursesBtn.classList.add('all-courses-btn');
    allNotesBtn.classList.add('all-courses-btn');
    coursesGrid.classList.add('courses-grid');

    dashboardMessage.textContent = "Here's whats happening across your courses.";

    coursesHeader.append(coursesHeading, allCoursesBtn);
    recentNotesHeader.append(recentNotesHeading, allNotesBtn);
    coursesSection.append(coursesHeader, coursesGrid);

    notesSection.append(recentNotesHeader);

    dashboardTitleContainer.append(dashboardTitle, dashboardMessage);

    dashboardHeader.replaceChildren();

    dashboardHeader.append(dashboardTitleContainer, btnContainer);

    const createCourseModal = renderCreateCourseModal();

    createClsBtn.addEventListener('click', () => {
        createCourseModal.showModal();
        document.body.style.overflow = 'hidden';
    })

    createCourseModal.addEventListener('close', () => {
        document.body.style.overflow = "";
    })

    dashboardDiv.append(dashboardHeader, coursesSection, notesSection, createCourseModal);
    renderDashboardCourses(coursesGrid, coursesSection, courses);
    renderDashboardNotes(notesSection);
}
 


// ---------- Initialization ---------- 

// Show user courses
const courses = await fetchCourses();
renderSideBarCourses(courses);
renderDashboard();



// Show user info
await renderUser();


// ---------- Dashboard ----------
async function renderDashboardCourses(coursesGrid, coursesSection, courses) {

    coursesGrid.replaceChildren();

    if (courses.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = "You have no courses yet...";
    } else {

        for (const course of courses) {
            const courseATag = document.createElement('a');
            const courseCard = document.createElement('article');
            const courseName = document.createElement('h3');
            const courseMetaData = document.createElement('div');
            const courseMembersDiv = document.createElement('div');
            const courseMembers = document.createElement('p');
            const courseNotesDiv = document.createElement('div');
            const courseNotes = document.createElement('p');

            const memberSvgContainer = document.createElement('div');
            const memberSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" 
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" 
                                    stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users" style="color: var(--muted-foreground);"><circle cx="9" cy="7" r="4">
                                    </circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>`;

            const notesSvgContainer = document.createElement('div');
            const notesSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" 
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" 
                                    stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text" 
                                    style="color: var(--muted-foreground);"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4">
                                    </path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>
                                    </svg>`;

            memberSvgContainer.innerHTML = memberSvgString;
            notesSvgContainer.innerHTML = notesSvgString;
            courseATag.href = `${baseCourseUrl}?courseId=${course.id}`;

            courseCard.dataset.id = course.id;

            courseMembers.textContent = course.memberCount + " members";
            courseNotes.textContent = course.noteCount + " notes";

            courseCard.classList.add('course-card');
            courseName.classList.add('course-name');
            courseMetaData.classList.add('course-meta-data');
            courseMembersDiv.classList.add('course-meta-data-div');
            courseNotesDiv.classList.add('course-meta-data-div');
            courseATag.classList.add('course-a-tag');


            courseName.textContent = course.name;

            courseNotesDiv.append(notesSvgContainer, courseNotes);

            courseMembersDiv.append(memberSvgContainer, courseMembers);

            courseMetaData.append(courseMembersDiv, courseNotesDiv);

            courseCard.append(courseName, courseMetaData);
            courseATag.append(courseCard);
            coursesGrid.appendChild(courseATag);
        }
    }
}

function renderCreateCourseModal() {

    // create course modal
    const createCourseModal = document.createElement('dialog');

    const createCourseModalContainer = document.createElement('div');

    // close btn
    const createCourseCloseBtn = document.createElement('button');
    const closeBtnString = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
                            <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;   
    
    createCourseCloseBtn.innerHTML = closeBtnString;
    createCourseCloseBtn.setAttribute('aria-label', 'Close');

    
    // header div
    const layerSvgContainer = document.createElement('div');
    layerSvgContainer.innerHTML =`<svg width="1em" height="1em" viewBox="0 0 24 24" 
                                fill="currentColor" data-d-component="icon" style="color: 
                                rgb(40, 107, 99); font-size: 20px;">
                                <path d="M4.94845 4.68299C5.32822 4.24896 5.87687 4 6.4536 
                                4H17.5461C18.1228 4 18.6714 4.24896 19.0512 4.68299L22.5512 
                                8.68299C23.6827 9.97616 22.7644 12 21.0461 12H2.9536C1.23528 
                                12 0.316926 9.97616 1.44845 8.68299L4.94845 4.68299ZM17.5461 
                                6L6.4536 6L2.9536 10H21.0461L17.5461 6ZM1.99983 15C1.99983
                                 14.4477 2.44755 14 2.99983 14H20.9998C21.5521 14 21.9998 
                                 14.4477 21.9998 15C21.9998 15.5523 21.5521 16 20.9998 
                                 16H2.99983C2.44755 16 1.99983 15.5523 1.99983 15ZM2.99983 
                                 19C2.99983 18.4477 3.44755 18 3.99983 18H19.9998C20.5521 
                                 18 20.9998 18.4477 20.9998 19C20.9998 19.5523 20.5521 20 
                                 19.9998 20H3.99983C3.44755 20 2.99983 19.5523 2.99983 19Z" 
                                 fill="currentColor"></path></svg>`;

    const createCourseModalHeader = document.createElement('div');

    const createCourseTitleMsgDiv = document.createElement('div');
    const createCourseTitle = document.createElement('h1');
    const createCourseMsg = document.createElement('p');

    createCourseTitle.textContent = "Create a course";
    createCourseMsg.textContent = "Bring your classmates' notes together in one place";


    // course name input bar
    const createCourseNameDiv = document.createElement('div');
    const createCourseLabel = document.createElement('label');
    const asterisk = document.createElement('span');
    const createCourseInput = document.createElement('input');
    const createCourseNameError = document.createElement('p');
    const createCourseSecondMsg = document.createElement('p');

    const createCourseSchoolDiv = document.createElement('div');
    const schoolLabel = document.createElement('label');
    const optional = document.createElement('span');
    const schoolInput = document.createElement('input');
    const schoolMsg = document.createElement('p');

    createCourseNameError.textContent = "Please enter a course name";
    createCourseNameError.classList.add('field-error', 'hidden');

    schoolLabel.textContent = "School";
    optional.textContent = "(Optional)";
    schoolInput.placeholder = "e.g. Bates College";
    schoolMsg.textContent = "Help classmates find the right course";

    createCourseNameDiv.classList.add('create-course-name-div');
    createCourseSchoolDiv.classList.add('create-course-school-div');
    optional.classList.add('optional');
    schoolLabel.classList.add('school-label');




    // cancel and create buttons
    const createCourseBtnsContainer = document.createElement('div');
    const createCourseCancelBtn = document.createElement('button');
    const createCourseCreateBtn = document.createElement('button');

    createCourseCancelBtn.textContent = "Cancel";
    createCourseCreateBtn.textContent = "Create course";

    createCourseLabel.textContent = "Course name";
    asterisk.textContent = "*";
    createCourseInput.placeholder = "e.g. Microbiology";
    createCourseSecondMsg.textContent = "Choose a name your classmates will recognize";

    createCourseModal.classList.add('create-course-modal');
    createCourseModalHeader.classList.add('create-course-modal-header');
    createCourseModalContainer.classList.add('create-course-modal-container');
    createCourseCloseBtn.classList.add('create-course-close-btn');
    createCourseTitle.classList.add('create-course-title');
    createCourseMsg.classList.add('create-course-msg');
    createCourseSecondMsg.classList.add('create-course-scd-msg');
    schoolMsg.classList.add('create-course-scd-msg');
    layerSvgContainer.classList.add('layers-svg');
    asterisk.classList.add('asterisk');
    createCourseInput.classList.add('create-course-input');
    createCourseLabel.classList.add('create-course-label');

    schoolInput.classList.add('create-course-input');
    schoolLabel.classList.add('create-course-label');

    createCourseBtnsContainer.classList.add('create-course-btns-container');
    createCourseCancelBtn.classList.add('create-course-cancel-btn');
    createCourseCreateBtn.classList.add('create-course-create-btn');
    

    createCourseCancelBtn.addEventListener('click', () => {
        createCourseModal.close();
    })

    createCourseCloseBtn.addEventListener('click', () => {
        createCourseModal.close();
    })

    createCourseModal.addEventListener('close', () => {
        resetCreateCourseModal(createCourseInput, schoolInput, createCourseNameError, createCourseSecondMsg);
        document.body.style.overflow = "";
    })

    createCourseCreateBtn.addEventListener('click', async () => {
        const courseRequest = {
            courseName: createCourseInput.value,
            school: schoolInput.value
        }

        const courseNameHasError = hasCreateCourseError(courseRequest);

        if (courseNameHasError) {
            createCourseNameError.classList.remove('hidden');
            createCourseSecondMsg.classList.add('hidden');
        } else {
            const newCourse = await createCourse(courseRequest);
            createCourseModal.close();
        }
    })


    createCourseBtnsContainer.append(createCourseCancelBtn, createCourseCreateBtn);
    createCourseLabel.append(asterisk);
    createCourseTitleMsgDiv.append(createCourseTitle, createCourseMsg);
    createCourseModalHeader.append(layerSvgContainer, createCourseTitleMsgDiv);
    createCourseNameDiv.append(createCourseLabel, createCourseInput, createCourseSecondMsg, createCourseNameError);
    schoolLabel.append(optional);
    createCourseSchoolDiv.append(schoolLabel, schoolInput, schoolMsg);
    createCourseModalContainer.append(createCourseCloseBtn, createCourseModalHeader, createCourseNameDiv, createCourseSchoolDiv, createCourseBtnsContainer);
    createCourseModal.append(createCourseModalContainer);

    return createCourseModal;
}

function resetCreateCourseModal(createCourseInput, schoolInput, createCourseNameError, createCourseSecondMsg) {
    // empty input fields
    createCourseInput.value = "";
    schoolInput.value = "";

    // restore classes
    createCourseNameError.classList.add('hidden');
    createCourseSecondMsg.classList.remove('hidden');
}

function renderDashboardNotes(notesSection) {

    const noteList = document.createElement('ul');

    for (const note of recentNotes) {
        const noteItem = document.createElement('li');
        noteItem.dataset.id = note.id;
        const noteDiv = document.createElement('div');
        const noteOwnerClsDiv = document.createElement('div');
        const noteOwnerDiv = document.createElement('div');
        const noteTimeDiv = document.createElement('div');
        const noteTime = document.createElement('p');


        const noteTitle = document.createElement('p');
        const noteCourseDiv = document.createElement('div');
        const noteOwner = document.createElement('p');
        const noteCls = document.createElement('p');
        const noteOwnerInitials = document.createElement('div');
        const initials = document.createElement('span');

        const clockSvgContainer = document.createElement('div');
        const clockSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" 
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" 
                                stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock">
                                <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                                </svg>`;


        noteDiv.classList.add('note-div');
        noteTitle.classList.add('note-title');
        noteOwner.classList.add('note-owner');
        noteTime.classList.add('note-time');
        noteTimeDiv.classList.add('note-time-div');
        noteOwnerClsDiv.classList.add('note-owner-cls-div');
        noteCls.classList.add('note-course-name');
        noteCourseDiv.classList.add('note-course-div');
        noteList.classList.add('note-list');
        noteOwnerInitials.classList.add('note-initials-div');
        initials.classList.add('note-initials');
        noteOwnerDiv.classList.add('note-owner-div');

        noteTitle.textContent = note.title;
        noteOwner.textContent = note.ownerFirstName + " " +  note.ownerLastName;
        noteCls.textContent = `[${note.courseName}]`;
        noteTime.textContent =  formatRelativeTime(note.updatedAt);
        initials.textContent = note.ownerFirstName[0].toUpperCase() + note.ownerLastName[0].toUpperCase();

        clockSvgContainer.innerHTML = clockSvgString;


        noteOwnerInitials.append(initials);
        noteOwnerDiv.append(noteOwnerInitials, noteOwner);
        noteCourseDiv.append(noteCls, noteOwnerDiv);
        noteOwnerClsDiv.append(noteTitle, noteCourseDiv);
        noteTimeDiv.append(clockSvgContainer, noteTime);
        noteDiv.append(noteOwnerClsDiv, noteTimeDiv);
        noteItem.append(noteDiv);
        noteList.append(noteItem);
    }

    noteList.addEventListener('click', (event) => {
        
        const noteLi = event.target.closest('li');
        
        const clickedNoteId = parseInt(noteLi.dataset.id);
        const note = recentNotes.find(note => note.id === clickedNoteId);

        if (note) {
            urlParams.set('noteId', note.id);
            const newQueryString = urlParams.toString();
            const newUrl = baseDashboardUrl + '?' + newQueryString;
            history.pushState(null, '', newUrl);
            renderRecentNoteDetailView(note);
        }

    })
    
    notesSection.append(noteList);
}

// ---------- Sidebar ---------- 
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
        highlightActiveCourse(sideBarCourses);
    }
}

// Render username and email 
async function renderUser() {

    const user = await fetchCurrentUser();

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

    dashboardTitle.textContent = "Welcome back, " + user.firstName + ".";
 
}

// ---------- Rendering ---------- 

function highlightActiveCourse(sideBarCourses) {
    const currentHref = window.location.href
    sideBarCourses.forEach(course => {
        const currentCourse = course.querySelector("a");
        const href = currentCourse.getAttribute("href");

        if(href == currentHref){
                course.classList.add("active");
        }
    });
}

// function updateHeading(currentCourse) {
//     courseTitle.textContent = currentCourse.textContent + " Notes";
// }

async function refreshNotes(courseId) {
    const notes = await loadNotes(courseId);
    renderNotes(notes);
}

function clearInputs() {
    newTitleInput.value = "";
    newTextAreaInput.value = "";
}


function validateInputs(title, content) {
    // Validate title and content
    if (title.length == 0) {
        return false;
    } else if (content.length == 0) {
        return false;
    }

    return true;
}


async function handleCreate(title, content, courseId) {
    const noteData = {title: title, content: content}

    await createNote(courseId, noteData);
    await refreshNotes(courseId);

    clearInputs();
}

async function handleUpdate(title, content, courseId, noteId) {
    const noteData = {title: title, content: content}

    const canUpdate = await updateNote(courseId, noteData, noteId);

    if (!canUpdate) {
        console.log("You do not have permission to edit this note.");
        clearInputs();
        createNoteBtn.textContent = "Create Note";
        currentlyEditingNoteId = null;
    } else {
        await refreshNotes(courseId);
        clearInputs();
        createNoteBtn.textContent = "Create Note";
        currentlyEditingNoteId = null;
    }
}
