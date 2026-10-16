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
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
        const response = await fetch("http://127.0.0.1:8080/auth/login", {
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
            window.location.href = "dashboard.html";
    
        } else {
            errorDiv.classList.remove('hidden');
        }
     } catch (err) {
            console.log("LOGIN ERROR:", err);
        }
    });
} else {
    signupForm.addEventListener('submit', async(e) => {
        e.preventDefault();

        const firstName = document.getElementById("first-name").value;
        const lastName = document.getElementById("last-name").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        const confirmPassword = document.getElementById("confirm-pw").value;

        try {
            const response = await fetch("http://127.0.0.1:8080/auth/signup", {
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
                window.location.href = "dashboard.html";
            } else {
                data = await response.json()
                errorDiv.textContent = data.message;
                errorDiv.classList.remove('hidden');
            }

        } catch (error) {
            console.log("LOGIN ERROR:", error)
        }

    })
}
