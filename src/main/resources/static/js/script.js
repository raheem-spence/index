import { fetchCurrentUser } from "./api/users.js";
import { fetchCourses, joinCourse, createCourse } from "./api/courses.js";
import { getCourseInitials, showToast } from "./utilities.js";
import { logoutUser } from "./api/auth.js";

// wait until the browser is done parsing all html elements before running scripts,
// preventing 'null' errors when looking up DOM ids like buttons and inputs
document.addEventListener('DOMContentLoaded', () => {
    // check if a previous page left a toast
    const pendingToast = sessionStorage.getItem('pendingToast');
    if (pendingToast) {
        setTimeout(() => {
            showToast(pendingToast);
        }, 175)

        sessionStorage.removeItem('pendingToast');
    }
    
    setUpSidebarToggle();
    initializePopover();
    injectGlobalModals();

    initializeLogoutModal();
    initializeFeedbackModal();

    loadSidebarCourses();
    setUpCoursesAccordion();
    loadCurrentUser();
});

function injectGlobalModals() {
    // if already injected dont duplicate
    if (document.getElementById('logout-modal')) return;

    const modalsHtml = `
    <!-- 1. logout confirmation dialog -->
    <dialog id="logout-modal" class="modal-dialog">
      <div class="modal-content">
        <h3 class="modal-title">Log out of Index?</h3>
        <p class="modal-description">You will need to sign back in to access your courses and notes.</p>
        
        <div class="modal-actions">
          <button type="button" id="logout-cancel-btn" class="modal-btn modal-btn-secondary">Cancel</button>
          <button type="button" id="logout-confirm-btn" class="modal-btn modal-btn-primary">Log out</button>
        </div>
      </div>
    </dialog>

    <!-- 2. send feedback dialog -->
    <dialog id="feedback-modal" class="modal-dialog">
      <div class="modal-content">
        <h3 class="modal-title">Send feedback</h3>
        <p class="modal-description">What's working? What's confusing? Any bugs or ideas?</p>
        
        <form id="feedback-form">
          <textarea
            id="feedback-text"
            class="modal-textarea"
            rows="6"
            placeholder="What's on your mind?..."
            required
          ></textarea>
          
          <div class="modal-actions">
            <button type="button" id="feedback-cancel-btn" class="modal-btn modal-btn-secondary">Cancel</button>
            <button type="submit" id="feedback-submit-btn" class="modal-btn modal-btn-primary">Send</button>
          </div>
        </form>
      </div>
    </dialog>
    `;

    // insert the html right before the body tag closes
    document.body.insertAdjacentHTML('beforeend', modalsHtml);
}

function initializePopover() {
    const container = document.querySelector('.sidebar-user');
    const userBtn = document.getElementById('user-menu-btn');
    const popover = document.getElementById('user-popover');

    // if these elements arent on the page, do nothing
    if (!container || !userBtn || !popover) return;

    function openMenu() {
        popover.classList.remove('hidden');
        //  tells screen readers and accessibility tools the menu attached to this button is now open/expanded
        userBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        popover.classList.add('hidden');
        //  tells screen readers and accessibility tools the menu attached to this button is now closed
        userBtn.setAttribute('aria-expanded', 'false');
    }

    userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isClosed = popover.classList.contains('hidden');

        if (isClosed) {
            openMenu();
        } else {
            closeMenu();
        }
    });

    // click outside anywhere, close the popover
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            closeMenu();
        }
    });

    // close the popover on Escape key press and return focus to the trigger button for keyboard users
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !popover.classList.contains('hidden')) {
            closeMenu();
            userBtn.focus();
        }
    });
}


function initializeLogoutModal() {
    const logoutTrigger = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-modal');
    const cancelBtn = document.getElementById('logout-cancel-btn');
    const confirmBtn = document.getElementById('logout-confirm-btn');
    const userPopover = document.getElementById('user-popover');

    if (!logoutTrigger || !logoutModal) return;


    // open dialog
    logoutTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (userPopover) userPopover.classList.add('hidden');
        logoutModal.showModal();
    })

    // close on cancel
    cancelBtn?.addEventListener('click', () => {
        logoutModal.close();
    });

    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.close();
        }
    })

    // confirm logout
    confirmBtn?.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Logging out...';

        try {
            await logoutUser();
            sessionStorage.clear();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout failed:', error);
            showToast("Unable to log out. Please try again.");
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Log out';
        }
    });
}

function initializeFeedbackModal() {
    const feedbackTrigger = document.getElementById('open-feedback-btn');
    const feedbackModal = document.getElementById('feedback-modal');
    const cancelBtn = document.getElementById('feedback-cancel-btn');
    const form = document.getElementById('feedback-form');
    const textarea = document.getElementById('feedback-text');
    const submitBtn = document.getElementById('feedback-submit-btn');
    const userPopover = document.getElementById('user-popover');

    if (!feedbackTrigger || !feedbackModal) return;


    // open feedback dialog
    feedbackTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (userPopover) userPopover.classList.add('hidden');
        feedbackModal.showModal();
        textarea?.focus();
    })

    const closeDialog = () => {
        feedbackModal.close();
        form?.reset();
    }

    cancelBtn?.addEventListener('click', closeDialog);

    // close if backdrop clicked
    feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            closeDialog();
        }
    })

    // form submission
    form?.addEventListener('submit', async (e) => {
        e.preventDefault(); // prevent page reload

        const message = textarea.value.trim();
        if (!message) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/feedback', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ message })
            });
            
            if (!response) throw new Error ('Feedback submission failed');

            closeDialog();
            alert('Thank you for your feedback!');
        } catch (err) {
            console.error(err);
            alert('Could not send feedback. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send';
        }
    });
}


function setUpSidebarToggle() {
    const closeBtn = document.getElementById('sidebar-close-btn');
    const reopenBtn = document.getElementById('sidebar-reopen-btn');

    // check if user previously closed it in this browser
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState === 'true') {
        document.documentElement.classList.add('sidebar-collapsed');
    }

    function toggleSidebar() {
        const isCollapsed = document.documentElement.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed ? 'true' : 'false');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', toggleSidebar);
    }

    if (reopenBtn) {
        reopenBtn.addEventListener('click', toggleSidebar);
    }
}

function renderUserTile(user) {
    if (!user) return;

    const name = document.getElementById('user-name');
    const email = document.getElementById('user-email');
    const avatar = document.getElementById('user-avatar');

    if (!name || !email || !avatar) return;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

    name.textContent = fullName || (user.email ? user.email.split('@')[0] : 'User');
    email.textContent = user.email || '';

    // calculate 1 or 2 letter initials
    const firstInitial = user.firstName ? user.firstName[0] : '';
    const lastInitial = user.lastName ? user.lastName[0] : '';
    const initials = (firstInitial + lastInitial) || (user.email ? user.email.slice(0, 2) : '??');
    avatar.textContent = initials.toUpperCase();
}

export async function loadCurrentUser() {
    // check if user is in session storage
    const cached = sessionStorage.getItem('index_user');
    if (cached) {
        try {
            renderUserTile(JSON.parse(cached));
        } catch (err) {
            console.error('Failed to parse cached user', err);
        }
    }


    const userResult = await fetchCurrentUser();
    if(userResult && userResult.success && userResult.data) {
        // update storage so next page has it
        sessionStorage.setItem('index_user', JSON.stringify(userResult.data));
        renderUserTile(userResult.data);
        return userResult.data;
    }
    return null;
}


// ---------- Sidebar ---------- 
export function renderSideBarCourses(courses)  {
    const baseCourseUrl = `/course-detail.html`;
    // clear ul container
    const ulContainer = document.getElementById('course-list');
    if (!ulContainer) return;
    ulContainer.replaceChildren();

    const dropdownMenu = document.getElementById('dropdown-menu');

    const folderIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
    class="lucide lucide-folder preview-icon"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 
    0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;

    if (courses.length === 0) {
        const emptyMsgSidebarDiv = document.createElement('div');

        emptyMsgSidebarDiv.textContent = "You have no courses yet..."
        emptyMsgSidebarDiv.classList.add('empty-sidebar');
        ulContainer.appendChild(emptyMsgSidebarDiv);
        
    } else {
        const fieldName = "id";

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

        const sideBarCourses = document.querySelectorAll('li.course-li');
        highlightActiveCourse(sideBarCourses);
    }
}

export async function loadSidebarCourses() {
    const coursesResult = await fetchCourses();
    if (!coursesResult.success) {
        return;
    }

    let courses = coursesResult.data;

    renderSideBarCourses(courses);

}

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


function setUpCoursesAccordion() {
    const coursesToggleBtn = document.querySelector('.chevron-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const ulContainer = document.getElementById('course-list');

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
}

export function renderJoinCourseModal(onSuccess) {

    // join course modal
        const joinCourseModal = document.createElement('dialog');
    
        const joinCourseModalContainer = document.createElement('div');
    
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
                const courseName = joinResult.data.courseName;
                showToast(`Joined ${courseName}`);

                // always refresh the sidebar
                await loadSidebarCourses();

                // call the page specific refresh if one was passed in
                if (typeof onSuccess === 'function') {
                    await onSuccess();
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
        joinCourseModalContainer.append(joinCourseModalHeader, joinCourseCodeDiv, joinCourseBtnsContainer);
        joinCourseModal.append(joinCourseModalContainer);
    
        return joinCourseModal;
        
    }

function resetJoinCourseModal(joinCourseInput, joinCourseError) {
    joinCourseInput.value = "";
    joinCourseError.classList.add('hidden');
}


function getJoinCourseError(joinCourseRequest) {
    const code = joinCourseRequest.joinCode?.trim() || "";

    if (!code) return "Enter a join code";
    if (code.length !== 6) return "Join code must be 6 characters";
    return null;
}


export function renderCreateCourseModal(onSuccess) {

    // create course modal
    const createCourseModal = document.createElement('dialog');

    const createCourseModalContainer = document.createElement('div');

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
                const courseName = createResult.data.courseName;
                showToast(`${courseName} created`);

                await loadSidebarCourses();

                if (typeof onSuccess === 'function') {
                    await onSuccess();
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
    createCourseModalContainer.append(createCourseModalHeader, createCourseNameDiv, createCourseSchoolDiv, createCourseBtnsContainer);
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


