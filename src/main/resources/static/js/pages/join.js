import { joinCourse } from "../api/courses.js";
import { formatJoinCode } from "../utilities.js";
import { fetchCurrentUser } from "../api/users.js";

document.addEventListener('DOMContentLoaded', () => {
    initializeJoinPage();
});

async function initializeJoinPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawCode = urlParams.get('code');
    const cleanedCode = sanitizeJoinCode(rawCode);

    // query and cache DOM references
    cacheElements();

    if (!cleanedCode) {
        handleInvalidCode();
        return;
    }
    
    const sessionResult = await fetchCurrentUser();

    if (sessionResult.success) {
        handleAuthenticatedJoin(cleanedCode);
        return;
    }

    if (!sessionResult.success) {
        renderSignedOutChoices(cleanedCode);
        return;
    }
}


function handleInvalidCode() {
    // hide spinner
    if (elements.spinnerContainer) elements.spinnerContainer.classList.add('hidden');

    if (elements.heading) elements.heading.textContent = 'Invite link not found';
    if (elements.subhead) elements.subhead.textContent = 'This link is missing a valid code or contains a typo. Check the URL or ask a classmate for a fresh link.'
    if (elements.codeValue) {
        elements.codeValue.textContent = 'Invalid';
        elements.codeValue.classList.add('font-semibold');
    }

    if (elements.homeBtn) elements.homeBtn.classList.remove('hidden');
    if (elements.backLink) elements.backLink.classList.add('hidden');
    if (elements.actions) elements.actions.classList.add('hidden');
}

async function handleAuthenticatedJoin(code) {
    // show spinner
    if (elements.actions) elements.actions.classList.add('hidden');
    if (elements.spinnerContainer) elements.spinnerContainer.classList.remove('hidden');
    if (elements.codeValue) {
        elements.codeValue.classList.add('font-semibold');
        elements.codeValue.textContent = formatJoinCode(code);
    }


    // fetch request
    const result = await joinCourse({joinCode: code});

    // 401 Unauthorized, user not logged in, renderSignedOutChoices
    if (result.status === 401) {
        if (elements.spinnerContainer) elements.spinnerContainer.classList.add('hidden');
        renderSignedOutChoices(code);
        return;
    }

    // 404 Not Found (or 400 Bad Request): code is properly formatted but course doesnt exist --> call handleInvalidCode
    if (result.status === 404 || result.status === 400) {
        if (elements.spinnerContainer) elements.spinnerContainer.classList.add('hidden');
        handleInvalidCode();
        return;
    }

    // 200 OK, redirect user to course 
    if (result.success && result.data) {
        setTimeout(() => {
            window.location.href = `/course-detail.html?id=${result.data.courseId}`;
        }, 1500);
        return;
    }
}

function renderSignedOutChoices(code) {
    // hide spinner
    if (elements.spinnerContainer) elements.spinnerContainer.classList.add('hidden');

    // show invite code
    if (elements.codeValue) elements.codeValue.textContent = formatJoinCode(code);

    // update hrefs of buttons 
    if (elements.createAcctBtn) elements.createAcctBtn.href = `/signup.html?code=${encodeURIComponent(code)}`;
    if (elements.loginBtn) elements.loginBtn.href = `/login.html?code=${encodeURIComponent(code)}`;
}

function sanitizeJoinCode(raw) {
    // check if raw code is a string and not a number, boolean, object, array
    if (typeof raw !== 'string')  return null;

    const trimmed = raw.trim();
    if (!trimmed) return null;
   
    // replace any whitespace (\s), any literal hypens (-) with an empty string
    const cleaned = trimmed.replace(/[\s-]/g, "").toUpperCase();
   
    // check if cleaned code only contains uppercase letters or numbers and no special characters
    const CODE_PATTERN = /^[A-Z0-9]{6}$/
    
    if (!CODE_PATTERN.test(cleaned)) return null;

    return cleaned;
}

const elements = {};

function cacheElements() {
    elements.heading = document.getElementById('join-heading');
    elements.subhead = document.getElementById('join-subhead');
    elements.codeValue = document.getElementById('invite-code');
    elements.actions = document.getElementById('btn-actions');
    elements.backLink = document.getElementById('back-link');
    elements.homeBtn = document.getElementById('home-btn');
    elements.spinnerContainer = document.getElementById('spinner-container');
    elements.createAcctBtn = document.getElementById('create-accnt-a-tag');
    elements.loginBtn = document.getElementById('login-a-tag');
}