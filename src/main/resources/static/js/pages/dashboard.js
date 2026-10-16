import { fetchCourses } from "../api/courses.js";
import { fetchCurrentUser } from "../api/users.js";
import { loadDashboardNotes, loadNotes, createNote, updateNote } from "../api/notes.js";
import { formatRelativeTime } from "../utilities.js";

// ---------- Configuration ---------- 
const baseCourseUrl = 'http://127.0.0.1:5500/html/course.html';
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const courseId = urlParams.get('courseId');



// ---------- DOM Elements ---------- 
const courseTitle = document.getElementById('course-title');

const noteContainer = document.getElementById("notes-container");

const ulContainer = document.getElementById('course-list');

const createNoteBtn = document.getElementById("create-note-btn");

const newTitleInput = document.getElementById("note-title-input");

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

    dashboardHeader.append(dashboardTitleContainer, btnContainer);

    dashboardDiv.append(dashboardHeader, coursesSection, notesSection);
    renderDashboardCourses(coursesGrid, coursesSection, courses);
    renderDashboardNotes(notesSection);
}
 

// ---------- App State ---------- 

let currentlyEditingNoteId = null;



// ---------- Initialization ---------- 

// Show user courses
const courses = await fetchCourses();
console.log(courses);
renderSideBarCourses(courses);
renderDashboard();


// // Show user notes
// await refreshNotes(courseId);

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
            courseATag.href = `course.html?courseId=${course.id}`;

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

async function renderDashboardNotes(notesSection) {
    const recentNotes = await loadDashboardNotes();

    const noteList = document.createElement('ul');

    for (const note of recentNotes) {
        const noteItem = document.createElement('li');
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
            const url = new URL(baseCourseUrl);
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





        // const currentCourseName = document.querySelector('.course.active');
        // updateHeading(currentCourseName);
    }
}

// Render username and email 
async function renderUser() {

    const user = await fetchCurrentUser();
    console.log(user);

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


// ---------- Notes CRUD ---------- 

// // CREATE NOTE
// // get create note button id
// const newTextAreaInput = document.getElementById("note-content-input");

// createNoteBtn.addEventListener('click', async () => {
//     // read the value property of title input
//     const noteTitle = newTitleInput.value.trim();

//     // read the value property of textarea
//     const noteContent = newTextAreaInput.value.trim();
  
//     const isValid = validateInputs(noteTitle, noteContent);

//     if (!isValid) {
//         alert("Invalid input");
//         return
//     }
  
//     if (currentlyEditingNoteId === null) {
//         await handleCreate(noteTitle, noteContent, courseId);
//     } else {
//         await handleUpdate(noteTitle, noteContent, courseId, currentlyEditingNoteId);
//     }

// })

// // READ NOTES
// function renderNotes(notes){
    
//     // clear notes container
//     noteContainer.replaceChildren();

//     if (notes.length === 0){
//         const emptyNotesMessage = document.createElement('h4');
//         emptyNotesMessage.textContent = "Notes you add appear here"
//         emptyNotesMessage.classList.add('empty-note-msg');

//         noteContainer.appendChild(emptyNotesMessage);

//         return
//     } else {

//         for (const noteData of notes) {

//             const noteCard = document.createElement('article');

//             const noteId = noteData.id;
//             noteCard.dataset.id = noteId;

//             const newTitle = document.createElement('h4');
//             newTitle.textContent = noteData.title;

          
//             const newElapsedTime = document.createElement('p');
//             newElapsedTime.textContent = noteData.createdAt;
//             newElapsedTime.classList.add("time-elapsed");

        
//             const newContent= document.createElement('p');
//             newContent.textContent = noteData.content;
//             newContent.classList.add("note-content");

//             // create div for edit/delete buttons
//             const btnsDiv = document.createElement('div');

//             // edit and delete buttons
//             const editBtn = document.createElement('button');
//             editBtn.classList.add("edit-btn");
        

//             const delBtn = document.createElement('button');
//             delBtn.classList.add("del-btn");

//             const svgNS = "http://www.w3.org/2000/svg"

//             // edit svg 
//             const svgEditBtnContainer = document.createElementNS(svgNS, 'svg');

//             const editPathElement = document.createElementNS(svgNS, 'path');

//             svgEditBtnContainer.setAttribute("viewBox", "0 0 24 24");
//             svgEditBtnContainer.setAttribute("fill", "none");
//             svgEditBtnContainer.setAttribute("stroke-width", "1.5")
//             svgEditBtnContainer.setAttribute("stroke", "currentColor");
//             svgEditBtnContainer.setAttribute("class", "size-6");

//             editPathElement.setAttribute("stroke-linecap", "round");
//             editPathElement.setAttribute("stroke-linejoin", "round");
//             editPathElement.setAttribute("d", "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10");

//             const editSpan = document.createElement('span');
//             editSpan.textContent = "Edit";

//             svgEditBtnContainer.appendChild(editPathElement);

//             editBtn.append(svgEditBtnContainer, editSpan);



//             // delete svg
//             const svgDelBtnContainer = document.createElementNS(svgNS, 'svg');

//             const delPathElement = document.createElementNS(svgNS, 'path');

//             svgDelBtnContainer.setAttribute("viewBox", "0 0 24 24");
//             svgDelBtnContainer.setAttribute("fill", "none");
//             svgDelBtnContainer.setAttribute("stroke-width", "1.5")
//             svgDelBtnContainer.setAttribute("stroke", "currentColor");
//             svgDelBtnContainer.setAttribute("class", "size-6");

//             delPathElement.setAttribute("stroke-linecap", "round");
//             delPathElement.setAttribute("stroke-linejoin", "round");
//             delPathElement.setAttribute("d", "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0");

//             const delSpan = document.createElement('span');
//             delSpan.textContent = "Delete";

//             svgDelBtnContainer.appendChild(delPathElement);

//             delBtn.append(svgDelBtnContainer, delSpan);

//             btnsDiv.classList.add("edit-delete");

//             btnsDiv.append(editBtn, delBtn);

//             noteCard.classList.add("note-card")

//             // append inner elements to article element
//             noteCard.append(newTitle, newElapsedTime, newContent, btnsDiv);

//             noteContainer.append(noteCard);
//         }
//     }
// }


// // DELETE & EDIT NOTE
// noteContainer.addEventListener('click', async (event) => {

//     // find the closet button from target
//     const btnItem = event.target.closest('button');

//     if(!btnItem) {
//         return
//     }
     
//     // find the closest note card from button
//     const closestNoteCard = btnItem.closest('.note-card');
//     const noteCardId = closestNoteCard.dataset.id;

//     // if edit button clicked
//     if(btnItem.classList.contains('edit-btn')) {

//         currentlyEditingNoteId = noteCardId;
        
//         // fill form with old title/content
//         const origTitle = closestNoteCard.querySelector('h4');
//         const origContentPara = closestNoteCard.querySelector('p.note-content');

//         newTitleInput.value = origTitle.textContent;
//         newTextAreaInput.value = origContentPara.textContent;

//         // change btn text to 'Update Note'
//         createNoteBtn.textContent = "Update Note";

//         // if delete button clicked
//         } else if (btnItem.classList.contains('del-btn')) {

//             try {
//                 const response = await fetch(`http://127.0.0.1:8080/courses/${courseId}/notes/${noteCardId}`, {
//                     method: 'DELETE',
//                     credentials: 'include'
//                 });

//                 if (response.status === 403) {
//                     console.log('You do not have permission to delete this note.')
//                 } else if (!response.ok) {
//                     throw new Error(`HTTP Error! Status: ${response.status}`)
//                 } else {
//                 await refreshNotes(courseId);
//                 }

//             } catch (error) {
//                 console.log(error);
//             }
//         }
// })

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
