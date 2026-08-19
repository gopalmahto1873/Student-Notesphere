// ======================================================
//               TEACHER DASHBOARD
//          Student Notesphere - teacher.js
// ======================================================

// ================= GLOBAL VARIABLES =================

let teacher = JSON.parse(localStorage.getItem("loggedInUser"));
let token = localStorage.getItem("token");

let allUploads = [];

// ================= LOGIN CHECK =================

if (!teacher || !token) {

    showMessagePopup(
        "Login Required",
        "Please login first."
    );

    setTimeout(() => {

        window.location.href = "login.html";

    }, 1000);

    throw new Error("Unauthorized");

}

if (teacher.role !== "teacher") {

    showMessagePopup(
        "Access Denied",
        "Only Teachers can access this page."
    );

    setTimeout(() => {

        window.location.href = "index.html";

    }, 1000);

    throw new Error("Unauthorized");

}

// ================= LOGOUT =================

async function logoutUser() {

    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");

    await showLogoutPopup(
        "Success ✅",
        "Logged out successfully."
    );

    window.location.href = "login.html";

}

// ================= DASHBOARD GREETING =================

function setDashboardGreeting() {

    const greeting = document.getElementById("dashboardGreeting");
    const hour = new Date().getHours();

    let message = "";

    if (hour < 12) {
        message = "Good Morning";
    }

    else if (hour < 17) {
        message = "Good Afternoon";
    }

    else if (hour < 21) {
        message = "Good Evening";
    }

    else {
        message = "Good Night";
    }

    const teacherName =
        teacher.firstName || "Teacher";

    greeting.innerHTML =
        `${message}, ${teacherName} 👋`;

}

// ================= NAVBAR NAME =================

function setTeacherName() {

    document.getElementById(
        "navTeacherName"
    ).innerText =
        teacher.firstName || "Teacher";

}

// ================= TODAY DATE =================

function setTodayDate() {

    const today = new Date();

    document.getElementById("todayDate").innerText =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}

// ================= LAST LOGIN =================

function setLastLogin() {

    const loginTime =
        teacher.lastLogin
        ? new Date(teacher.lastLogin)
        : new Date();

    document.getElementById(
        "lastLoginText"
    ).innerText =
        loginTime.toLocaleString(
            "en-IN",
            {

                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true

            }
        );

}

// ================= LOADER =================

function showDashboard() {

    const loader = document.getElementById("dashboardLoader");

    const content = document.getElementById("dashboardContent");

    loader.style.opacity = "0";

    setTimeout(() => {

        loader.style.display = "none";
        content.style.display = "block";

        setTimeout(() => {

            content.style.opacity = "1";

        }, 100);

    }, 500);

}

// ================= INITIALIZE DASHBOARD =================

async function initializeDashboard() {

    setTeacherName();
    setDashboardGreeting();
    setTodayDate();
    setLastLogin();
    await loadTeacherStats();
    await loadUploads();
    showDashboard();

}

// ================= LOAD TEACHER STATS =================

async function loadTeacherStats() {

    try {

        const res = await fetch(

            `${API_BASE_URL}/api/teacher/dashboard-stats`,

            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

        );

        const data = await res.json();

        if (!res.ok) {

            showMessagePopup(
                "Error ❌",
                data.message || "Unable to load dashboard."
            );

            return;

        }

        animateCount(
            "totalNotes",
            data.totalNotes || 0
        );

        animateCount(
            "totalQuiz",
            data.totalQuiz || 0
        );

        animateCount(
            "totalPYQ",
            data.totalPYQ || 0
        );

        animateCount(
            "totalDownloads",
            data.totalDownloads || 0
        );

        animateCount(
            "recentUploads",
            data.recentUploads || 0
        );

        animateCount(
            "totalViews",
            data.totalViews || 0
        );

    }

    catch (err) {

        console.log(err);

        showMessagePopup(

            "Error ❌",

            "Failed to load dashboard."

        );

    }

}

// ================= ANIMATE COUNTER =================

function animateCount(id, finalValue) {

    const element =
        document.getElementById(id);

    if (!element) return;

    let start = 0;

    finalValue = Number(finalValue) || 0;

    const duration = 700;

    const stepTime = 20;

    const steps = duration / stepTime;

    const increment = finalValue / steps;

    const counter = setInterval(() => {

        start += increment;

        if (start >= finalValue) {

            element.innerText = finalValue;

            clearInterval(counter);

        }

        else {

            element.innerText =
                Math.floor(start);

        }

    }, stepTime);

}

// ================= LOAD MY UPLOADS =================

async function loadUploads() {

    try {

        const res = await fetch(

            `${API_BASE_URL}/api/teacher/uploads`,

            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

        );

        const uploads =
            await res.json();

        if (!res.ok) {

            showMessagePopup(
                "Error ❌",
                uploads.message || "Unable to load uploads."
            );

            return;

        }

        allUploads = uploads;

        displayUploads(allUploads);

    }

    catch (err) {

        console.log(err);

    }

}

// ================= DISPLAY UPLOADS =================

function displayUploads(data) {

    const table = document.getElementById("uploadsTable");

    table.innerHTML = "";

    document.getElementById("uploadCount").innerText =
        `Showing ${data.length} Uploads`;

    if (data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="9">
                    No Uploads Found
                </td>
            </tr>
        `;

        return;
    }

    let html = "";

    data.forEach(item => {

        html += `
        <tr>

            <td>${item.type || "-"}</td>

            <td>${item.title || "-"}</td>

            <td>${item.department || "-"}</td>

            <td>${item.subject || "-"}</td>

            <td>${new Date(item.uploadDate).toLocaleDateString("en-IN")}</td>

            <td>${new Date(item.uploadDate).toLocaleTimeString("en-IN")}</td>

            <td>${item.downloads || 0}</td>

            <td>
                <span class="approved-badge">
                    Active
                </span>
            </td>

            <td>
                <button
                    class="view-btn"
                    onclick="viewUpload('${item.type}','${item.id}')">
                    👁 View
                </button>
            </td>

        </tr>
        `;
    });

    table.innerHTML = html;
}

// ================= SEARCH / FILTER =================

function filterUploads() {

    const search = document.getElementById("uploadSearch").value.toLowerCase();

    const filter = document.getElementById("uploadFilter").value;

    const filtered = allUploads.filter(item => {

        const matchesSearch =
            (item.title || "")
            .toLowerCase()
            .includes(search)
            ||
            (item.subject || "")
            .toLowerCase()
            .includes(search);

        const matchesType =
            filter === ""
            ||
            item.type === filter;
        return matchesSearch && matchesType;

    });

    displayUploads(filtered);

}

// ================= EVENTS =================

document
.getElementById("uploadSearch")
?.addEventListener(
    "input",
    filterUploads
);

document
.getElementById("uploadFilter")
?.addEventListener(
    "change",
    filterUploads
);

// ================= VIEW UPLOAD =================

async function viewUpload(type, id) {

    try {

        const res = await fetch(

            `${API_BASE_URL}/api/teacher/upload/${type}/${id}`,

            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

        );

        const upload = await res.json();

        if (!res.ok) {

            showMessagePopup(
                "Error ❌",
                upload.message || "Unable to load upload."
            );

            return;

        }

        let message =

            `Title : ${upload.title}\n\n` +

            `Subject : ${upload.subject}\n\n` +

            `Type : ${upload.type}\n\n` +

            `Downloads : ${upload.downloads || 0}\n\n` +

            `Views : ${upload.views || 0}`;

        showMessagePopup(
            "Upload Details",
            message
        );

    }

    catch (err) {

        console.log(err);

    }

}

// ================= NOTIFICATION =================

function toggleNotificationPopup() {

    const popup =

        document.getElementById(

            "notificationPopup"

        );

    if (popup.style.display === "block") {

        popup.style.display = "none";

    }

    else {

        popup.style.display = "block";

    }

}

function closeNotificationPopup() {

    document

        .getElementById(

            "notificationPopup"

        )

        .style.display = "none";

}

// ================= LOAD NOTIFICATIONS =================

function loadNotifications() {

    document.getElementById(

        "notificationCount"

    ).innerText = "3";

    document.getElementById(

        "notificationList"

    ).innerHTML = `

        <div class="notification-item">

            📚 New Notes Uploaded Successfully

        </div>

        <div class="notification-item">

            📝 Quiz Published

        </div>

        <div class="notification-item">

            📄 PYQ Uploaded Successfully

        </div>

    `;

}

// ================= AUTO REFRESH =================

function startDashboardAutoRefresh() {

    setInterval(async () => {

        try {

            await loadTeacherStats();
            await loadUploads();

            console.log(

                "Teacher Dashboard Refreshed"

            );

        }

        catch (err) {
            console.log(err);
        }

    }, 30000);

}

// ================= LOGOUT =================

document.getElementById("logoutBtn") ?.addEventListener(

    "click",

    function (e) {
        e.preventDefault();
        logoutUser();

    }

);

// ================= ESC CLOSE =================

document.addEventListener(

    "keydown",

    function (e) {

        if (e.key === "Escape") {
            closeNotificationPopup();
        }

    }

);

// ================= CLICK OUTSIDE =================

document.addEventListener(

    "click",

    function (e) {

        const popup = document.getElementById("notificationPopup");

        const button = document.getElementById("notificationBtn");

        if (

            popup &&

            popup.style.display === "block" &&
            !popup.contains(e.target) &&
            !button.contains(e.target)

        ) {

            popup.style.display = "none";

        }

    }

);

// ================= INIT =================

initializeDashboard();
loadNotifications();
startDashboardAutoRefresh();