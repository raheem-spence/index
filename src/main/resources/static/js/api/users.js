import { handleAuth } from "./auth.js";

export async function fetchCurrentUser() {
    try {
        const response = await fetch('/users/me', {
            method: 'GET',
            credentials: 'include'
        });

        const result = handleAuth(response);

        if (!result) {
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`)
        }

        const user = await response.json();
        return user;
    } catch (error) {
        console.log('Fetch failed:', error);
    }
}