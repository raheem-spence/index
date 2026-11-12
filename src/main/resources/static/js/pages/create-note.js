import { fetchCourses } from "../api/courses.js";
import { createNote } from "../api/notes.js";
import { showToast } from "../utilities.js";

// tracks whether the user is intentionally navigating away after a successful publish
let isSubmitting = false;
let isLeaving = false;

// =======================================================
// Page Initialization
// =======================================================
// DOMContentLoaded fires the exact millisecond all HTML tags are parsed and ready in memory
// preventing crashes when JS looks for an element
document.addEventListener('DOMContentLoaded', () => {
    initializeCreateNotePage();
});

function initializeCreateNotePage() {
    const backLink = document.getElementById('back-link');
    const cancelBtn = document.getElementById('cancel-note-btn');
    const preselectedCourseId = getPreselectedCourseId();

    // if student is coming from a course page to create a note
    if (preselectedCourseId && backLink) {
        backLink.href = `course-detail.html?id=${preselectedCourseId}`;
        if (cancelBtn) cancelBtn.href = `course-detail.html?id=${preselectedCourseId}`;
    }



    const contentTextarea = document.getElementById('note-content');
    setUpAutoGrowTextarea(contentTextarea);

    setUpNavigationGuards(backLink, cancelBtn);

    setUpBrowserUnloadGuard();

    setUpCourseDropdown(preselectedCourseId);

    setUpFormSubmit();

    setUpAttachments();
}

// =======================================================
// Textarea Auto-Grow
// =======================================================
function setUpAutoGrowTextarea(textarea) {
    if (!textarea) return;

    // input event fires every time a character is typed, pasted, or deleted
    textarea.addEventListener('input', () => {
        // auto lets the browser calculate the true shrinkable height
        textarea.style.height = 'auto';

        // scrollHeight is a read-only browser property that measures the entire scrollable height
        // of the text content inside, including the text hidden below
        textarea.style.height = `${textarea.scrollHeight}px`;
    })
}

// =======================================================
// URL Helpers
// =======================================================
function getPreselectedCourseId() {
    // window.location.search is built-in browser property that gives you the query string starting at the ? and  
    // including the question mark in the URL e.g. "?courseId=15"
    // returns an empty string when there is no query parameters

    // new URLSearchParams pareses the query strings so you dont have to write messy regex or split on certain characters
    // URLSearchParams is a constructor and always returns a valid object even if you pass it an empty string

    // params.get('courseId') looks for the courseId=... and returns its value as a string ("15"), null if no courseId 
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// =======================================================
// Unsaved Changes & Navigation Guards
// =======================================================
function confirmDiscardIfDirty() {
    const title = document.getElementById('note-title-input')?.value.trim();
    const content = document.getElementById('note-content')?.value.trim();
    
    // if both fields are empty allow navigation with zero friction
    if (!title && !content && stagedFiles.length === 0) {
        isLeaving = true;
        return true;
    }

    const confirmed =  window.confirm('You have unsaved changes. Discard this note and leave?');

    if (confirmed) {
        // user said yes to discard message and set flag to true so beforeunload doesnt ask again
        isLeaving = true;
        return true;
    }

    // user chose 'Cancel' so stay on page
    return false;
}

function setUpNavigationGuards(backLink, cancelBtn) {
    function handleExit(e) {
        if (!confirmDiscardIfDirty()) {
            e.preventDefault(); // stay on page if user clicks cancel on prompt
        }
    }

    if (backLink) backLink.addEventListener('click', handleExit);
    if (cancelBtn) cancelBtn.addEventListener('click', handleExit);
}

function setUpBrowserUnloadGuard() {
    // beforeunload is a special browser event that fires when the user is trying to destroy the page
    // like closing the browser tab, hitting the browswr back button, typing a new URL and hitting enter, refreshing the page
    window.addEventListener('beforeunload', (e) => {
        if (isSubmitting || isLeaving) return; // allow clean exit when note was successfully published

        const title = document.getElementById('note-title-input')?.value.trim();
        const content = document.getElementById('note-content')?.value.trim();

        if (title || content || stagedFiles.length > 0) {
            // standard W3C way to cancel page unload/navigation
            // Modern Firefox and Safari follow the modern w#C standard and will show the
            // dialog from e.preventDefault() alone
            e.preventDefault();

            // Chromium engines fallback (Chrome, Edge, Brave): setting returnValue triggers
            // the browser's native hardcoded "Leave site? Changes may note be saved" dialog
            // they historically required e.returnValue to be set to a truthy value or ''
            // to activate prompt
            e.returnValue = ''; 
        }
    });
}

// =======================================================
// Course Picker
// =======================================================
async function setUpCourseDropdown(preselectedId) {
    const trigger = document.getElementById('course-filter-trigger');
    const menu = document.getElementById('course-filter-menu');
    const label = document.getElementById('selected-course-label');
    const hiddenInput = document.getElementById('selected-course-id');

    // gaurd clause: f any element is missing form the page, exit immediately
    if (!trigger || !menu || !label || !hiddenInput) return;

    // toggle menu open/close
    trigger.addEventListener('click', (e) => {
        // when you click trigger, the event bubbles up through the DOM tree all the way up
        // to document
        // becuase we have a "close menu on click outside" listener on document, without
        // e.stopPropagation the menu would open then close immediately
        e.stopPropagation();
        menu.classList.toggle('hidden')
        const isNowOpen= !menu.classList.contains('hidden');
        trigger.setAttribute('aria-expanded', String(isNowOpen));
    });

    // close menu on click outside
    document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus(); // return focus to trigger for screen readers
        }
    });

    // wheel event fires every time you flick your scroll wheel or trackpad
    // even when the page has no scrollbar
    document.addEventListener('wheel', (e) => {
        // if wheel movement inside dropdown list, allow them to scroll
        if (menu.contains(e.target)) return; 

        if (!menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            trigger.setAttribute('aria-expanded', 'false');
        }
    }, { capture: true, passive: true }); // tells the browser this listener wont block scrolling

    // helper to set selected course
    function selectCourse(courseId, courseName) {
        hiddenInput.value = courseId;
        label.textContent = courseName;

        // update active highlight on option btns
        menu.querySelectorAll('.filter-option').forEach(btn => {
            const isMatch = btn.dataset.courseId === String(courseId);
            btn.classList.toggle('active', isMatch);
        });

        menu.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
    }

        // handle clicks inside the menu
        menu.addEventListener('click', (e) => {
            const optionBtn = e.target.closest('.filter-option');
            if (!optionBtn) return;
            selectCourse(optionBtn.dataset.courseId, optionBtn.textContent.trim());
        });

        // fetch courses and build the buttons
        loadCoursesIntoMenu(menu, preselectedId, selectCourse);
}

// =======================================================
// Laod Courses API & DOM Builder
// =======================================================
async function loadCoursesIntoMenu(menu, preselectedId, selectCourse) {
    // initial loading state: give visual feedback while network fetch runs
    menu.innerHTML = `<div class="filter-option-state">Loading courses...</div`;

    try {
        const coursesResult = await fetchCourses();

        // empty state if student hasn't joined any courses yet
        if (!coursesResult || coursesResult.data.length === 0) {
            menu.innerHTML = `<div class="filter-option-state">No courses joined yet.</div>`;
            return;
        }

        menu.innerHTML= '';

        coursesResult.data.forEach(course => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-option';
            btn.setAttribute('role', 'option');
            btn.dataset.courseId = String(course.id);
            btn.textContent = course.name;

            menu.appendChild(btn);

            // autoselect if URL has courseId already
            if (preselectedId && String(course.id) === String(preselectedId)) {
                selectCourse(course.id, btn.textContent);
            }
        });
    } catch (error) {
        console.error('Failed to load courses for note creation:', error);
        menu.innerHTML = `<div class="filter-option-state error">Failed to load courses.</div>`;
    }
}

// =======================================================
// Form Submit & API Call
// =======================================================
function setUpFormSubmit() {
    const form = document.getElementById('create-note-form');
    const submitBtn = document.getElementById('publish-note-btn');
    const hiddenCourseInput = document.getElementById('selected-course-id');
    const titleInput = document.getElementById('note-title');
    const contentTextarea = document.getElementById('note-content');

    if (!form || !submitBtn) return;

    form.addEventListener('submit', async (e) => {
        // prevent default browser submission which would cause a full page reload
        e.preventDefault(); 

        // get values and trim whitespace at beginning and end
        const courseId = hiddenCourseInput.value;
        const title = titleInput.value.trim();
        const content = contentTextarea.value.trim();

        // validation guards: check course first then text fields
        if (!courseId) {
            alert('Please select a course before publishing your note.');
            // automatically open dropdown for them
            document.getElementById('course-filter-trigger')?.click();
            return;
        }

        if (!title) {
            alert('Please enter a note title');
            titleInput.focus();
            return;
        }

        if (!content) {
            alert('Please enter note content');
            contentTextarea.focus();
            return;
        }

        // loading state and double-click protection (idempotency)
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Publishing...';

        try {
            const newNote = await createNote(courseId, {title, content});

            if (!newNote) {
                alert('Could not publish note. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                return;
            }

            isSubmitting = true;
            
            // store pending toast for the destination page
            sessionStorage.setItem('pendingToast', 'Note created');

            // navitigae to all notes page or maybe note detail (later) on success
            window.location.href = 'notes.html';

        } catch (error) {
            console.error('Unexpected error publishing note:', error);
            alert('An unexpected error occurred. Please try agian.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    document.addEventListener('keydown', (e) => {
        // e.metaKey is the command key
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            // .requestSubmit() acts like a user clickig the submit button, triggering the listener 
            // and validation properly
            // .submit() bypasses event listener and HTML5 validation attributes (required)
            form.requestSubmit();
        }
    });
}


// =======================================================
// File Attachments State & Dropzone
// =======================================================
// In memory array storing File objects waiting to be uploaded with note
let stagedFiles = [];

// constants matching backend validation limits
const MAX_FILE_SIZE_BTYES = 25 * 1024 * 1024; // 25 MB in bytes
const MAX_FILES = 5;

// MIME (Multipurpose Internet Mail Extension) types are the univeral internet standards for file types
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp'
];

function setUpAttachments() {
    const fileInput = document.getElementById('note-file-input');
    const dropzone = document.getElementById('dropzone');

    if (!fileInput || !dropzone) return;

    // Native click / file picker
    // note: a form control is any HTML element designed to collect user input inside a form:
    // - <input> (text, checkbox, radio, file, number, date)
    // - <textarea>
    // - <select>
    // each control has a value, here <input type="file"> value is a string representation of the
    // selected file path (browsers mask it)
    // change event fires when a form's control value has been modified and finalized by the user
    // e.g. on text input when you type something then click outside
    // e.g. on file input it fires when the OS file picker closes
    fileInput.addEventListener('change', (e) => {
        // remember e.target is the element that triggered the event so the input type="file" element
        // file inputs have a special property called .files
        // note: it does not give you the file path on the hard drive
        // browsers block that for privacy and security so websites can't spy on user's folder names
        // however it retunrs a browser data structure containing File objects where each gives you
        // - file.name (e.g. "lecture-notes.pdf")
        // - file.size (in bytes, e.g. 1048676 for 1 MB)
        // - file.type (the MIME type, e.g. "application/pdf")
        // - file.lastModified (timestamp of when it was saved)
        if (e.target.files && e.target.files.length > 0) {
            // e.target.files looks like an array but is not. Its a FileList which is "array-like"
            // it has a .length and you can access items with brackets but it does not have array methods
            // like .forEach(), .map(), .filter(), .some()
            // Array.from() takes an array-like structure and converts it into a real, modern JS array
            // where you can unlock standard array methods
            handleFilesAdded(Array.from(e.target.files));
        }

        // reset input value so re-selecting a file with the same name triggers 'change' again 
        fileInput.value = '';
    });

    // Drag and drop
    // browsers natively open files on drop (e.g.  replacing the tab with a PDF)
    // preventDefault() on both 'dragover' and 'drop' is mandatory to stop that behavior
    // dragover fires continuously (every few ms) as long as the dragged file is hovering inside
    // the dropzone boundaries
    dropzone.addEventListener('dragover', (e) => {
        // by default, browsers reject drops on almost all HTML elements so we need to tell the browser
        // not to reject
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });

    // dragleave fires once the cursor leaves the dropzone area without letting go of the mouse button
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
    })

    // drop fires the instant the user releases the mouse button while inside the dropzone
    dropzone.addEventListener('drop', (e) => {
        // this prevents the browsers default behavior of navigating away form the page 
        // and opening the dropped image or PDF right in the browser tab, destroying whatever note
        // the user was typing
        e.preventDefault();
        dropzone.classList.remove('drag-over');

        // e.dataTranser.files contains the FileList dropped fomr the OS desktop/finder
        // when you drag something in you OS, the OS creates and invisible "clipboard in flight" 
        // called a DataTransfer object
        // the browser exposes that object through e.dataTransfer through drap and drop events
        // when you click the labl and use the OS file dialog: files live on the e.target.files
        // when you drag a file from the desktop or Finder window: files live on the e.dataTransfer.files
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleFilesAdded(Array.from(e.dataTransfer.files));
        }
    });

    // keyboard accessibility for <label tabindex="0">
    dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });
}

function handleFilesAdded(incomingFiles) {
    // .forEach(element, index, array) 
    // the first element is the current item being processed in this loop iteration
    // the second argument is the numeric position of that item in the array starting at 0
    // the third argument is rarely need but is a reference to the entire original array itself
    // JS closures???
    incomingFiles.forEach(file => {

        // validation 1: check max count limit
        if (stagedFiles.length >= MAX_FILES) {
            showToast('Maximum 5 files per note', 'info');
            return;
        }
        // validation 2: size limit (25 MB)
        if (file.size > MAX_FILE_SIZE_BTYES) {
            showToast(`"${file.name}" exceeds the 25 MB limit.`, 'info');
            return;
        }

        // validation 3: file type check
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            showToast(`"${file.name}" is not supported. Use PDF, PNG, or JPEG.`, 'info');
            return;
        }

        // validation 4: duplicate check (matches name, byte size, and last modified timestamp)
        // .some() is an array method that asks "does at least one item in this array meet this condition"
        // it tests each item one by one and the second it finds one math that returns true, it stops checking
        // and returns true.
        // if all items have zero matches, it returns false
        const isDuplicate = stagedFiles.some((existing) => 
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );

        if (isDuplicate) {
            showToast(`"${file.name}" is already attached`, info);
            return;
        }

        // passed all validation checks, stage it
        stagedFiles.push(file);
    });

    renderStagedFiles();
}

function renderStagedFiles() {
    const listElement = document.getElementById('staged-files-list');
    if (!listElement) return;

    listElement.innerHTML = '';

    stagedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'staged-file-item';

        const readableSize = formatFileSize(file.size);

        li.innerHTML = `
            <div class="staged-file-info">
                <span class="staged-file-name truncate" title="${file.name}">${file.name}</span>
                <span class="staged-file-size">${readableSize}</span>
            </div>
            <button type="button" class="remove-file-btn" data-index="${index}" aria-label="Remove ${file.name}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>`;

        // scoped event listener 
        // "scoped" means the listener is attached directly to the specific button created inside this
        // particulr loop iteration for this specific file
        // the whole document isnt searched because the li was created in memory
        const removeBtn = li.querySelector('.remove-file-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent clicking row from doing anything else
            // .splic(startIndex, deleteCount) modifies an array in-place by removing, replacing, or adding items
            stagedFiles.splice(index, 1);
            renderStagedFiles();
        });

        listElement.appendChild(li);
    });
}

// converts bytes to human-readable strings (1024 -> 1 KB)
function formatFileSize(bytes) {
    // .toFixed(digits) formats ta number using fixed-point notation (rounding it to a specific number of decimal places)
    // and converts it to a string
    // computers dont count in clean decimals so dividing bytes can get messy
    // .toFixed(1) rounds te 1 decimal place "1.4 MB"
    // .toFixed(0) rounds to 0 decimal places (whole number) "450 KB"
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
