let pendingUserId = null;
let pendingRole = null;
let pendingDeleteId = null;
let rejectTeacherId = null;

// ================= ADMIN CHECK =================
let allUsers = [];
let user = JSON.parse(localStorage.getItem("loggedInUser"));
let token = localStorage.getItem("token");

if (!user || !token) {
    alert("Please login first");
    window.location.href = "login.html";
}

if (user.role !== "admin") {
    alert("Access denied! Admin only.");
    window.location.href = "index.html";
}

// ================= LOGOUT =================
async function logoutUser() {

    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");

    await showLogoutPopup(
        "Success ✅",
        "Logged out successfully"
    );

    window.location.href = "login.html";
}

// ================= LOAD STATS =================
async function loadStats() {
    try {
        let res = await fetch(`${API_BASE_URL}/api/users/stats`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        let stats = await res.json();

        if (!res.ok) {
            alert(stats.message || stats.error || "Failed to load stats");
            return;
        }

        animateCount("totalUsers", stats.totalUsers);
        animateCount("students", stats.students);
        animateCount("teachers", stats.teachers);
        animateCount("admins", stats.admins);
        animateCount("totalNotes", stats.totalNotes);
        animateCount("totalQuizzes", stats.totalQuizzes);
        animateCount("totalPYQ", stats.totalPYQ);
        animateCount("totalDepartments", stats.totalDepartments);

        updateUserDistribution(stats);


    } catch (err) {
        console.log(err);
        alert("Error loading stats");
    }
}

// ================= USER ANALYTICS =================
function updateUserDistribution(stats) {

    let total = stats.totalUsers || 1;

    let studentPercent =
        ((stats.students / total) * 100).toFixed(1);

    let teacherPercent =
        ((stats.teachers / total) * 100).toFixed(1);

    let adminPercent =
        ((stats.admins / total) * 100).toFixed(1);

    document.getElementById("studentBar").style.width =
        studentPercent + "%";

    document.getElementById("teacherBar").style.width =
        teacherPercent + "%";

    document.getElementById("adminBar").style.width =
        adminPercent + "%";

    document.getElementById("studentInfo").innerText =
        `${stats.students} (${studentPercent}%)`;

    document.getElementById("teacherInfo").innerText =
        `${stats.teachers} (${teacherPercent}%)`;

    document.getElementById("adminInfoCount").innerText =
        `${stats.admins} (${adminPercent}%)`;
}
// ================= LOAD USERS =================
async function loadUsers() {
    try {
        let res = await fetch(`${API_BASE_URL}/api/users`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        let users = await res.json();

        if (!res.ok) {
            alert(users.message || users.error || "Failed to load users");
            return;
        }

        allUsers = users;

        // Agar search ya filter laga hua hai
        const searchValue = document.getElementById("userSearch").value;
        const roleValue = document.getElementById("roleFilter").value;

        if (searchValue || roleValue) {

            filterUsers();

        } else {

            displayUsers(allUsers);

        }

    } catch(err){

        console.error("Load Users Error:", err);

        showMessagePopup(
            "Error ❌",
            err.message || "Failed to load users."
        );

    }
}

// ================= DISPLAY USERS =================
function displayUsers(users) {
    let table = document.getElementById("usersTable");
    table.innerHTML = "";

    document.getElementById( "userCount").innerText =`Showing ${users.length} users`;

    if (!users || users.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No users found</td>
            </tr>
        `;
        return;
    }

    users.forEach(u => {
        let fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();

        table.innerHTML += `
            <tr>
                <td>
                    <div class="user-info">

                        <img

                        src="${u.photo || 'logo.png'}"
                        class="user-table-img clickable-photo"
                        data-photo="${u.photo}"
                        data-name="${fullName}"
                        data-role="${u.role}"
                        title="View Photo">

                        <div class="user-details">
                            <span
                                class="user-name clickable-name"
                                data-id="${u._id}"
                                title="View User Details">

                                ${fullName || "-"}

                            </span>

                            <small class="user-id">
                                ${u.customId || "-"}
                            </small>
                        </div>

                    </div>
                </td>
                <td>

                    <span
                        class="clickable-email"
                        data-id="${u._id}"
                        title="View User Details">

                        ${u.email || "-"}

                    </span>

                </td>
                <td>${u.department || "-"}</td>
                <td>
                    <span class="role-badge ${u.role}">
                        ${
                            u.role === "admin"
                            ? "🛡️ Admin"
                            : u.role === "teacher"
                            ? "👨‍🏫 Teacher"
                            : "🎓 Student"
                        }
                    </span>
                </td>

                <td>

                    ${
                        u.role === "teacher"

                        ?

                        (
                            u.approvalStatus === "approved"

                            ?

                            `<span class="approved-badge">
                                ✅ Approved
                            </span>`

                            :

                            u.approvalStatus === "rejected"

                            ?

                            `<span class="rejected-badge">
                                ❌ Rejected
                            </span>`

                            :

                            `<button
                                class="view-doc-btn"
                                onclick="viewTeacherDocument('${u.idProof}')">

                                📄 View Document

                            </button>

                            <button
                                class="approve-btn"
                                onclick="approveTeacher('${u._id}')">

                                ✔ Approve

                            </button>
                            
                            <button
                                class="reject-btn"
                                onclick="openRejectPopup('${u._id}')">

                                ❌ Reject

                            </button>`
                            
                        )

                        :

                        "-"
                    }

                    </td>

                <td>
                    <select class="role-select" onchange="changeRole('${u._id}', this.value)">
                        <option value="student" ${u.role === "student" ? "selected" : ""}>Student</option>
                        <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>Teacher</option>
                        <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                </td>
                <td>

                    <button

                    class="action-btn"

                    data-id="${u._id}"

                    title="More Options">

                    ⋮

                    </button>

                </td>
            </tr>
        `;
    });

attachUserEvents();
}

// ================= ATTACH USER EVENTS =================

    function attachUserEvents() {

        //function attachUserEvents(){

            /*console.log("attachUserEvents Called");

            console.log(document.querySelectorAll(".clickable-name"));

            console.log(document.querySelectorAll(".clickable-email"));

            console.log(document.querySelectorAll(".clickable-photo"));*/

        

        // Name Click

        document.querySelectorAll(".clickable-name").forEach(item => {

            item.onclick = function () {

                let id = this.dataset.id;

                openUserDetails(id);

            };

        });


        // Email Click

        document.querySelectorAll(".clickable-email").forEach(item => {

            item.onclick = function () {

                let id = this.dataset.id;

                openUserDetails(id);

            };

        });


        // ================= PHOTO CLICK =================

        document.querySelectorAll(".clickable-photo").forEach(photo => {

            photo.onclick = function () {

                const img =
                    this.dataset.photo || this.src;

                const name =
                    this.dataset.name || "User";

                const role =
                    this.dataset.role || "Student";

                document.getElementById("photoPopupImage").src = img;

                document.getElementById("photoPopupTitle").innerText =
                    name;

                document.getElementById("photoPopupRole").innerText =
                    role.toUpperCase();

                document.getElementById("photoPopup").style.display =
                    "flex";

            };

        });

        // Action Button

        document.querySelectorAll(".action-btn").forEach(btn => {

            btn.onclick = function (e) {

                e.stopPropagation();

                let id = this.dataset.id;

                openActionMenu(id,this);

            };

        });

    }


// ================= USER DETAILS POPUP =================

async function openUserDetails(id) {
    
    selectedUserId = id;
    try {

        const res = await fetch(
            `${API_BASE_URL}/api/users/profile/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const user = await res.json();
        console.log(user);
console.log("Approved By :", user.approvedBy);

        if (!res.ok) {

            showMessagePopup(
                "Error ❌",
                user.message || "Unable to load user."
            );

            return;

        }

        console.log(user);

        // ================= BASIC =================

        document.getElementById("viewPhoto").src = user.photo || "logo.png";

        document.getElementById("viewName").innerText = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "-";

        document.getElementById("viewCustomId").innerText = user.customId || "-";

        document.getElementById("viewEmail").innerText = user.email || "-";

        document.getElementById("viewDOB").innerText = user.dob ? new Date(user.dob).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
        : "-";

        document.getElementById("viewDepartment").innerText = user.department || "-";

        // ================= STUDENT TYPE =================

        document.getElementById("viewStudentType").innerText = user.studentType || "-";

        // ================= ROLE =================

        const role = document.getElementById("viewRole");

        role.className = "popup-role-badge";

        if (user.role === "admin") {

            role.innerText = "🛡 Administrator";

            role.style.background = "#dc2626";

        }

        else if (user.role === "teacher") {

            role.innerText = "👨‍🏫 Teacher";

            role.style.background = "#16a34a";

        }

        else {

            role.innerText = "🎓 Student";

            role.style.background = "#2563eb";

        }

        // ================= TEACHER VERIFICATION =================

        const teacherSection =
            document.getElementById("teacherVerificationSection");

        if (user.role === "teacher") {

            teacherSection.style.display = "block";

        } else {

            teacherSection.style.display = "none";

        }

        // ================= CHANGE RIGHT SIDE LABELS =================

        const popupHeading = document.getElementById("popupHeading");

        const studentTypeLabel = document.getElementById("studentTypeLabel");

        const labelUniversity = document.getElementById("labelUniversity");

        const labelDepartment = document.getElementById("labelDepartment");

        const labelSession = document.getElementById("labelSession");

        const labelSemester = document.getElementById("labelSemester");

        if (user.role === "teacher") {

            popupHeading.innerText = "👨‍🏫 Professional Information";

            labelUniversity.innerText = "Institution";

            labelDepartment.innerText = "Subject";

            labelSession.innerText = "Designation";

            labelSemester.innerText = "Experience";

            studentTypeLabel.innerText =
                "✔ Approval Status";

            document.getElementById("viewStudentType").innerText =
                user.approvalStatus || "-";

        }
        else {

            popupHeading.innerText = "🎓 Academic Information";

            labelUniversity.innerText = "University / College";

            labelDepartment.innerText = "Department";

            labelSession.innerText = "Session";

            labelSemester.innerText = "Student Type";

            studentTypeLabel.innerText =
                "🎓 Student Type";

        }

        // ================= CREATED DATE =================

        document.getElementById("viewCreatedAt").innerText =
            user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-IN")
                : "-";

        // ================= TEACHER VERIFICATION =================

        if (user.role === "teacher") {

            teacherSection.style.display = "block";

            // Approval Status

            if (user.approvalStatus === "approved") {

                document.getElementById("viewApprovalStatus").innerHTML =
                    "✅ Approved";

            }

            else if (user.approvalStatus === "pending") {

                document.getElementById("viewApprovalStatus").innerHTML =
                    "⏳ Pending";

            }

            else {

                document.getElementById("viewApprovalStatus").innerHTML =
                    "❌ Rejected";

            }

            const approvedByElement = document.getElementById("viewApprovedBy");

            console.log("Element :", approvedByElement);

            if (approvedByElement) {

                approvedByElement.innerText =
                    user.approvedBy
                        ? `${user.approvedBy.firstName} ${user.approvedBy.lastName}`
                        : "-";

            }
            document.getElementById("viewApprovedAt").innerText =
                user.approvedAt
                    ? new Date(user.approvedAt).toLocaleString("en-IN")
                    : "-";

            document.getElementById("viewRejectionReason").innerText =
                user.rejectionReason || "-";

        }

        else {

            teacherSection.style.display = "none";

        }
        
        // ================= LAST LOGIN =================

        document.getElementById("viewLastLogin").innerText =
            user.lastLogin
                ? new Date(user.lastLogin).toLocaleString("en-IN")
                : "Never";

        // ================= APPROVAL DETAILS =================

        document.getElementById("viewApprovalStatus").innerText =
            user.approvalStatus || "-";

        document.getElementById("viewApprovedBy").innerText =
            user.approvedBy
                ? `${user.approvedBy.firstName} ${user.approvedBy.lastName}`
                : "-";

        document.getElementById("viewApprovedAt").innerText =
            user.approvedAt
                ? new Date(user.approvedAt).toLocaleString("en-IN")
                : "-";

        document.getElementById("viewRejectReason").innerText =
            user.rejectionReason || "-";

        // ================= ROLE WISE DETAILS =================

        if (user.role === "teacher") {

            document.getElementById("viewUniversity").innerText =
                user.institution || "-";

            document.getElementById("viewDepartment").innerText =
                user.subject || "-";

            document.getElementById("viewSession").innerText =
                user.designation || "-";

            document.getElementById("viewSemester").innerText =
                user.experience
                    ? `${user.experience} Years`
                    : "-";

            document.getElementById("passingYearCard").style.display = "none";
            document.getElementById("currentStatusCard").style.display = "none";
        }

        else {

            if (user.studentType === "Ex-Student") {

                document.getElementById("viewUniversity").innerText =
                    user.lastUniversity || "-";

                document.getElementById("viewSession").innerText =
                    user.lastSession || "-";

                document.getElementById("viewSemester").innerText =
                    user.studentType || "-";

                document.getElementById("passingYearCard").style.display = "flex";

                document.getElementById("currentStatusCard").style.display = "flex";

                document.getElementById("viewPassingYear").innerText =
                    user.passingYear || "-";

                document.getElementById("viewCurrentStatus").innerText =
                    user.currentStatus || "-";

            }

            else {

                document.getElementById("viewUniversity").innerText =
                    user.university || "-";

                document.getElementById("viewDepartment").innerText =
                    user.department || "-";

                document.getElementById("viewSession").innerText =
                    user.session || "-";

                document.getElementById("viewSemester").innerText =
                    user.studentType || "-";

                document.getElementById("passingYearCard").style.display = "none";

                document.getElementById("currentStatusCard").style.display = "none";
            }

        }

        // ================= OPEN =================

        document.getElementById("userViewPopup").style.display =
            "flex";

    }

    catch (err) {

        console.log(err);

        showMessagePopup(
            "Error ❌",
            "Unable to load user."
        );

    }

}

let selectedUserId = null;

function openActionMenu(id, button) {

    selectedUserId = id;

    let menu = document.getElementById("actionMenu");

    // Toggle
    if (
        menu.style.display === "block" &&
        menu.dataset.user === id
    ) {
        menu.style.display = "none";
        return;
    }

    menu.dataset.user = id;

    menu.style.display = "block";

    menu.style.left = button.getBoundingClientRect().left + window.scrollX + "px";
    menu.style.top = button.getBoundingClientRect().bottom + window.scrollY + "px";
}

//================= CONFIRM DELETE =================

function confirmDelete() {

    pendingDeleteId = selectedUserId;

    document.getElementById("actionMenu").style.display = "none";

    document.getElementById("deletePopup").style.display = "flex";

}

//================= USER DELETE =================
async function deleteUser() {

    document.getElementById("deletePopup").style.display = "none";

    try {

        let res = await fetch(
            `${API_BASE_URL}/api/users/${pendingDeleteId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        let data = await res.json();

        if (!res.ok) {

            showMessagePopup(
                "Error ❌",
                data.message || "Delete failed"
            );

            return;
        }

        showMessagePopup(
            "Success ✅",
            data.message
        );

        document.getElementById("actionMenu").style.display = "none";

        loadUsers();

        loadStats();

    }
    catch (err) {

        console.log(err);

        showMessagePopup(
            "Error ❌",
            "Delete failed"
        );

    }

}


// ================= PRINT USER =================
async function printUser() {
    
    document.getElementById("actionMenu").style.display = "none";

    try {

        const res = await fetch(
            `${API_BASE_URL}/api/users/profile/${selectedUserId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const user = await res.json();

        if (!res.ok) {

            showMessagePopup(
                "Error ❌",
                user.message || "Unable to load user."
            );

            return;
        }

        const fullName =
            `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`.replace(/\s+/g, " ").trim();

        const dob = user.dob
            ? new Date(user.dob).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            })
            : "-";

        const createdAt = user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-IN")
            : "-";

        const today = new Date().toLocaleString("en-IN");

        const roleText =
            user.role === "admin"
                ? "Administrator"
                : user.role === "teacher"
                ? "Teacher"
                : "Student";
        
        const roleColor =
            user.role === "admin"
                ? "#dc2626"
                : user.role === "teacher"
                ? "#16a34a"
                : "#2563eb";

        const sectionHeading =
            user.role === "teacher"
                ? "👨‍🏫 Teacher Information"
                : "🎓 Academic Information";

        let academicSection = "";
        let verificationSection = "";

        // ================= TEACHER VERIFICATION =================

        if (user.role === "teacher") {

            verificationSection = `

            <div class="section">
                <h3>Teacher Verification</h3>
                <table>
                    <tr>
                        <td>Approval Status</td>
                        <td>${user.approvalStatus || "-"}</td>
                    </tr>

                    <tr>
                        <td>Approved By</td>
                        <td>
                            ${
                                user.approvedBy
                                ? `${user.approvedBy.firstName} ${user.approvedBy.lastName || ""}`
                                : "-"
                            }

                        </td>
                    </tr>

                    <tr>
                        <td>Approved Date</td>
                        <td>

                            ${
                                user.approvedAt
                                ? new Date(user.approvedAt).toLocaleString("en-IN")
                                : "-"
                            }

                        </td>
                    </tr>

                    <tr>
                        <td>Rejection Reason</td>
                        <td>${user.rejectionReason || "-"}</td>
                    </tr>
                </table>

            </div>

            `;
        }

        // ================= TEACHER =================

        if (user.role === "teacher") {

            academicSection = `

                <tr>

                    <td>Qualification</td>

                    <td>${user.qualification || "-"}</td>

                </tr>

                <tr>

                    <td>Subject</td>

                    <td>${user.subject || "-"}</td>

                </tr>

                <tr>

                    <td>Experience</td>

                    <td>${user.experience || "-"} Years</td>

                </tr>

                <tr>

                    <td>Institution</td>

                    <td>${user.institution || "-"}</td>

                </tr>

                <tr>

                    <td>Designation</td>

                    <td>${user.designation || "-"}</td>

                </tr>

            `;

        }

        else if (user.studentType === "Ex-Student") {

            academicSection = `
                <tr>
                    <td>Last University</td>
                    <td>${user.lastUniversity || "-"}</td>
                </tr>

                <tr>
                    <td>Department</td>
                    <td>${user.department || "-"}</td>
                </tr>

                <tr>
                    <td>Last Session</td>
                    <td>${user.lastSession || "-"}</td>
                </tr>

                <tr>
                    <td>Passing Year</td>
                    <td>${user.passingYear || "-"}</td>
                </tr>

                <tr>
                    <td>Current Status</td>
                    <td>${user.currentStatus || "-"}</td>
                </tr>
            `;

        } else {

            academicSection = `
                <tr>
                    <td>University</td>
                    <td>${user.university || "-"}</td>
                </tr>

                <tr>
                    <td>Department</td>
                    <td>${user.department || "-"}</td>
                </tr>

                <tr>
                    <td>Session</td>
                    <td>${user.session || "-"}</td>
                </tr>
            `;

        }

        const printWindow = window.open("", "", "width=900,height=900");

        printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<title>User Report</title>

<style>

*{
    box-sizing:border-box;
}

body{

    font-family:Arial,Helvetica,sans-serif;
    padding:35px;
    color:#222;
}

.header{

    text-align:center;
    border-bottom:3px solid #1e40af;
    padding-bottom:15px;
    margin-bottom:25px;
}

.header h1{

    color:#1e40af;
    margin:0;
}

.header h3{

    margin-top:8px;
    color:#555;
    font-weight:normal;
}

.top{

    display:flex;
    gap:30px;
    align-items:center;
    margin-bottom:30px;
}

.photo{

    width:150px;
    height:150px;
    border-radius:50%;
    object-fit:cover;
    border:4px solid #1e40af;
}

.info{

    flex:1;
}

.info h2{

    margin:0;
}

.role{

    display:inline-block;
    background:#1e40af;
    color:white;
    padding:6px 15px;
    border-radius:20px;
    margin-top:10px;
    font-size:14px;
}

.section{

    margin-top:25px;
}

.section h3{

    background:#1e40af;
    color:white;
    padding:10px;
    margin:0;
}

table{

    width:100%;
    border-collapse:collapse;
}

td{

    border:1px solid #ddd;
    padding:10px;
}

td:first-child{

    width:220px;
    font-weight:bold;
    background:#f5f5f5;
}

.footer{

    margin-top:40px;
    text-align:center;
    font-size:13px;
    color:#666;
    border-top:1px solid #ddd;
    padding-top:15px;
}

@media print{

body{

padding:15px;

}

}

</style>

</head>

<body>

<div class="header">

<h1>Student Notesphere</h1>

<h3>User Information Report</h3>

</div>

<div class="top">

<img
class="photo"
src="${user.photo || "logo.png"}">

<div class="info">

<h2>${fullName}</h2>

<div
class="role"
style="background:${roleColor};"
>
${roleText}
</div>

<p><b>User ID :</b> ${user.customId || "-"}</p>

<p><b>Email :</b> ${user.email}</p>

</div>

</div>

<div class="section">

<h3>Personal Information</h3>

<table>

<tr>

<td>Date of Birth</td>

<td>${dob}</td>

</tr>

<tr>

<td>Student Type</td>

<td>${user.studentType || "-"}</td>

</tr>

<tr>

<td>Role</td>

<td>${roleText}</td>

</tr>

</table>

</div>

<div class="section">

<h3>${sectionHeading}</h3>

<table>

${academicSection}

</table>

</div>

${verificationSection}

<div class="section">

<h3>Account Information</h3>

<table>

<tr>

<td>Account Created</td>

<td>${createdAt}</td>

</tr>

<tr>

<td>Generated On</td>

<td>${today}</td>

</tr>

<tr>

<td>Generated By</td>

<td>Student Notesphere Admin Panel</td>

</tr>

</table>

</div>

<div class="footer">

This report is system generated.<br>

© 2026 Student Notesphere

</div>

</body>

</html>

`);

        printWindow.document.close();

setTimeout(() => {

    printWindow.focus();

    printWindow.print();

    setTimeout(() => {
        printWindow.close();
    }, 500);

}, 700);

    }

    catch (err) {

        console.error(err);

        showMessagePopup(
            "Error ❌",
            "Print failed."
        );

    }

}

function closePhotoPopup(){

    document.getElementById("photoPopup").style.display="none";

}
document.getElementById("photoPopup")
?.addEventListener("click", function(e){

    if(e.target === this){

        closePhotoPopup();

    }

});

function closeUserPopup(){

    document.getElementById("userViewPopup").style.display="none";

}

// ================= FILTER USERS =================
function filterUsers() {
    let searchValue = document.getElementById("userSearch").value.toLowerCase();
    let roleValue = document.getElementById("roleFilter").value;

    let filteredUsers = allUsers.filter(u => {
        let fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        let email = (u.email || "").toLowerCase();
        let department = (u.department || "").toLowerCase();

        let matchesSearch =
            fullName.includes(searchValue) ||
            email.includes(searchValue) ||
            department.includes(searchValue);

        let matchesRole =
            roleValue === "" || u.role === roleValue;

        return matchesSearch && matchesRole;
    });

    displayUsers(filteredUsers);
}

// ================= CHANGE ROLE =================
function changeRole(id, role) {

    pendingUserId = id;
    pendingRole = role;

    document.getElementById("confirmText").innerText =
        `Are you sure you want to change this user's role to ${role}?`;

    document.getElementById("confirmPopup").style.display = "flex";
}

document.getElementById("cancelBtn")?.addEventListener("click", () => {
    document.getElementById("confirmPopup").style.display = "none";
    loadUsers();
});

// ================= DELETE POPUP CANCEL =================

document.getElementById("deleteCancelBtn")?.addEventListener("click", () => {

    document.getElementById("deletePopup").style.display = "none";
    pendingDeleteId=null;

});

// ================= DELETE POPUP CONFIRM =================

document.getElementById("deleteConfirmBtn")?.addEventListener("click", () => {

    deleteUser();

});

document.getElementById("confirmBtn")?.addEventListener("click", async () => {

    document.getElementById("confirmPopup").style.display = "none";

    try {
        let res = await fetch(`${API_BASE_URL}/api/users/role/${pendingUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                role: pendingRole
            })
        });

        let data = await res.json();

        if (!res.ok) {
            showMessagePopup(
                "Error ❌",
                data.message || data.error || "Role update failed"
            );
            loadUsers();
            return;
        }

        showMessagePopup(
            "Success ✅",
            data.message || "Role updated successfully"
        );

        await loadStats();
        await loadUsers();

    } catch (err) {
        console.log(err);

        showMessagePopup(
            "Error ❌",
            "Role update failed"
        );

        loadUsers();
    }
});

// ================= EVENT LISTENERS =================
document.getElementById("userSearch")?.addEventListener("input", filterUsers);
document.getElementById("roleFilter")?.addEventListener("change", filterUsers);


let today = new Date();

document.getElementById("todayDate").innerText = today.toLocaleDateString(
    "en-IN",
    {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }
);

function openAnalyticsBox() {
    document.getElementById("miniAnalytics").style.display = "block";
}

function closeAnalyticsBox() {
    document.getElementById("miniAnalytics").style.display = "none";
}


document.getElementById("messageOkBtn")?.addEventListener("click", () => {
    document.getElementById("messagePopup").style.display = "none";
});

function animateCount(id, finalValue) {

    const element = document.getElementById(id);
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
        } else {
            element.innerText = Math.floor(start);
        }

    }, stepTime);
}

function setLastLogin() {

    const now = new Date();

    document.getElementById("lastLoginText").innerText =
        now.toLocaleString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
}

// ================= DASHBOARD GREETING =================

function setDashboardGreeting() {

    const greeting =
        document.getElementById("dashboardGreeting");

    const hour =
        new Date().getHours();

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

    const adminName =
        user.firstName || "Admin";

    greeting.innerHTML =
        `${message}, ${adminName} 👋`;

}

const activityList = document.getElementById("activityList");

// ================= CLOSE POPUP ON OUTSIDE CLICK =================

document.getElementById("userViewPopup")
?.addEventListener("click", function(e){

    if(e.target === this){

        closeUserPopup();

    }

});


// ================= CLOSE POPUP WITH ESC =================

document.addEventListener("keydown", function(e){

    if(e.key === "Escape"){

        closeUserPopup();

        closePhotoPopup();

    }

});

async function initializeDashboard(){

    await Promise.all([

        loadStats(),
        loadUsers()

    ]);

    const loader = document.getElementById( "dashboardLoader" );

    const content = document.getElementById( "dashboardContent");

    loader.style.opacity = "0";

    setTimeout(()=>{

        loader.style.display = "none";

        content.style.display = "block";

        setTimeout(()=>{

            content.style.opacity = "1";

            document.getElementById( "notificationCount" ).innerText = 3;

            document.getElementById("notificationList").innerHTML = `

            <div class="notification-item">

            👤 New Student Registered

            </div>

            <div class="notification-item">

            📚 New Note Uploaded

            </div>

            <div class="notification-item">

            📝 Quiz Added

            </div>

            `;

        },100);

    },500);

}

// ================= AUTO REFRESH DASHBOARD =================

function startDashboardAutoRefresh() {

    setInterval(async () => {

        try {

            await loadStats();

            await loadUsers();

            console.log("Dashboard Auto Refreshed");

        }
        catch (err) {

            console.log("Auto Refresh Error :", err);

        }

    }, 30000); // 30 Seconds

}

// ================= PENDING TEACHERS =================

function openPendingTeachersPopup() {

    document.getElementById(
        "pendingTeachersPopup"
    ).style.display = "block";

    loadPendingTeachers();

}

function closePendingTeachersPopup() {

    document.getElementById(
        "pendingTeachersPopup"
    ).style.display = "none";

}

async function loadPendingTeachers() {

    try {

        const res = await fetch(
            `${API_BASE_URL}/api/users/pending-teachers`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const teachers = await res.json();

        const box =
            document.getElementById(
                "pendingTeachersList"
            );

        box.innerHTML = "";

        if (teachers.length === 0) {

            box.innerHTML =
                "<p>No pending teacher requests.</p>";

            return;

        }

        teachers.forEach(t => {

            box.innerHTML += `

            <div class="activity-item">

                <strong>

                    ${t.firstName}
                    ${t.lastName}

                </strong>

                <br>

                ${t.email}

                <br><br>

                <div class="teacher-action-buttons">

                    <button
                        class="approve-btn"
                        onclick="approveTeacher('${t._id}')">
                        ✅ Approve
                    </button>

                    <button
                        class="reject-btn"
                        onclick="openRejectPopup('${t._id}')">
                        ❌ Reject
                    </button>

                </div>

            </div>

            `;

        });

    }

    catch (err) {

        console.log(err);

    }

}

// ================= OPEN ACTIVITY =================

function openActivityPopup()
{
    document
        .getElementById("activityPopup")
        .style.display = "block";

    loadRecentActivities();

    loadRecentLogins();
}

// ================= CLOSE ACTIVITY =================

function closeActivityPopup(){

    document
        .getElementById(
            "activityPopup"
        )
        .style.display = "none";
}

// ================= RECENT LOGINS =================

async function loadRecentLogins(){

    try{

        let res = await fetch(

            `${API_BASE_URL}/api/users/recent-logins`,

            {
                headers:{
                    Authorization: `Bearer ${token}`
                }
            }
        );

        let users = await res.json();

        let box =
            document.getElementById(
                "recentLoginUsers"
            );

        box.innerHTML = "";

        users.forEach(user=>{

            box.innerHTML += `

                <div class="login-user">

                    👤 ${user.firstName}
                    ${user.lastName}

                    <br>

                    <small>

                    ${new Date(
                        user.lastLogin
                    ).toLocaleString()}

                    </small>

                </div>

            `;

        });

    }

    catch(err){

        console.log(err);
    }
}

async function loadRecentActivities() {

    try {

        let res = await fetch(
            `${API_BASE_URL}/api/users/recent-activities`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        let data = await res.json();

        let box =
            document.getElementById(
                "activityList"
            );

        box.innerHTML = "";

        data.forEach(item => {

            let date =
                new Date(item.date)
                .toLocaleDateString(
                    "en-IN"
                );

            box.innerHTML += `

                <div class="activity-item">

                    <strong>
                        ${item.type}
                    </strong>

                    - ${item.title}

                    <br>

                    <small>
                        ${date}
                    </small>

                </div>

            `;
        });

    }
    catch(err) {

        console.log(err);

    }
}

async function exportUsers() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/users/export-users`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            throw new Error(
                "Failed to export users"
            );

        }

        const blob =
            await response.blob();

        const url =
            window.URL.createObjectURL(
                blob
            );

        const a =
            document.createElement("a");

        a.href = url;

        a.download =
            "users-report.xlsx";

        document.body.appendChild(a);

        a.click();

        a.remove();

        window.URL.revokeObjectURL(url);

    }

    catch(err) {

        console.log(err);

        showMessagePopup(
            "Error ❌",
            "Export failed"
        );

    }

}

// ================= DOWNLOAD PDF REPORT =================

async function downloadReport() {

    try {

        const response =
            await fetch(

                `${API_BASE_URL}/api/users/dashboard-report`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        const blob =
            await response.blob();

        const url =
            window.URL.createObjectURL(
                blob
            );

        const a =
            document.createElement("a");

        a.href = url;

        a.download =
            "dashboard-report.pdf";

        a.click();

        window.URL.revokeObjectURL(url);

    }

    catch (err) {

        console.log(err);

        showMessagePopup(
            "Error ❌",
            "PDF download failed"
        );

    }

}

// ================= OPEN DEPARTMENT POPUP =================

function openDepartmentPopup(){

    document
        .getElementById(
            "departmentPopup"
        )
        .style.display = "block";

    loadDepartmentStats();

}

// ================= CLOSE DEPARTMENT POPUP =================

function closeDepartmentPopup(){

    document
        .getElementById(
            "departmentPopup"
        )
        .style.display = "none";

}

async function loadDepartmentStats(){

    try{

        let res =
            await fetch(

                `${API_BASE_URL}/api/users/department-stats`,

                {
                    headers:{
                        Authorization:
                        `Bearer ${token}`
                    }
                }

            );

        let data =
            await res.json();

        let box =
            document.getElementById(
                "departmentList"
            );

        box.innerHTML = "";

        let totalUsers = 0;

        data.forEach(dep=>{
            totalUsers += dep.count;
        });

        data.forEach(dep=>{

            let percent =
                ((dep.count / totalUsers) * 100)
                .toFixed(1);

            box.innerHTML += `

                <div class="department-card">

                    <div class="department-header">

                        <strong>
                            ${dep._id || "Unknown"}
                        </strong>

                        <span>
                            ${dep.count} Users
                        </span>

                    </div>

                    <div class="department-bar">

                        <div
                            class="department-fill"
                            style="width:${percent}%">
                        </div>

                    </div>

                    <small>
                        ${percent}% of total users
                    </small>

                </div>

            `;

        });

    }

    catch(err){

        console.log(err);

    }

}

// ================= OPEN NOTES POPUP =================

function openRecentNotesPopup(){

    document
        .getElementById(
            "recentNotesPopup"
        )
        .style.display = "block";

    loadRecentNotes();

}

// ================= CLOSE NOTES POPUP =================

function closeRecentNotesPopup(){

    document
        .getElementById(
            "recentNotesPopup"
        )
        .style.display = "none";

}

// ================= NOTIFICATION =================

function toggleNotificationPopup(){

    let popup =
        document.getElementById(
            "notificationPopup"
        );

    if(
        popup.style.display==="block"
    ){

        popup.style.display="none";

    }

    else{

        popup.style.display="block";

    }

}

function closeNotificationPopup(){

    document
        .getElementById(
            "notificationPopup"
        )
        .style.display="none";

}

//================= LOAD RECENT NOTES =================

async function loadRecentNotes(){

    try{

        let res =
            await fetch(

                `${API_BASE_URL}/api/notes/recent`,

                {
                    headers:{
                        Authorization:
                        `Bearer ${token}`
                    }
                }

            );

        let notes =
            await res.json();

        let box =
            document.getElementById(
                "recentNotesList"
            );

        box.innerHTML = "";

        notes.forEach(note=>{

            box.innerHTML += `

                <div class="activity-item">

                    <strong>

                        📚 ${note.title}

                    </strong>

                    <br>

                    <small>

                    ${new Date(
                        note.createdAt
                    ).toLocaleDateString()}

                    </small>

                </div>

            `;

        });

    }

    catch(err){

        console.log(err);

    }

}

document.addEventListener("click", function(e){

    let menu = document.getElementById("actionMenu");

    if(
        !menu.contains(e.target) &&
        !e.target.closest(".action-btn")
    ){
        menu.style.display = "none";
    }

});

// ================= APPROVE TEACHER =================
async function approveTeacher(id){

    try{

        let res = await fetch(
            `${API_BASE_URL}/api/users/approve-teacher/${id}`,
            {
                method:"PUT",
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

        let data = await res.json();

        if(!res.ok){

            showMessagePopup(
                "Error ❌",
                data.message
            );

            return;
        }

        showMessagePopup(
            "Success ✅",
            "Teacher Approved Successfully"
        );

        await loadUsers();

        await loadStats();

        await loadPendingTeachers();

    }
    catch(err){

        showMessagePopup(
            "Error ❌",
            "Approval Failed"
        );

    }

}

// ================= OPEN REJECT POPUP =================
function openRejectPopup(id){

    rejectTeacherId = id;

    document.getElementById("rejectReason").value = "";

    document.getElementById("rejectPopup").style.display = "flex";

}

// ================= CLOSE REJECT POPUP =================
function closeRejectPopup(){

    document.getElementById("rejectPopup").style.display = "none";

}

// ================= REJECT TEACHER =================

async function submitRejectTeacher(){

    const reason =
        document
        .getElementById("rejectReason")
        .value
        .trim();
    
    console.log("Reject Teacher ID:", rejectTeacherId);
    console.log("Reason:", reason);

    if(reason===""){

        showMessagePopup(
            "Warning ⚠",
            "Please enter rejection reason."
        );

        return;

    }

    try{

        let res = await fetch(

            `${API_BASE_URL}/api/users/reject-teacher/${rejectTeacherId}`,

            {

                method:"PUT",

                headers:{

                    "Content-Type":"application/json",

                    Authorization:`Bearer ${token}`

                },

                body:JSON.stringify({

                    reason:reason

                })

            }

        );
        console.log("Status:", res.status);

        let data = await res.json();

        console.log(data);

        if(!res.ok){

            showMessagePopup(
                "Error ❌",
                data.message
            );

            return;

        }

        closeRejectPopup();

        showMessagePopup(

            "Success ✅",

            "Teacher Rejected Successfully"

        );

        await loadPendingTeachers();
        await loadUsers();
        await loadStats();

    }

    catch(err){

        console.log(err);

    }

}
// ================= VIEW TEACHER DOCUMENT =================

function viewTeacherDocument(url){

    if(!url){

        showMessagePopup(
            "No Document",
            "Teacher has not uploaded any ID Proof."
        );

        return;

    }

    window.open(url,"_blank");

}

// ================= INIT =================
setDashboardGreeting();
setLastLogin();
initializeDashboard();
loadRecentLogins();
startDashboardAutoRefresh();