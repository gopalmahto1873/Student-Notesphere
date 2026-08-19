// ================= LOGIN CHECK =================

const user = JSON.parse(localStorage.getItem("loggedInUser"));
const token = localStorage.getItem("token");


// ================= CHECK LOGIN BEFORE VIEW / DOWNLOAD =================

function checkLogin(event) {

    if (!user || !token) {
        event.preventDefault();
        showWarningPopup("Please login first to view or download notes");
        return false;
    }

    if (user.isProfileComplete === false) {
        event.preventDefault();
        showWarningPopup("Please complete your profile first");

        setTimeout(() => {window.location.href = "profile.html";}, 2000);
        return false;
    }

    return true;
}

// ================= INITIAL STATE =================
document.getElementById("notesList").innerHTML = "<p>Loading notes...</p>";

const canUpload = user && (user.role === "admin" || user.role === "teacher");

// ================= LOGIN UI =================
if (!canUpload) {
    // Student/User layout
    document.querySelector(".middle-panel").style.display = "block";
    document.querySelector(".upload-section").style.display = "none";
    document.getElementById("studentHelpBox").style.display = "block";

    document.querySelector(".notes-dashboard").style.gridTemplateColumns =
        "280px 360px 1fr";

} else {
    // Teacher/Admin layout
    document.querySelector(".middle-panel").style.display = "block";
    document.querySelector(".upload-section").style.display = "block";
    document.getElementById("studentHelpBox").style.display = "none";

    document.querySelector(".notes-dashboard").style.gridTemplateColumns =
        "280px 380px 1fr";
}

// ================= COURSE SELECT =================
async function selectCourse(course) {
    document.getElementById("selectedCourse").value = course;
    document.getElementById("selectedDepartment").value = "";
    document.getElementById("selectedSubject").value = "";

    document.getElementById("selectedTitle").innerText =
        `${course} Notes`;

    document.getElementById("notesList").innerHTML =
        "<p>Loading departments...</p>";

    const departmentSection = document.getElementById("departmentSection");
    const departmentCards = document.getElementById("departmentCards");
    const departmentHeading = document.getElementById("departmentHeading");

    departmentSection.style.display = "block";
    document.getElementById("middleSubjectCards").innerHTML =
    "<p>Select a department to view subjects.</p>";

    departmentHeading.innerText = `Select Department for ${course}`;

    try {
        const res = await fetch(
            `${API_BASE_URL}/api/notes/departments/${course}`
        );

        const departments = await res.json();

        departmentCards.innerHTML = "";

        if (departments.length === 0) {
            showErrorPopup("Error loading subjects");
        }

        departments.forEach(dep => {
            departmentCards.innerHTML += `
                <div class="department-card"
                    onclick="selectDepartment('${dep}')">
                    <h3>${dep}</h3>
                    <p>View ${dep} notes</p>
                </div>
            `;
        });

        // course notes भी show होंगे
        searchNotes();

    } catch (err) {
        console.log(err);

        showErrorPopup("Error loading departments");
    }
}

// ================= DEPARTMENT SELECT =================
async function selectDepartment(department) {
    document.getElementById("selectedDepartment").value = department;
    document.getElementById("selectedSubject").value = "";

    const course = document.getElementById("selectedCourse").value;

    document.getElementById("selectedTitle").innerText =
        `${course} - ${department} Notes`;

    searchNotes();

    const leftSubjectSection = document.getElementById("subjectSection");
    const leftSubjectCards = document.getElementById("subjectCards");
    const leftSubjectHeading = document.getElementById("subjectHeading");

    const middleSubjectCards = document.getElementById("middleSubjectCards");
    const middleSubjectHeading = document.getElementById("middleSubjectHeading");

    if (leftSubjectSection) {
        leftSubjectSection.style.display = "block";
    }

    if (leftSubjectHeading) {
        leftSubjectHeading.innerText = `Select Subject for ${department}`;
    }

    if (leftSubjectCards) {
        leftSubjectCards.innerHTML = "<p>Loading subjects...</p>";
    }

    if (middleSubjectHeading) {
        middleSubjectHeading.innerText = `Select Subject for ${department}`;
    }

    if (middleSubjectCards) {
        middleSubjectCards.innerHTML = "<p>Loading subjects...</p>";
    }

    try {
        const res = await fetch(
            `${API_BASE_URL}/api/notes/subjects/${department}`
        );

        const subjects = await res.json();

        if (leftSubjectCards) leftSubjectCards.innerHTML = "";
        if (middleSubjectCards) middleSubjectCards.innerHTML = "";

        if (!Array.isArray(subjects) || subjects.length === 0) {
            if (leftSubjectCards) {
                leftSubjectCards.innerHTML = "<p>No subjects found.</p>";
            }

            if (middleSubjectCards) {
                middleSubjectCards.innerHTML = "<p>No subjects found.</p>";
            }

            return;
        }

        subjects.forEach(subject => {
            const card = `
                <div class="department-card" onclick="selectSubject('${subject}')">
                    <h3>${subject}</h3>
                    <p>View ${subject} notes</p>
                </div>
            `;

            if (leftSubjectCards) leftSubjectCards.innerHTML += card;
            if (middleSubjectCards) middleSubjectCards.innerHTML += card;
        });

    } catch (err) {
        console.log(err);

        if (leftSubjectCards) {
            leftSubjectCards.innerHTML = "<p>Error loading subjects.</p>";
        }

        if (middleSubjectCards) {
            middleSubjectCards.innerHTML = "<p>Error loading subjects.</p>";
        }
    }
}

// ================= SUBJECT SELECT =================
function selectSubject(subject) {
    document.getElementById("selectedSubject").value = subject;

    const course = document.getElementById("selectedCourse").value;
    const department = document.getElementById("selectedDepartment").value;

    document.getElementById("selectedTitle").innerText =
        `${course} - ${department} - ${subject} Notes`;

    searchNotes();
}

// ================= LOAD / SEARCH NOTES =================
async function searchNotes() {
    const course = document.getElementById("selectedCourse").value;
    const department = document.getElementById("selectedDepartment").value;
    const subject = document.getElementById("selectedSubject").value;
    const search = document.getElementById("searchBox").value.trim().toLowerCase();

    let url = `${API_BASE_URL}/api/notes/search?`;

    if (course) url += `course=${encodeURIComponent(course)}&`;
    if (department) url += `department=${encodeURIComponent(department)}&`;
    if (subject) url += `subject=${encodeURIComponent(subject)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    try {
        document.getElementById("notesList").innerHTML = "<p>Loading notes...</p>";

        const res = await fetch(url);
        const notes = await res.json();

        displayNotes(notes);

    } catch (err) {
        console.log(err);
        document.getElementById("notesList").innerHTML =
            "<p>Error loading notes.</p>";
    }
}

// ================= DISPLAY NOTES =================
function displayNotes(notes) {
    const container = document.getElementById("notesList");
    container.innerHTML = "";

    if (!Array.isArray(notes) || notes.length === 0) {
        container.innerHTML = "<p>No notes found.</p>";
        return;
    }

    notes.forEach(note => {
        const uploaderId = note.uploadedBy?._id || note.uploadedBy;

        const isOwner =
            user &&
            uploaderId &&
            uploaderId.toString() === user._id;

        const canEdit =
            user &&
            (user.role === "admin" || (user.role === "teacher" && isOwner));

        const canDelete =
            user &&
            (user.role === "admin" || (user.role === "teacher" && isOwner));

        const fileIcon = getFileIcon(note.fileType);

        const uploadedDate = note.createdAt
            ? new Date(note.createdAt).toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            )
            : "N/A";

        const fileSize = note.fileSize
            ? (note.fileSize / 1024 / 1024).toFixed(2) + " MB"
            : "N/A";

        let fileBadge = "📁 FILE";

        if (note.fileType === "pdf") {
            fileBadge = "📕";
        }
        else if (note.fileType === "image") {
            fileBadge = "🖼️";
        }
        else if (note.fileType === "text") {
            fileBadge = "📄";
        }

        const div = document.createElement("div");
        div.className = "note";

        div.innerHTML = `
        <div class="note-info">

            <h3>
                ${fileBadge} ${note.title}
            </h3>

            <div class="note-tags">

                ${note.course
                    ? `<span class="tag course-tag">${note.course}</span>`
                    : ""}

                ${note.department
                    ? `<span class="tag department-tag">${note.department}</span>`
                    : ""}

                ${note.subject
                    ? `<span class="tag subject-tag">${note.subject}</span>`
                    : ""}

                ${note.unit
                    ? `<span class="tag unit-tag">${note.unit}</span>`
                    : ""}

                ${note.topic
                    ? `<span class="tag topic-tag">${note.topic}</span>`
                    : ""}
            </div>

            <p>
                <strong>Uploaded By :</strong>
                ${
                    note.uploadedBy
                    ? `${note.uploadedBy.firstName || ""}
                    ${note.uploadedBy.lastName || ""}`
                    : "Unknown"
                }
            </p>

            <p>
                <strong>Uploaded On :</strong>
                ${uploadedDate}
            </p>

            <p>
                <strong>File Size :</strong>
                ${fileSize}
            </p>

            <p>
                <strong>Downloads :</strong>
                ${note.downloadCount || 0}
            </p>

        </div>

        <div class="note-actions">

           <a
                class="view-btn"
                href="${getFullFileUrl(note.fileUrl)}"
                target="_blank"
                onclick="return checkLogin(event)"
            >
                View
            </a>

            <button
                class="download-btn"
                onclick="downloadNote('${note._id}')"
            >
                Download
            </button>

            ${
                canEdit
                ? `
                <button
                    class="edit-btn"
                    onclick="editNote(
                        '${note._id}',
                        '${note.course}',
                        '${note.department}',
                        '${note.subject}',
                        '${note.semester || ""}',
                        '${note.title}'
                    )"
                >
                    Edit
                </button>
                `
                : ""
            }

            ${
                canDelete
                ? `
                <button
                    class="delete-btn"
                    onclick="deleteNote('${note._id}')"
                >
                    Delete
                </button>
                `
                : ""
            }

        </div>
        `;

        container.appendChild(div);
    });
}

// ================= FILE ICON =================
function getFileIcon(fileType) {
    if (fileType === "pdf") return "📕";
    if (fileType === "image") return "🖼️";
    if (fileType === "text") return "📄";
    return "📁";
}

// ================= UPLOAD NOTE =================
async function uploadNote(e) {
    e.preventDefault();

    if (!token) {
        showWarningPopup("Please login first to view or download notes");
        return;
    }

    const course = document.getElementById("course").value;
    const department = document.getElementById("department").value;
    const subject = document.getElementById("subject").value.trim();
    const semester = document.getElementById("semester").value;
    const title = document.getElementById("title").value.trim();
    const file = document.getElementById("file").files[0];

    if (!course) {
        showWarningPopup("Please select course type");
        return;
    }

    if (!department) {
        showWarningPopup("Please select department");
        return;
    }

    if (!subject) {
        showWarningPopup("Please enter subject");
        return;
    }

    if (!title) {
        showWarningPopup("Please enter note title");
        return;
    }

    if (!file) {
        showWarningPopup("Please choose a file");
        return;
    }

    const allowed = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/plain"
    ];

    if (!allowed.includes(file.type)) {
        showWarningPopup("Only PDF, JPG, PNG, TXT files allowed");
        return;
    }

    const formData = new FormData();
    formData.append("course", course);
    formData.append("department", department);
    formData.append("subject", subject);
    formData.append("semester", semester);
    formData.append("title", title);
    formData.append("file", file);

    const btn = document.querySelector("#uploadForm button[type='submit']");

    btn.disabled = true;
    btn.innerText = "Uploading...";

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/add`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        let data = {};

        try {
            data = await res.json();
        } catch (e) {
            data = {};
        }

        if (!res.ok) {
            await showErrorPopup(
                data.message || data.error || "Upload failed"
            );

            btn.disabled = false;
            btn.innerText = "Upload";
            return;
        }

        await showUploadPopup(
            "Success ✅",
            data.message || "Note uploaded successfully"
        );
        btn.disabled = false;
        btn.innerText = "Upload";
        document.getElementById("uploadForm").reset();
        searchNotes();
        return false;


    } catch (err) {
        console.log(err);

        btn.disabled = false;
        btn.innerText = "Upload";

        await showErrorPopup("Upload failed");
    }
}

// ================= OPEN EDIT NOTE POPUP =================

function editNote(
    id,
    oldCourse,
    oldDepartment,
    oldSubject,
    oldSemester,
    oldTitle
) {

    document.getElementById("editNoteId").value = id;

    document.getElementById("editCourse").value =
        oldCourse;

    document.getElementById("editDepartment").value =
        oldDepartment;

    document.getElementById("editSubject").value =
        oldSubject;

    document.getElementById("editSemester").value =
        oldSemester;

    document.getElementById("editTitle").value =
        oldTitle;

    document.getElementById("editNoteOverlay").style.display =
        "flex";
}

// ================= CLOSE EDIT POPUP =================

function closeEditNotePopup() {

    document.getElementById("editNoteOverlay").style.display =
        "none";
}

// ================= SAVE EDITED NOTE =================

async function saveEditedNote() {

    const id = document.getElementById("editNoteId").value;

    const course = document.getElementById("editCourse").value;

    const department = document.getElementById("editDepartment").value.trim();

    const subject = document.getElementById("editSubject").value.trim();

    const semester = document.getElementById("editSemester").value;

    const title = document.getElementById("editTitle").value.trim();

    if (!course || !department || !subject || !title) {

        showWarningPopup(
            "Please fill all required fields"
        );

        return;
    }

    try {

        const res = await fetch(
            `${API_BASE_URL}/api/notes/update/${id}`,
            {
                method:"PUT",

                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },

                body:JSON.stringify({
                    course,
                    department,
                    subject,
                    semester,
                    title
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {

            showErrorPopup(
                data.message || data.error || "Update failed"
            );

            return;
        }

        showSuccessPopup(
            data.message || "Note updated successfully"
        );

        closeEditNotePopup();

        searchNotes();

    } catch(err){

        console.log(err);

        showErrorPopup("Update failed");
    }
}

// ================= DELETE NOTE =================
async function deleteNote(id) {
    const confirmDelete = await showConfirmPopup(
        "Delete Note",
        "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            showErrorPopup(data.message || data.error || "Delete failed");
            return;
        }

        await showSuccessPopup(data.message || "Note deleted successfully");
        searchNotes();

    } catch (err) {
        console.log(err);
        showErrorPopup("Delete failed");
    }
}

// ================= DYNAMIC DEPARTMENT SUGGESTIONS =================
document.getElementById("course")?.addEventListener("change", async function () {

    const course = this.value;
    const list = document.getElementById("departmentOptions");

    list.innerHTML = "";

    if (!course) return;

    try {
        const res = await fetch(
            `${API_BASE_URL}/api/notes/departments/${course}`
        );

        const departments = await res.json();

        departments.forEach(dep => {
            list.innerHTML += `<option value="${dep}">`;
        });

    } catch (err) {
        console.log(err);
    }
});

// ================= SUBJECT SUGGESTIONS =================
document.getElementById("department")?.addEventListener("change", function () {

    const department = this.value;
    const subjectList = document.getElementById("subjectOptions");

    subjectList.innerHTML = "";

    const data = {
        BCA: [
            "Java",
            "DBMS",
            "Operating System",
            "Computer Network",
            "C Programming"
        ],

        BBA: [
            "Accounting",
            "Business Management",
            "Economics",
            "Marketing"
        ],

        MCA: [
            "Advanced Java",
            "Data Structure",
            "Software Engineering",
            "AI",
            "Cloud Computing"
        ],

        MBA: [
            "Finance",
            "HR Management",
            "Marketing Management",
            "Business Analytics"
        ]
    };

    const subjects = data[department] || [];

    subjects.forEach(sub => {
        subjectList.innerHTML += `
            <option value="${sub}">
        `;
    });
});

// ================= LIVE SEARCH =================
let searchTimer;

document.getElementById("searchBox").addEventListener("keyup", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        searchNotes();
    }, 400); // 400ms delay (smooth UX)
});

function filterTag(value) {
    document.getElementById("searchBox").value = value;
    searchNotes();
}

// ================= INITIAL LOAD ALL NOTES =================
searchNotes();

// ================= UPLOAD SUCCESS POPUP =================

function showUploadPopup(title, message) {
    const overlay = document.getElementById("uploadPopupOverlay");
    const titleBox = document.getElementById("uploadPopupTitle");
    const messageBox = document.getElementById("uploadPopupMessage");
    const okBtn = document.getElementById("uploadPopupOkBtn");

    if (!overlay || !titleBox || !messageBox || !okBtn) {
        alert(message);
        return Promise.resolve(true);
    }

    titleBox.innerText = title;
    messageBox.innerText = message;

    overlay.style.display = "flex";

    return new Promise((resolve) => {
        okBtn.onclick = function () {

    overlay.style.display = "none";

    resolve(true);

    // popup close ke baad refresh
    setTimeout(() => {
        location.reload();
    }, 200);
};
    });
}

async function downloadNote(noteId) {

    if (!user || !token) {
        showWarningPopup("Please login first to download notes");
        return;
    }

    try {
        const res = await fetch(
            `${API_BASE_URL}/api/notes/file/${noteId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!res.ok) {
            showErrorPopup("Download failed");
            return;
        }

        const blob = await res.blob();

        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "note-file";
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        searchNotes();

    } catch (err) {
        console.log(err);
        showErrorPopup("Download failed");
    }
}

function getFullFileUrl(fileUrl) {
    if (!fileUrl) return "#";

    return fileUrl;
}