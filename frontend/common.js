// ================= COMMON NAVBAR USER CONTROL =================

const commonUser = JSON.parse(localStorage.getItem("loggedInUser"));
const commonToken = localStorage.getItem("token");

// Navbar elements
const loginLink = document.getElementById("loginLink");
const logoutLink = document.getElementById("logoutLink");
const profileLink = document.getElementById("profileLink");

const profileMenu = document.getElementById("profileMenu");
const profileIcon = document.getElementById("profileIcon");
const dropdownMenu = document.getElementById("dropdownMenu");
const logoutBtn = document.getElementById("logoutBtn");

const navUserName = document.getElementById("navUserName");
const navProfileImg = document.getElementById("navProfileImg");

// Common profile image function
function getProfileImage(user) {
    if (user && user.photo) {
        return user.photo.startsWith("http")
            ? user.photo
            : `${API_BASE_URL}${user.photo}`;
    }

    return "logo.png";
}

// Logged in
if (commonUser && commonToken) {

    if (loginLink) loginLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "block";
    if (profileLink) profileLink.style.display = "block";

    if (profileMenu) profileMenu.style.display = "flex";

    if (profileIcon) profileIcon.style.display = "inline-block";
    if (navProfileImg) navProfileImg.style.display = "inline-block";

    if (navUserName)
    {
        let hour = new Date().getHours();
        let greeting = "Hi";

        if (hour < 12)
        {
            greeting = "Good Morning";
        } else if (hour < 17) {
                greeting = "Good Afternoon";
        } else {
                greeting = "Good Evening";
        }

        navUserName.innerText =`${greeting}, ${commonUser.firstName || "User"}`;
    }

        if (navProfileImg) 
        {
            navProfileImg.src = getProfileImage(commonUser);

        navProfileImg.onerror = function () {
            navProfileImg.src = "logo.png";
        };
    }

    if (profileIcon) {
        profileIcon.src = getProfileImage(commonUser);

        profileIcon.onerror = function () {
            profileIcon.src = "logo.png";
        };
    }

} else {

    if (loginLink) loginLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "none";
    if (profileLink) profileLink.style.display = "none";

    if (profileMenu) profileMenu.style.display = "none";
    if (dropdownMenu) dropdownMenu.style.display = "none";

    if (navUserName) navUserName.innerText = "";

    if (profileIcon) {
        profileIcon.style.display = "none";
        profileIcon.src = "logo.png";
    }

    if (navProfileImg) {
        navProfileImg.style.display = "none";
        navProfileImg.src = "logo.png";
    }
}

// Dropdown toggle
if (commonUser && commonToken && profileIcon && dropdownMenu) {
    profileIcon.addEventListener("click", function (e) {
        e.stopPropagation();

        dropdownMenu.style.display =
            dropdownMenu.style.display === "block"
                ? "none"
                : "block";
    });
}

// Logout button inside dropdown
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

// Logout link in index page
if (logoutLink) {
    logoutLink.addEventListener("click", logout);
}

// Logout function
async function logout(e) {

    if (e) e.preventDefault();

    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("token");

    await showLogoutPopup(
        "Success ✅",
        "Logged out successfully."
    );

    window.location.href = "login.html";

}

// Click outside dropdown close
document.addEventListener("click", function (e) {
    if (!profileMenu || !dropdownMenu) return;

    if (!profileMenu.contains(e.target)) {
        dropdownMenu.style.display = "none";
    }
});

// ================= ADMIN DASHBOARD LINK =================

const adminDashboardLink =
    document.getElementById("adminDashboardLink");

const teacherDashboardLink =
    document.getElementById("teacherDashboardLink");

// ================= DASHBOARD LINKS =================

if (
    commonUser &&
    commonToken &&
    commonUser.role
) {

    const role =
        commonUser.role.toLowerCase();

    if (role === "admin") {

        if (adminDashboardLink)
            adminDashboardLink.style.display = "block";

        if (teacherDashboardLink)
            teacherDashboardLink.style.display = "none";

    }

    else if (role === "teacher") {

        if (teacherDashboardLink)
            teacherDashboardLink.style.display = "block";

        if (adminDashboardLink)
            adminDashboardLink.style.display = "none";

    }

    else {

        if (adminDashboardLink)
            adminDashboardLink.style.display = "none";

        if (teacherDashboardLink)
            teacherDashboardLink.style.display = "none";

    }

}

// ================= PROFILE COMPLETION PROTECTION =================

function checkProfileCompletion() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (
        user &&
        user.isProfileComplete === false &&
        !window.location.pathname.includes("profile.html") &&
        !window.location.pathname.includes("login.html")
    ) {
        alert("Please complete your profile first to continue.");
        window.location.href = "profile.html";
    }
}

/// ================= CUSTOM COMMON POPUP SYSTEM =================

function showPopup(title, message) {

    const overlay = document.getElementById("customPopupOverlay");
    const titleBox = document.getElementById("customPopupTitle");
    const messageBox = document.getElementById("customPopupMessage");
    const cancelBtn = document.getElementById("customPopupCancelBtn");
    const okBtn = document.getElementById("customPopupOkBtn");

    if (!overlay || !titleBox || !messageBox || !okBtn) {
        alert(message);
        return Promise.resolve(true);
    }

    titleBox.innerText = title;
    messageBox.innerText = message;

    if (cancelBtn) {
        cancelBtn.style.display = "none";
    }

    overlay.style.display = "flex";

    return new Promise((resolve) => {

        okBtn.onclick = function () {

            overlay.style.display = "none";

            resolve(true);
        };
    });
}

function closeCustomPopup() {
    const overlay = document.getElementById("customPopupOverlay");

    if (overlay) {
        overlay.style.display = "none";
    }
}

function showSuccessPopup(message) {
    return showPopup("Success ✅", message);
}

function showErrorPopup(message) {
    return showPopup("Error ❌", message);
}

function showWarningPopup(message) {
    return showPopup("Warning ⚠️", message);
}

function showConfirmPopup(title, message) {
    const overlay = document.getElementById("customPopupOverlay");
    const titleBox = document.getElementById("customPopupTitle");
    const messageBox = document.getElementById("customPopupMessage");
    const cancelBtn = document.getElementById("customPopupCancelBtn");
    const okBtn = document.getElementById("customPopupOkBtn");

    if (!overlay || !titleBox || !messageBox || !cancelBtn || !okBtn) {
        return Promise.resolve(confirm(message));
    }

    hideLoader();

    titleBox.innerText = title;
    messageBox.innerText = message;

    cancelBtn.style.display = "block";
    cancelBtn.innerText = "Cancel";

    okBtn.innerText = "Yes";

    overlay.style.display = "flex";
    overlay.style.visibility = "visible";
    overlay.style.pointerEvents = "auto";

    return new Promise((resolve) => {
        cancelBtn.onclick = function () {
            overlay.style.display = "none";
            resolve(false);
        };

        okBtn.onclick = function () {
            overlay.style.display = "none";
            resolve(true);
        };
    });
}

// ================= COMMON LOADER SYSTEM =================

function showLoader(message = "Loading...") {
    const loader = document.getElementById("commonLoader");
    const loaderText = document.getElementById("loaderText");

    if (loaderText) {
        loaderText.innerText = message;
    }

    if (loader) {
        loader.style.display = "flex";
        loader.style.visibility = "visible";
        loader.style.pointerEvents = "auto";
    }
}

function hideLoader() {
    const loader = document.getElementById("commonLoader");

    if (loader) {
        loader.style.display = "none";
    }
}

// ================= DELAY =================

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// ================= LOGIN REQUIRED POPUP =================

function openLoginPopup() {
    const popup = document.getElementById("loginPopup");

    if (popup) {
        popup.style.display = "flex";
    } else {
        alert("Please login first");
        window.location.href = "login.html";
    }
}

function closeLoginPopup() {
    const popup = document.getElementById("loginPopup");

    if (popup) {
        popup.style.display = "none";
    }
}

// ================= LOGOUT POPUP =================

function showLogoutPopup(title, message) {

    return new Promise((resolve) => {

        let overlay = document.getElementById("logoutPopupOverlay");

        // Agar popup page me nahi hai to create kar do
        if (!overlay) {

            overlay = document.createElement("div");

            overlay.id = "logoutPopupOverlay";

            overlay.style.cssText = `
                position:fixed;
                inset:0;
                background:rgba(0,0,0,.45);
                display:flex;
                justify-content:center;
                align-items:center;
                z-index:999999;
            `;

            overlay.innerHTML = `
                <div style="
                    width:420px;
                    background:#fff;
                    border-radius:15px;
                    padding:30px;
                    text-align:center;
                    box-shadow:0 10px 30px rgba(0,0,0,.25);
                    animation:popupScale .25s ease;
                ">

                    <h2 id="logoutPopupTitle"></h2>

                    <p id="logoutPopupMessage"></p>

                    <button
                        id="logoutPopupOkBtn"
                        style="
                            padding:12px 30px;
                            border:none;
                            border-radius:8px;
                            background:#2563eb;
                            color:white;
                            cursor:pointer;
                            font-size:15px;
                        ">
                        OK
                    </button>

                </div>
            `;

            document.body.appendChild(overlay);

        }

        document.getElementById("logoutPopupTitle").innerText = title;
        document.getElementById("logoutPopupMessage").innerText = message;

        overlay.style.display = "flex";

        document.getElementById("logoutPopupOkBtn").onclick = () => {

            overlay.style.display = "none";

            resolve();

        };

    });

}

// ================= COMMON MESSAGE POPUP =================

function showMessagePopup(title, message) {

    return new Promise((resolve) => {

        const popupTitle = document.getElementById("logoutPopupTitle");
        const popupMessage = document.getElementById("logoutPopupMessage");
        const popupOverlay = document.getElementById("logoutPopupOverlay");
        const okBtn = document.getElementById("logoutPopupOkBtn");

        if (!popupTitle || !popupMessage || !popupOverlay || !okBtn) {

            alert(message);
            resolve(true);
            return;

        }

        popupTitle.innerText = title;
        popupMessage.innerText = message;

        popupOverlay.style.display = "flex";

        okBtn.onclick = function () {

            popupOverlay.style.display = "none";

            resolve(true);

        };

    });

}

//================AUTO SESSION TIMEOUT=================== 

const WARNING_TIME = 19 * 60 * 1000;
const LOGOUT_TIME  = 20 * 60 * 1000;

let warningTimer;
let logoutTimer;

function createSessionPopup(){

    if(document.getElementById("sessionPopupOverlay")) return;

    const popup = document.createElement("div");

    popup.id = "sessionPopupOverlay";

    popup.innerHTML = `

    <div id="sessionPopup">

        <h2>⏳ Session Expiring</h2>

        <p>

        Your session will expire in

        <span id="sessionCountdown">60</span>

        seconds due to inactivity.

        </p>

        <div class="sessionButtons">

            <button id="continueSessionBtn">

            Continue Session

            </button>

            <button id="logoutNowBtn">

            Logout Now

            </button>

        </div>

    </div>

    `;

    document.body.appendChild(popup);

    document.getElementById("continueSessionBtn")
    .onclick = continueSession;

    document.getElementById("logoutNowBtn")
    .onclick = logoutNow;

}

createSessionPopup();


//================ RESET TIMER ====================

function resetSessionTimer(){

    clearTimeout(warningTimer);

    clearTimeout(logoutTimer);

    const popup = document.getElementById("sessionPopupOverlay");

    if (popup) {
        popup.style.display = "none";
    }

    warningTimer = setTimeout(showSessionWarning, WARNING_TIME);

    logoutTimer=setTimeout(logoutNow,LOGOUT_TIME);

}


//================ WARNING ====================

let countdownInterval;

function showSessionWarning(){

    const popup=document.getElementById("sessionPopupOverlay");

    popup.style.display="flex";

    let seconds=60;

    document.getElementById("sessionCountdown").innerText=seconds;

    clearInterval(countdownInterval);

    countdownInterval=setInterval(()=>{

        seconds--;

        document.getElementById("sessionCountdown").innerText=seconds;

        if(seconds<=0){

            clearInterval(countdownInterval);

        }

    },1000);

}


//================ CONTINUE ====================

function continueSession(){

    clearInterval(countdownInterval);

    resetSessionTimer();

}


//================ LOGOUT ====================

async function logoutNow() {

    clearInterval(countdownInterval);

    const sessionPopup = document.getElementById("sessionPopupOverlay");

    if (sessionPopup) {
        sessionPopup.style.display = "none";
    }

    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");

    await showLogoutPopup(
        "Session Expired ⏳",
        "You have been logged out because you were inactive."
    );

    window.location.href = "login.html";

}

//================ USER ACTIVITY ====================

[
"click",
"mousemove",
"keypress",
"keydown",
"scroll",
"touchstart"
].forEach(event=>{

    document.addEventListener(event,resetSessionTimer);

});

resetSessionTimer();

// ================= CLOSE POPUP =================

/*document.addEventListener("DOMContentLoaded", function () {

    const okBtn = document.getElementById("logoutPopupOkBtn");

    if (okBtn) {

        okBtn.onclick = function () {

            document.getElementById("logoutPopupOverlay").style.display = "none";

        };

    }

});*/