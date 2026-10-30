import { handleAuth } from "./auth.js";

export async function fetchCurrentUser() {
    try {
        const response = await fetch('/users/me', {
            method: 'GET',
            credentials: 'include'
        });

        const result = handleAuth(response);

        if (!result) {
            return {
                success: false,
                status: 401
            }
        }

        if (!response.ok) {
            return {
                success: false,
                status: response.status
            }
        }

        const user = await response.json();
        return {
            success: true,
            data: user
        }
    } catch (error) {
        console.log('Fetch failed:', error);
        return {
            success: false,
            status: null
        }
    }
}