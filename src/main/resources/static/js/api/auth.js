// reroute the user to login page because session expired
export function handleAuth(response) {
    if (response.status === 401) {
        window.location.href = "login.html";
        return false;
    } else {
        return true;
    }
}