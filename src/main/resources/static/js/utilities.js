export function formatRelativeTime(updatedAt) {
    const now = new Date();

    // convert updatedAt string into a Date
    const updatedDate = new Date(updatedAt);

    const diff = now - updatedDate;

    // 1 minute in milliseconds
    const minute = 60000;

    const hour = minute * 60;

    const day = 24 * hour;
 
    const twoDays = 2 * day;

    const week = 7 * day;

    const fourWeeks = 4 * week;

    if (diff < minute) {
        return "Just now"
    } else if (diff < hour) {
        // calculate how many minutes have passed
        const minutes = Math.floor(diff / minute);
        if (minutes === 1) {
            return `${minutes} minute ago`;
        } else {
            return `${minutes} minutes ago`;
        }
    } else if (diff < day) {
        const hours = Math.floor(diff / hour);
        if (hours === 1) {
            return `${hours} hour ago`;
        } else {
            return `${hours} hours ago`;
        }
    } else if (diff < twoDays) {
        return "Yesterday"
    } else if (diff < week) {
        return `${Math.floor(diff / day)} days ago`;
    } else if (diff < fourWeeks) {
        const weeks = Math.floor(diff / week);
        if (weeks === 1) {
            return `${weeks} week ago`;
        } else {
            return `${weeks} weeks ago`;
        }
    } else {
        const options = {
            month: 'short',
            day: 'numeric'
        };
        return `${updatedDate.toLocaleDateString('en-US', options)}`;
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


