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