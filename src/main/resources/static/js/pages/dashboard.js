import { fetchDashboardCourses } from "../api/courses.js";
import { loadDashboardNotes, } from "../api/notes.js";
import { formatRelativeTime,  getCourseInitials, formatJoinCode, copyToClipboard} from "../utilities.js";
import { loadCurrentUser, renderJoinCourseModal, renderCreateCourseModal} from "../script.js";

// ---------- Configuration ---------- 
const baseCourseUrl = '/course-detail.html';

// ---------- DOM Elements ---------- 
const dashboardHeader = document.getElementById('dashboard-header');
const dashboardTitle = document.getElementById('dashboard-title');
const dashboardMessage = document.getElementById('dashboard-msg');
const createClsBtn = document.getElementById('create-cls-btn');
const joinBtn = document.getElementById('join-btn');
const dashboardContent = document.getElementById('dashboard-content');

let recentNotes = null;
let dashboardCourses = null;

async function initializeDashboard() {

    if (createClsBtn) {
        createClsBtn.addEventListener('click', () => {
            const modal = renderCreateCourseModal( async () => {
                const response = await fetchDashboardCourses();

                if (response.success) {
                    dashboardCourses = response.data;
                    renderDashboard();
                }
            });
            document.body.append(modal);
            modal.showModal();
            document.body.style.overflow = 'hidden';
        });
    }

    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            const modal = renderJoinCourseModal( async () => {
                const response = await fetchDashboardCourses();

                if (response.success) {
                    dashboardCourses = response.data;
                    renderDashboard();
                }
            });
            document.body.append(modal);
            modal.showModal();
            document.body.style.overflow = 'hidden';
        });
    }
    // Show user info
    const user = await loadCurrentUser();
    dashboardMessages(user, dashboardTitle, dashboardMessage);

    const recentNotesResult = await loadDashboardNotes();
    if (!recentNotesResult.success) {
        return;
    }
    recentNotes = recentNotesResult.data;

    const dashboardCoursesResult = await fetchDashboardCourses();
    if (!dashboardCoursesResult.success) {
        return;
    }
    dashboardCourses = dashboardCoursesResult.data;

    renderDashboard();
}

function renderDashboard() {
    dashboardHeader.classList.remove('hidden');

    dashboardContent.replaceChildren();

    // courses section
    const coursesSection = document.createElement('section');
    const coursesHeader = document.createElement('div');
    const coursesHeading = document.createElement('h2');
    const allCoursesBtn = document.createElement('button');
    const coursesGrid = document.createElement('div');

    coursesHeading.textContent = "My courses";
    allCoursesBtn.textContent = "View all";

    coursesHeader.classList.add('courses-header');
    coursesHeading.classList.add('courses-heading');
    allCoursesBtn.classList.add('all-courses-btn');
    coursesGrid.classList.add('courses-grid');

    allCoursesBtn.addEventListener('click', () => {
        window.location.href = '/courses.html';
    })

    coursesHeader.append(coursesHeading, allCoursesBtn);
    coursesSection.append(coursesHeader, coursesGrid);

    // notes section
    const notesSection = document.createElement('section');
    const recentNotesHeader = document.createElement('div');
    const recentNotesHeading = document.createElement('h2');
    const allNotesBtn = document.createElement('button');

    recentNotesHeading.textContent = "Recent Notes"
    allNotesBtn.textContent = "View all";

    recentNotesHeader.classList.add('courses-header');
    recentNotesHeading.classList.add('courses-heading');
    allNotesBtn.classList.add('all-courses-btn');

    allNotesBtn.addEventListener('click', () => {
        window.location.href = '/notes.html';
    });
   
    recentNotesHeader.append(recentNotesHeading, allNotesBtn);
    notesSection.append(recentNotesHeader);

    dashboardContent.append(coursesSection, notesSection);

    renderDashboardCourses(coursesGrid, dashboardCourses);
    renderDashboardNotes(notesSection);
}


// ---------- Initialization ---------- 

// ---------- Dashboard ----------
function renderDashboardCourses(coursesGrid, dashboardCourses) {
    const folderIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                                    class="lucide lucide-folder preview-icon"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 
                                    0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;
    const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                        fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
                        class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2">
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
            courseATag.href = `${baseCourseUrl}?id=${course.id}&from=dashboard`;

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

function renderDashboardNotes(notesSection) {

    const noteList = document.createElement('ul');

    for (const note of recentNotes) {
        const noteItem = document.createElement('li');
        noteItem.dataset.id = note.id;
        const noteATag = document.createElement('a');
        noteATag.href = `/note-detail.html?id=${note.id}&from=dashboard`;

        const noteOwnerClsDiv = document.createElement('div');
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
        noteList.classList.add('note-list');

        noteTitle.textContent = note.title;
        noteOwner.textContent = note.ownerFirstName + " " +  note.ownerLastName;
        noteCls.textContent = `${note.courseName}`;
        noteTime.textContent =  formatRelativeTime(note.updatedAt);

        noteCourseDiv.append(noteCls, noteOwner);
        noteOwnerClsDiv.append(noteTitle, noteCourseDiv);
        noteATag.append(noteOwnerClsDiv, noteTime);
        noteItem.append(noteATag);
        noteList.append(noteItem);
    }
    
    notesSection.append(noteList);
}


function dashboardMessages(user, dashboardTitle, dashboardMessage) {
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

initializeDashboard();
