const loginBtn = document.getElementById("loginBtn");

// ================= NORMAL LOGIN =================
async function loginUser(e) {
    e.preventDefault();

    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!email || !password) {

        await showLoginPopup(
            "Warning ⚠️",
            "Please fill all fields."
        );

        return;
    }

    // Disable Login Button
    loginBtn.disabled = true;
    loginBtn.innerHTML = "⏳ Signing In...";
    loginBtn.style.opacity = "0.7";
    loginBtn.style.cursor = "not-allowed";

    try {
            let response = await fetch(`${API_BASE_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

        let data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("loggedInUser", JSON.stringify(data.user));

            await showLoginPopup(
                "Success ✅",
                "Login successful"
            );

            window.location.href = "index.html";
        } else {

            // ================= TEACHER APPROVAL =================

            if (
                response.status === 403 &&
                data.message === "Your account is waiting for Admin approval."
            ) {

                await showLoginPopup(
                    "⏳ Approval Pending",
                    "Your teacher account is waiting for Admin approval.\n\nPlease wait until an administrator approves your account."
                );

                return;
            }

            // ================= TEACHER REJECTED =================

            if (
                response.status === 403 &&
                data.status === "rejected"
            ) {

                console.log("========== REJECTED LOGIN ==========");
                console.log("Response Data :", data);
                console.log("Token :", data.token);
                console.log("User :", data.user);

                localStorage.setItem("token", data.token);

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(data.user)
                );

                console.log(
                    "Saved User :",
                    localStorage.getItem("loggedInUser")
                );

                console.log(
                    "Saved Token :",
                    localStorage.getItem("token")
                );

                await showLoginPopup(
                    "Account Rejected ❌",
                    data.message
                );

                window.location.href = "profile.html";

                return;
            }

            // ================= OTHER LOGIN ERRORS =================

            await showLoginPopup(
                "Login Failed ❌",
                data.message || data.error || "Login failed"
            );

        }

    } catch (error) {

        console.log(error);

        await showLoginPopup(
            "Server Error ❌",
            "Unable to connect to server. Please try again later."
        );

    }
    finally {

        loginBtn.disabled = false;
        loginBtn.innerHTML = "Login";
        loginBtn.style.opacity = "1";
        loginBtn.style.cursor = "pointer";

    }
}

// ================= GOOGLE LOGIN =================
async function handleGoogleResponse(response) {

    try {
        const res = await fetch(
            `${API_BASE_URL}/api/google-login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    credential: response.credential
                })
            }
        );

        const data = await res.json();
        console.log("Google response:", data);

        if (res.ok) {
            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem("loggedInUser",JSON.stringify(data.user));

        await showLoginPopup(
            "Success ✅",
            "Google login successful"
        );

        if (data.user.isProfileComplete === false) {

            window.location.href = "profile.html";

        } else {

            window.location.href = "index.html";
        }
        } else {

            if (
                res.status === 403 &&
                data.message === "Your account is waiting for Admin approval."
            ) {

                await showLoginPopup(
                    "⏳ Approval Pending",
                    "Your teacher account is waiting for Admin approval.\n\nPlease wait until an administrator approves your account."
                );

                return;
            }

            await showLoginPopup(
                "Login Failed ❌",
                data.message || data.error || "Google login failed."
            );

        }
    } 
    catch (error) {

    console.log("Google login catch error:", error);

    await showLoginPopup(
        "Server Error ❌",
        "Google login failed. Please try again."
    );

}
}

// ================= SHOW / HIDE PASSWORD =================
function togglePassword() {
    let passwordField = document.getElementById("password");
    passwordField.type = passwordField.type === "password" ? "text" : "password";
}

// ================= LOGIN POPUP =================

function showLoginPopup(title, message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById("loginPopupOverlay");
        const titleBox = document.getElementById("loginPopupTitle");
        const messageBox = document.getElementById("loginPopupMessage");
        const okBtn = document.getElementById("loginPopupOkBtn");

        if (!overlay || !titleBox || !messageBox || !okBtn) {
            alert(message);
            resolve(true);
            return;
        }

        titleBox.innerText = title;
        messageBox.innerText = message;

        overlay.style.display = "flex";

        okBtn.onclick = function () {
            overlay.style.display = "none";
            resolve(true);
        };
    });
}