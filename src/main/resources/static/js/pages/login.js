
// Redirect to classes page
// Select button
const loginBtn = document.getElementById('login-btn');
const createAcctBtn = document.getElementById('create-accnt-btn');
const errorDiv = document.getElementById('error-box');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Check if element exists, meaning we are on that page
if (loginBtn) {
    // Add listener
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.classList.add('hidden');
        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("/auth/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
            
            });

            if (response.ok) {
                window.location.href = "/dashboard.html";
        
            } else {
                errorDiv.textContent = 'That email and password combination is incorrect.'
                errorDiv.classList.remove('hidden');
            }
        } catch (error) {
            console.error("LOGIN ERROR:", error);
            errorDiv.textContent = 'Unable to connect. Please try again';
            errorDiv.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Log in';
        }
    });
} else if (signupForm) {
    signupForm.addEventListener('submit', async(e) => {
        e.preventDefault();
        errorDiv.classList.add('hidden');
        createAcctBtn.disabled = true;
        createAcctBtn.textContent = 'Creating account...';

        const firstName = document.getElementById("first-name").value;
        const lastName = document.getElementById("last-name").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        const confirmPassword = document.getElementById("confirm-pw").value;

        try {
            const response = await fetch("/auth/signup", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: password,
                    confirmPassword: confirmPassword

                }),
            });

        
            if (response.ok) {
                window.location.href = "/dashboard.html";
            } else {
                const data = await response.json()
                errorDiv.textContent = data.message || 'Unable to create account. Please try again.';
                errorDiv.classList.remove('hidden');
            }

        } catch (error) {
            console.error("SIGNUP ERROR:", error);
            errorDiv.textContent = 'Unable to connect. Please try again.';
            errorDiv.classList.remove('hidden');
        } finally {
            createAcctBtn.disabled = false;
            createAcctBtn.textContent = 'Create account';
        }
    });
}
