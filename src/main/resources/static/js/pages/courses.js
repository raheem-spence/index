import { fetchCourses } from "../api/courses.js";
import { formatJoinCode, getCourseInitials, copyToClipboard } from "../utilities.js";
import { renderCreateCourseModal, renderJoinCourseModal } from "../script.js";

const baseCoursesUrl = '/courses.html';
const baseCourseUrl = '/course.html';
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const courseId = urlParams.get('courseId');

const coursesGrid = document.getElementById('courses-grid');
const coursesCount = document.getElementById('courses-count');
let allCourses = [];

function initializeCoursesPage() {

    const searchInput = document.getElementById('course-search');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        // if the search bar is empty, show all courses
        if(!query) {
    
            renderCourses(allCourses);
            return;
        }

        // filter by course name
        const filtered = allCourses.filter((course) => {
            const nameMatch = course.name?.toLowerCase().includes(query);
            return nameMatch;
        });

        if (filtered.length === 0){
            renderNoSearchQuery(e.target.value.trim());
            return;
        }

        renderCourses(filtered, query)
    })





    const joinBtn = document.getElementById('join-btn');
    const createCourseBtn = document.getElementById('create-cls-btn');

    joinBtn.addEventListener('click', () => {
        const modal = renderJoinCourseModal( async () => {
            await loadCourses();
        })
        document.body.append(modal);
        modal.showModal();
    })

    createCourseBtn.addEventListener('click', () => {
        const modal = renderCreateCourseModal( async () => {
            await loadCourses();
        })
        document.body.append(modal);
        modal.showModal();
    })

    loadCourses();

}

async function loadCourses() {
    const response = await fetchCourses();

    if (!response || !response.success || !response.data || response.data.length === 0) {
        allCourses = [];
        renderEmptyState();
    } else {
        allCourses = response.data;
        renderCourses(allCourses);
    }
}

function createCourseCard(course) {
    const monogram = getCourseInitials(course.name);
    const monogramSpan = document.createElement('span');
    const folderIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
    class="lucide lucide-folder preview-icon"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 
    0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;

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
    const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
    class="lucide lucide-copy";"><rect width="14" height="14" x="8" y="8" rx="2" ry="2">
    </rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
    </svg>`;
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

    return courseATag;
}

function renderCourses(courses) {
    coursesGrid.replaceChildren();

    if (coursesCount) {
        coursesCount.textContent = `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`;
    }

    for (const course of courses) {
        const courseCard = createCourseCard(course);
        coursesGrid.append(courseCard);
    }
}

function renderNoSearchQuery(query) {
    if (coursesCount) {
        coursesCount.textContent = "0 courses";
    }
    
    coursesGrid.replaceChildren();

    const noResults = document.createElement('div');
    noResults.classList.add('no-results-state');

    const title = document.createElement('p');
    title.classList.add('no-results-title');
    title.textContent = `No courses matching "${query}"`;

    noResults.append(title);
    coursesGrid.append(noResults);
}

initializeCoursesPage();