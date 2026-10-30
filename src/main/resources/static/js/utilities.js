export function formatRelativeTime(updatedAt) {
    if (!updatedAt) return "";

    // convert updatedAt string into a Date
    const updatedDate = new Date(updatedAt);
    
    if (isNaN(updatedDate.getTime())) return "";

    const now = new Date();

    const diff = now - updatedDate;

    // constanst in milliseconds
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;

    if (diff < minute) {
        return "Just now"
    } else if (diff < hour) {
        return `${Math.floor(diff / minute)}m ago`;
    } else if (diff < day) {
        return `${Math.floor(diff / hour)}h ago`;
    } else if (diff < 2 * day) {
        return "Yesterday";
    } else if (diff < week) {
        return `${Math.floor(diff / day)}d ago`;
    } else {
        const isCurrentYear = updatedDate.getFullYear() === now.getFullYear();
        return updatedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            ...(isCurrentYear ? {} : { year: 'numeric'}),
        });
    }
}

export function formatDate(dateData) {
    const date = new Date(dateData);

    const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }
    return date.toLocaleDateString('en-US', options);
}


export function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

export async function showToast(textContent) {
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
    
    toastTxt.textContent = textContent;
    await delay(300);
    toast.classList.remove('hidden');
    await delay(3000);
    toast.classList.add('hidden');
}

const STOP_WORDS = new Set(["to", "of", "and", "in", "intro", "introduction"]);

export function getCourseInitials(courseName) {
    const words = courseName
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(w => /[a-zA-Z]/.test(w))

    const significant = words.filter(w => !STOP_WORDS.has(w.toLowerCase()));

    const [first, second] = significant;
    if (first && second) return (first.charAt(0) + second.charAt(0)).toUpperCase();

    const letters = (first || "").replace(/[^a-zA-Z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    return null;
}

export function formatJoinCode(rawCode) {
    return rawCode ? `${rawCode.slice(0, 3)}-${rawCode.slice(3)}` : "";
}

export async function copyToClipboard(copySvgContainer, copySvgString, joinCode) {
    try {
        // copy code to clipboard
        await navigator.clipboard.writeText(joinCode);

        // change the icon
        const checkMarkString = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" 
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
}