import { fetchCourses, createCourse, joinCourse, fetchDashboardCourses } from "../api/courses.js";
import { fetchCurrentUser } from "../api/users.js";
import { loadDashboardNotes, deleteNote } from "../api/notes.js";
import { formatRelativeTime, formatDate, showToast, getCourseInitials, formatJoinCode, copyToClipboard} from "../utilities.js";

// ---------- Configuration ---------- 
const baseCourseUrl = '/course.html';
const baseDashboardUrl = '/dashboard.html';
const baseNoteUrl = '/notes.html';
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const courseId = urlParams.get('courseId');



// ---------- DOM Elements ---------- 
const ulContainer = document.getElementById('course-list');

const userDiv = document.getElementById("user-info");

const dashboardDiv = document.getElementById("dashboard-container");
const dashboardHeader = document.createElement('div');
const dashboardTitleContainer = document.createElement('div');
const dashboardTitle = document.createElement('h1');
const dashboardMessage = document.createElement('p');

const dropdownMenu = document.getElementById('dropdown-menu');
const sidebarDropdownBtn = document.getElementById('sidebar-label');
const sidebarArrow = document.getElementById('sidebar-arrow');

const sidebarNotesBtn = document.getElementById('notes-btn');

const userBtn = document.getElementById('user-icon-btn');
const dropdownModal = document.getElementById('dropdown-modal');
const profileArrow = document.getElementById('profile-arrow');

const userIconName = document.getElementById('user-icon-name');
const userInitials = document.getElementById('initials');

let recentNotes = null;
let dashboardCourses = null;

async function initializeDashboard() {

    const recentNotesResult = await loadDashboardNotes();
    if (!recentNotesResult.success) {
        return;
    }
    recentNotes = recentNotesResult.data;

    const coursesResult = await fetchCourses();
    if (!coursesResult.success) {
        return;
    }
    let courses = coursesResult.data;

    const dashboardCoursesResult = await fetchDashboardCourses();
    if (!dashboardCoursesResult.success) {
        return;
    }
    dashboardCourses = dashboardCoursesResult.data;
    renderSideBarCourses(courses);
    renderDashboard();
}

const coursesToggleBtn = document.querySelector('.chevron-btn');

if (coursesToggleBtn) {
    coursesToggleBtn.addEventListener('click', () => {
        const isOpen = coursesToggleBtn.classList.toggle('open');
        dropdownMenu.classList.toggle('open');
        coursesToggleBtn.setAttribute('aria-expanded', isOpen);

        if (isOpen) {
            ulContainer.scrollTop = 0;
        }
    })
}


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

    const joinSvgContainer = document.createElement('div');
    const joinSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-plus preview-icon">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>`;

    joinSvgContainer.innerHTML = joinSvgString;

    const plusSvgContainer = document.createElement('div');
    const plusSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                        class="lucide lucide-plus h-4 w-4" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path>
                        </svg>`;
    plusSvgContainer.innerHTML = plusSvgString;

    joinClsBtn.textContent = "Join course";
    createClsBtn.textContent = "Create course";
    coursesHeading.textContent = "My courses";
    recentNotesHeading.textContent = "Recent Notes"

    allCoursesBtn.textContent = "View all";
    allNotesBtn.textContent = "View all";

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

    joinClsBtn.prepend(joinSvgContainer);
    createClsBtn.prepend(plusSvgContainer);
    coursesHeader.append(coursesHeading, allCoursesBtn);
    recentNotesHeader.append(recentNotesHeading, allNotesBtn);
    coursesSection.append(coursesHeader, coursesGrid);

    notesSection.append(recentNotesHeader);

    dashboardTitleContainer.append(dashboardTitle, dashboardMessage);

    dashboardHeader.replaceChildren();

    dashboardHeader.append(dashboardTitleContainer, btnContainer);

    const createCourseModal = renderCreateCourseModal();
    const joinCourseModal = renderJoinCourseModal();

    createClsBtn.addEventListener('click', () => {
        createCourseModal.showModal();
        document.body.style.overflow = 'hidden';
    })

    createCourseModal.addEventListener('close', () => {
        document.body.style.overflow = "";
    })

    joinClsBtn.addEventListener('click', () => {
        joinCourseModal.showModal();
        document.body.style.overflow = 'hidden';
    })

    joinCourseModal.addEventListener('close', () => {
        document.body.style.overflow = "";
    })

    dashboardDiv.append(dashboardHeader, coursesSection, notesSection, createCourseModal, joinCourseModal);
    renderDashboardCourses(coursesGrid, dashboardCourses);
    renderDashboardNotes(notesSection);
}


// ---------- Initialization ---------- 

// Show user info
const user = await renderUser();

// ---------- Dashboard ----------
function renderDashboardCourses(coursesGrid, dashboardCourses) {
    const folderIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                                    class="lucide lucide-folder preview-icon"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 
                                    0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;
    const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                        fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
                        class="lucide lucide-copy";"><rect width="14" height="14" x="8" y="8" rx="2" ry="2">
                        </rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                        </svg>`;

    coursesGrid.replaceChildren();
    if (dashboardCourses.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = "You have no courses yet...";
        coursesGrid.appendChild(emptyMsg);
    } else {
     
        for (const course of dashboardCourses) {
        
            const monogram = getCourseInitials(course.name);
            const monogramSpan = document.createElement('span');
            const badgeContent = monogram ? monogram : folderIconSvg;
            monogramSpan.innerHTML = badgeContent;

            const courseATag = document.createElement('a');
            const courseCard = document.createElement('article');
            
            const cardHeader = document.createElement('div');
            const courseNameDiv = document.createElement('div');
            const courseName = document.createElement('p');
            const courseSchool = document.createElement('p');
           
            const courseMetaDataDiv = document.createElement('div');
            const courseCode = document.createElement('button');
            const copyIconDiv = document.createElement('div');
            copyIconDiv.innerHTML = copyIconSvg;
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

            const formattedCode = formatJoinCode(course.joinCode);

            courseCode.textContent = formattedCode;
            courseSchool.textContent = course.school;

            courseMembers.textContent = course.memberCount;
            courseNotes.textContent = course.noteCount;

            copyIconDiv.classList.add('copy-icon-svg');
            courseCode.classList.add('course-code');
            monogramSpan.classList.add('monogram');
            courseSchool.classList.add('school', 'truncate');
            cardHeader.classList.add('card-header');
            courseNameDiv.classList.add('course-name-div');
            courseCard.classList.add('course-card');
            courseName.classList.add('course-name', 'truncate');
            courseMetaData.classList.add('course-meta-data');
            courseMembersDiv.classList.add('course-meta-data-div');
            courseNotesDiv.classList.add('course-meta-data-div');
            courseATag.classList.add('course-a-tag');
            courseMetaDataDiv.classList.add('course-card-footer');


            courseName.textContent = course.name;

            courseCode.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(copyIconDiv, copyIconSvg, formattedCode);
            })

            courseNameDiv.append(courseName, courseSchool);
            cardHeader.append(monogramSpan, courseNameDiv);
            courseNotesDiv.append(notesSvgContainer, courseNotes);

            courseMembersDiv.append(memberSvgContainer, courseMembers);

            courseMetaData.append(courseMembersDiv, courseNotesDiv);
            courseCode.append(copyIconDiv);
            courseMetaDataDiv.append(courseMetaData, courseCode);
            courseCard.append(cardHeader, courseMetaDataDiv);
            courseATag.append(courseCard);
            coursesGrid.appendChild(courseATag);
        }
    }
}

function renderJoinCourseModal() {

// join course modal
    const joinCourseModal = document.createElement('dialog');

    const joinCourseModalContainer = document.createElement('div');

    // close btn
    const joinCourseCloseBtn = document.createElement('button');
    const closeBtnString = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
                            <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;   
    
    joinCourseCloseBtn.innerHTML = closeBtnString;
    joinCourseCloseBtn.setAttribute('aria-label', 'Close');

    const joinCourseModalHeader = document.createElement('div');

    const joinCourseTitleMsgDiv = document.createElement('div');
    const joinCourseTitle = document.createElement('h2');
    const joinCourseMsg = document.createElement('p');

    joinCourseTitle.textContent = "Join course";
    joinCourseMsg.textContent = "Enter the join code shared by a classmate.";


    // course code input bar
    const joinCourseCodeDiv = document.createElement('div');
    const joinCourseLabel = document.createElement('label');
    const joinCourseInput = document.createElement('input');
    const joinCourseError = document.createElement('p');
    

    joinCourseError.textContent = "";
    joinCourseError.classList.add('field-error', 'hidden');

    joinCourseCodeDiv.classList.add('create-course-name-div');

    // cancel and create buttons
    const joinCourseBtnsContainer = document.createElement('div');
    const joinCourseCancelBtn = document.createElement('button');
    const joinCourseJoinBtn = document.createElement('button');

    joinCourseCancelBtn.textContent = "Cancel";
    joinCourseJoinBtn.textContent = "Join course";

    joinCourseLabel.textContent = "Join code";
    joinCourseInput.placeholder = "ABC-123";
    joinCourseInput.autofocus = true;
    joinCourseInput.setAttribute('autocapitalize', 'characters');
    joinCourseModal.classList.add('join-course-modal');
    joinCourseModalHeader.classList.add('create-course-modal-header');
    joinCourseModalContainer.classList.add('create-course-modal-container');
    joinCourseCloseBtn.classList.add('create-course-close-btn');
    joinCourseTitle.classList.add('create-course-title');
    joinCourseMsg.classList.add('create-course-msg');
    joinCourseInput.classList.add('join-course-input');
    joinCourseLabel.classList.add('create-course-label');

    joinCourseBtnsContainer.classList.add('create-course-btns-container');
    joinCourseCancelBtn.classList.add('create-course-cancel-btn');
    joinCourseJoinBtn.classList.add('create-course-create-btn');

    joinCourseCancelBtn.addEventListener('click', () => {
        joinCourseModal.close();
    })

    joinCourseCloseBtn.addEventListener('click', () => {
        joinCourseModal.close();
    })

    joinCourseModal.addEventListener('close', () => {
        resetJoinCourseModal(joinCourseInput, joinCourseError);
        document.body.style.overflow = "";
    })

    joinCourseModal.addEventListener('click', (e) => {
        // get the exact coordinates and size of the modal box
        const rect = joinCourseModal.getBoundingClientRect();

        // check if the click coordinates were outside those boundaries
        const clickedOutside = 
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY > rect.bottom ||
        e.clientY < rect.top;

        if (clickedOutside) {
            joinCourseModal.close();
        }
    });

    joinCourseInput.addEventListener('input', () => {
        joinCourseError.classList.add('hidden');
    })

    joinCourseJoinBtn.addEventListener('click', async () => {
        const rawInput = joinCourseInput.value;
        const cleanedCode = rawInput.replace(/[-\s]/g, "").toUpperCase();

        const joinCourseRequest = {
            joinCode: cleanedCode
        }

        const error = getJoinCourseError(joinCourseRequest);

        if (error) {
            joinCourseError.textContent = error;
            joinCourseError.classList.remove('hidden');
            return;
        }
        
        const joinResult = await joinCourse(joinCourseRequest);
        
        if (joinResult.success) {
            const dashboardCoursesResult = await fetchDashboardCourses();
            const coursesResult = await fetchCourses();
            const courseName = joinResult.data.courseName;

            if (dashboardCoursesResult.success) {
                dashboardCourses = dashboardCoursesResult.data;
                showToast(`Joined ${courseName}`);
                renderDashboard();
            } else {
                showToast("Course joined! Refresh to see it.");
                console.error("Join course succeeded, but dashboard refresh failed");
            } 

            if (coursesResult.success) {
                renderSideBarCourses(coursesResult.data);
            } else {
                showToast("Course joined! Refresh to update sidebar.");
                console.error("Join course succeeded, but sidebar refresh failed");
            }

            joinCourseModal.close();
        } else {

            if (joinResult.status === 400) {
                // show the message for existing course member
                joinCourseError.textContent = "You're already in this course";
            } else if (joinResult.status === 404) {
                // show message for course not found
                joinCourseError.textContent = "No course found with this code";

            } else if (joinResult.status === 500) {
                // show generic failure message
                joinCourseError.textContent = "Could not join course. Try again";
            } else {
                // show generic failure message
                joinCourseError.textContent = "Unable to join course";
            }
            
            joinCourseError.classList.remove('hidden');
            
        }
        
    });


    joinCourseBtnsContainer.append(joinCourseCancelBtn, joinCourseJoinBtn);
    joinCourseTitleMsgDiv.append(joinCourseTitle, joinCourseMsg);
    joinCourseModalHeader.append(joinCourseTitleMsgDiv);
    joinCourseCodeDiv.append(joinCourseLabel, joinCourseInput, joinCourseError);
    joinCourseModalContainer.append(joinCourseCloseBtn, joinCourseModalHeader, joinCourseCodeDiv, joinCourseBtnsContainer);
    joinCourseModal.append(joinCourseModalContainer);

    return joinCourseModal;
    
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


    const createCourseModalHeader = document.createElement('div');

    const createCourseTitleMsgDiv = document.createElement('div');
    const createCourseTitle = document.createElement('h1');
    const createCourseMsg = document.createElement('p');

    createCourseTitle.textContent = "Create a course";
    createCourseMsg.textContent = "Bring your classmates' notes together in one place.";


    // course name input bar
    const createCourseNameDiv = document.createElement('div');
    const createCourseLabel = document.createElement('label');
    const asterisk = document.createElement('span');
    const createCourseInput = document.createElement('input');
    const createCourseError = document.createElement('p');

    const createCourseSchoolDiv = document.createElement('div');
    const schoolLabel = document.createElement('label');
    const optional = document.createElement('span');
    const schoolInput = document.createElement('input');

    createCourseInput.autofocus = true;

    createCourseError.textContent = "";
    createCourseError.classList.add('field-error', 'hidden');


    schoolLabel.textContent = "School name";
    optional.textContent = "(optional)";
    schoolInput.placeholder = "e.g. Bates College";

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

    createCourseModal.classList.add('create-course-modal');
    createCourseModalHeader.classList.add('create-course-modal-header');
    createCourseModalContainer.classList.add('create-course-modal-container');
    createCourseCloseBtn.classList.add('create-course-close-btn');
    createCourseTitle.classList.add('create-course-title');
    createCourseMsg.classList.add('create-course-msg');
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
        resetCreateCourseModal(createCourseInput, schoolInput, createCourseError);
        document.body.style.overflow = "";
    })

    createCourseInput.addEventListener('input', () => {
        createCourseError.classList.add('hidden');
    })

    createCourseModal.addEventListener('click', (e) => {
        // get the coordinates and size of the modal
        const rect = createCourseModal.getBoundingClientRect();

        // check if click coordinates were outside those boundaries
        const clickedOutside = 
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY > rect.bottom ||
        e.clientY < rect.top;

        if (clickedOutside) {
            createCourseModal.close();
        }
    });

    createCourseCreateBtn.addEventListener('click', async () => {
        const courseRequest = {
            courseName: createCourseInput.value.trim(),
            school: schoolInput.value.trim()
        };

        const error = getCreateCourseError(courseRequest);

        if (error) {
            createCourseError.textContent = error;
            createCourseError.classList.remove('hidden');
            return;

        } else {
            const createResult = await createCourse(courseRequest);

            if (createResult.success) {
                const dashboardCoursesResult = await fetchDashboardCourses();
                const coursesResult = await fetchCourses();
                const courseName = createResult.data.courseName;

                if (dashboardCoursesResult.success) {
                    dashboardCourses = dashboardCoursesResult.data;
                    showToast(`${courseName} created`);
                    renderDashboard();
                } else {
                    showToast("Course created! Refresh to see it.");
                    console.error("Coures creation succeeded, but dashboard refresh failed");
                }

                if (coursesResult.success) {
                    renderSideBarCourses(coursesResult.data);
                } else {
                    showToast("Course created! Refresh to update sidebar.");
                    console.error("Course creation succeeded, but sidebar refresh failed");
                }
               
                createCourseModal.close();
            } else {
                createCourseError.textContent = "Could not create course. Try again"
                createCourseError.classList.remove('hidden');
                console.error("Something went wrong on our end. Please try again later.");
            }

        }
    })


    createCourseBtnsContainer.append(createCourseCancelBtn, createCourseCreateBtn);
    createCourseLabel.append(asterisk);
    createCourseTitleMsgDiv.append(createCourseTitle, createCourseMsg);
    createCourseModalHeader.append(createCourseTitleMsgDiv);
    createCourseNameDiv.append(createCourseLabel, createCourseInput, createCourseError);
    schoolLabel.append(optional);
    createCourseSchoolDiv.append(schoolLabel, schoolInput);
    createCourseModalContainer.append(createCourseCloseBtn, createCourseModalHeader, createCourseNameDiv, createCourseSchoolDiv, createCourseBtnsContainer);
    createCourseModal.append(createCourseModalContainer);

    return createCourseModal;
}

function resetCreateCourseModal(createCourseInput, schoolInput, createCourseError) {
    // empty input fields
    createCourseInput.value = "";
    schoolInput.value = "";

    // restore classes
    createCourseError.classList.add('hidden');
}

function resetJoinCourseModal(joinCourseInput, joinCourseError) {
    joinCourseInput.value = "";

    joinCourseError.classList.add('hidden');
}

function renderDashboardNotes(notesSection) {

    const noteList = document.createElement('ul');

    for (const note of recentNotes) {
        const noteItem = document.createElement('li');
        noteItem.dataset.id = note.id;
        const noteDiv = document.createElement('div');
        const noteOwnerClsDiv = document.createElement('div');
        const noteTime = document.createElement('span');

        const noteTitle = document.createElement('span');
        const noteCourseDiv = document.createElement('div');
        const noteOwner = document.createElement('span');
        const noteCls = document.createElement('span');

        noteDiv.classList.add('note-div');
        noteTitle.classList.add('note-title', 'truncate');
        noteOwner.classList.add('note-owner');
        noteTime.classList.add('note-time');
        noteOwnerClsDiv.classList.add('note-owner-cls-div');
        noteCls.classList.add('note-course-name');
        noteCourseDiv.classList.add('note-course-div');
        noteList.classList.add('note-list');

        noteTitle.textContent = note.title;
        noteOwner.textContent = note.ownerFirstName + " " +  note.ownerLastName;
        noteCls.textContent = `${note.courseName}`;
        noteTime.textContent =  formatRelativeTime(note.updatedAt);

        noteCourseDiv.append(noteCls, noteOwner);
        noteOwnerClsDiv.append(noteTitle, noteCourseDiv);
        noteDiv.append(noteOwnerClsDiv, noteTime);
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

async function renderRecentNoteDetailView(noteData) {
    dashboardDiv.replaceChildren();

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
        const newUrl = baseDashboardUrl;
        history.pushState(null, '', newUrl);

        renderDashboard();
    })

    const noteCourseDiv = document.createElement('div');
    const noteCourseATag = document.createElement('a');

    const metadataSeparator = document.createElement('p');
    metadataSeparator.textContent = "·";

    const metadataSeparatorTwo = document.createElement('p');
    metadataSeparatorTwo.textContent = "·";

    noteCourseATag.textContent = noteData.courseName;
    noteCourseATag.href = `${baseCourseUrl}?courseId=${noteData.courseId}`;

    noteCourseATag.classList.add('note-course-a-tag');
    noteCourseDiv.classList.add('note-course-div');

    noteCourseDiv.append(noteCourseATag);

    const noteTitle = document.createElement('h1');
    const noteContent = document.createElement('p');

    const noteMetaDataDiv = document.createElement('div');
    const date = document.createElement('p');
    const initialsDiv = document.createElement('div');
    const initalsSpan = document.createElement('span');

    const noteOwnerDateDiv = document.createElement('div');
    const noteOwner = document.createElement('p');

    backBtn.textContent = "Back to Dashboard";

    initalsSpan.textContent = noteData.ownerFirstName[0].toUpperCase() + noteData.ownerLastName[0].toUpperCase();
    noteTitle.textContent = noteData.title;
    noteContent.textContent = noteData.content;
    noteOwner.textContent = noteData.ownerFirstName + " " + noteData.ownerLastName;

    backBtn.classList.add('back-btn');
    noteTitle.classList.add('note-view-title');
    noteContent.classList.add('note-view-content');
    noteMetaDataDiv.classList.add('note-meta-data-div');
    noteOwner.classList.add('note-view-owner');
    initialsDiv.classList.add('initials-div');
    initalsSpan.classList.add('initials-span');
    date.classList.add('note-view-date');
    noteOwnerDateDiv.classList.add('note-owner-date-div');

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
    
                // renderRoute(courseId);
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
        dashboardDiv.append(noteDetailContainer);
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
        allBtnsDiv.classList.add('all-btns-div');

        viewOnlyDiv.append(eyeIconSvgContainer, viewOnlyTxt);
        allBtnsDiv.append(backBtn, viewOnlyDiv);
        noteOwnerDateDiv.append(noteOwner, metadataSeparator, date);
        initialsDiv.append(initalsSpan);
        noteMetaDataDiv.append(initialsDiv, noteOwnerDateDiv, metadataSeparatorTwo, noteCourseDiv);
        backBtn.prepend(backArrowSvgContainer);
        noteDetailContainer.append(allBtnsDiv, noteTitle, noteMetaDataDiv, noteContent);
        dashboardDiv.append(noteDetailContainer);
    }
}

function getCreateCourseError(courseRequest) {
    const name = courseRequest.courseName?.trim() || "";

    if (!name) {
        return "Course name is required";
    }

    if (name.length < 2) {
        return "Course name must be at least two characters";
    }

    if (!/[A-Za-z]/.test(name)) {
        return "Course name must include letters";
    }

    if (name.length > 80) {
        return "Course name must be 80 characters or less";
    }

    return null;
}

function getJoinCourseError(joinCourseRequest) {
    const code = joinCourseRequest.joinCode?.trim() || "";

    if (!code) return "Enter a join code";
    if (code.length !== 6) return "Join code must be 6 characters";
    return null;
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
            courseLi.classList.add('course-li');


            const courseATag = document.createElement('a');
            const fieldValue = course.id;
            url.searchParams.set(fieldName, fieldValue);

            courseATag.href = url.toString();

            const monogram = getCourseInitials(course.name);
            const monogramSpan = document.createElement('span');
            const badgeContent = monogram ? monogram : folderIconSvg;
            monogramSpan.innerHTML = badgeContent;
            monogramSpan.classList.add('monogram-sidebar');

            const courseName = document.createElement('span');
            courseName.classList.add('sidebar-course-name', 'truncate');
            courseName.textContent = course.name;

            courseATag.append(monogramSpan, courseName);

            courseLi.append(courseATag);
            ulContainer.appendChild(courseLi);
        }

        dropdownMenu.appendChild(ulContainer);

        const sideBarCourses = document.querySelectorAll('li.course');
        highlightActiveCourse(sideBarCourses);
    }
}


// function navigateToAllNotes() {
//     sidebarNotesBtn.addEventListener('click', () => {
//         window.location.href = "/notes.html";
//     });
// }
  

// Render username and email 
async function renderUser() {

    const userResult = await fetchCurrentUser();
    if(!userResult.success) {
        return;
    }
    const user = userResult.data;
    return user;
}

function dashboardMessages(dashboardTitle, dashboardMessage) {
    const now = new Date();
    const hour = now.getHours();

    dashboardMessage.textContent = "Here's what's new in your courses.";

    const name = (user && user.firstName) ? `, ${user.firstName}` : "";

    if (5 <= hour  && hour < 12) {
        dashboardTitle.textContent = `Good morning${name}`;
    } else if (12 <= hour &&  hour < 17) {
        dashboardTitle.textContent = `Good afternoon${name}`;
    } else if (17 <= hour && hour < 23) {
        dashboardTitle.textContent = `Good evening${name}`;
    } else {
        dashboardTitle.textContent = `Welcome back${name}`;
        dashboardMessage.textContent = "Quiet hours. Here's what's new across your courses.";
    }

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

function setUpSidebarToggle() {
    const closeBtn = document.getElementById('sidebar-close-btn');
    const reopenBtn = document.getElementById('sidebar-reopen-btn');

    // check if user previously closed it in this browser
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState === 'true') {
        document.body.classList.add('sidebar-collapsed');
    }

    function toggleSidebar() {
        const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed ? 'true' : 'false');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', toggleSidebar);
    }

    if (reopenBtn) {
        reopenBtn.addEventListener('click', toggleSidebar);
    }
}

initializeDashboard();
// navigateToAllNotes();
dashboardMessages(dashboardTitle, dashboardMessage);
setUpSidebarToggle();