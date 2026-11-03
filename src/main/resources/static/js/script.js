import { fetchCurrentUser } from "./api/users.js";
import { fetchCourses } from "./api/courses.js";
import { getCourseInitials } from "./utilities.js";

// wait until the browser is done parsing all html elements before running scripts,
// preventing 'null' errors when looking up DOM ids like buttons and inputs
document.addEventListener('DOMContentLoaded', () => {
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
    const logoutBtn = document.getElementById('logout-btn');

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

        try {
            if (typeof logout === 'function') {
                await logout();
            }
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            window.location.href = '/login.html';
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
    const baseCourseUrl = `/course.html`;
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

