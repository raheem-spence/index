// reroute the user to login page because session expired
export function handleAuth(response) {
    if (response.status === 401) {
        window.location.href = "login.html";
        return false;
    } else {
        return true;
    }
}

// add logout fetch
export async function logoutUser() {
    const response = await fetch(`/auth/logout`, {
        method: "POST",
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}`);
    }

    return response;
}