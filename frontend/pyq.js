const user = JSON.parse(localStorage.getItem("loggedInUser"));
const token = localStorage.getItem("token");

function checkPYQLogin(event) {
    if (!user || !token) {
        event.preventDefault();
        showWarningPopup("Please login first to view or download PYQ");
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

// Upload section only for Admin/Teacher
if (user && token && (user.role === "admin" || user.role === "teacher")) {
    const uploadSection = document.getElementById("uploadSection");
    if (uploadSection) uploadSection.style.display = "block";
}

// ================= COURSE WISE DEPARTMENT LOAD =================
document.getElementById("course")?.addEventListener("change", loadDepartments);
document.getElementById("uploadCourse")?.addEventListener("change", loadUploadDepartments);

// Search section departments
async function loadDepartments() {
    const course = document.getElementById("course").value;
    const departmentSelect = document.getElementById("department");

    departmentSelect.innerHTML = `<option value="">Select Department</option>`;

    if (!course) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/departments/${course}`);
        const departments = await res.json();

        departments.forEach(dep => {
            departmentSelect.innerHTML += `<option value="${dep}">${dep}</option>`;
        });
    } catch (err) {
        console.log(err);
    }
}

// Upload section departments suggestion
async function loadUploadDepartments() {
    const course = document.getElementById("uploadCourse").value.trim();
    const departmentInput = document.getElementById("uploadDepartment");

    let list = document.getElementById("uploadDepartmentOptions");

    if (!list) {
        list = document.createElement("datalist");
        list.id = "uploadDepartmentOptions";
        document.body.appendChild(list);
        departmentInput.setAttribute("list", "uploadDepartmentOptions");
    }

    list.innerHTML = "";

    if (!course) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/departments/${course}`);
        const departments = await res.json();

        departments.forEach(dep => {
            list.innerHTML += `<option value="${dep}">`;
        });
    } catch (err) {
        console.log(err);
    }
}

// ================= SEMESTER OPTIONS =================
const semesterSelect = document.getElementById("semester");
const semesters = ["Sem1", "Sem2", "Sem3", "Sem4", "Sem5", "Sem6", "Sem7", "Sem8"];

if (semesterSelect) {
    semesters.forEach(sem => {
        semesterSelect.innerHTML += `<option value="${sem}">${sem}</option>`;
    });
}

// ================= UPLOAD PYQ =================
document.getElementById("pyqForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!user || !token) {
        showWarningPopup("Please login first to view or download PYQ");
        return;
    }

    const course = document.getElementById("uploadCourse").value.trim();
    const department = document.getElementById("uploadDepartment").value.trim();
    const semester = document.getElementById("uploadSemester").value.trim();
    const subject = document.getElementById("uploadSubject").value.trim();
    const year = document.getElementById("uploadYear").value.trim();
    const examType = document.getElementById("uploadExamType").value;
    const description = document.getElementById("uploadDescription").value.trim();
    const file = document.getElementById("uploadFile").files[0];

    if (!course || !department || !semester || !subject || !year || !examType || !file) {
        showWarningPopup("Please fill all required fields");
        return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
        showWarningPopup("Only PDF, JPG and PNG files are allowed");
        return;
    }

    const formData = new FormData();
    formData.append("course", course);
    formData.append("department", department);
    formData.append("semester", semester);
    formData.append("subject", subject);
    formData.append("year", year);
    formData.append("examType", examType);
    formData.append("description", description);
    formData.append("file", file);

    const btn = this.querySelector("button");
    btn.disabled = true;
    btn.innerText = "Uploading...";

    try {
        const res = await fetch(`${API_BASE_URL}/api/pyq/upload`, {
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
                data.message || data.error || "PYQ upload failed"
            );

            btn.disabled = false;
            btn.innerText = "Upload PYQ";
            return;
        }

        await showUploadPopup(
            "Success ✅",
            data.message || "PYQ uploaded successfully"
        );
        return;

    } catch (err) {
        console.log(err);

        btn.disabled = false;
        btn.innerText = "Upload PYQ";

        await showErrorPopup("PYQ upload failed");
    }
});

// ================= SEARCH PYQ =================
async function searchPYQ() {
    const course = document.getElementById("course").value;
    const department = document.getElementById("department").value;
    const semester = document.getElementById("semester").value;
    const subject = document.getElementById("subject").value.trim();
    const year = document.getElementById("year").value.trim();
    const examType = document.getElementById("examType").value;

    let url = `${API_BASE_URL}/api/pyq/search?`;

    if (course) url += `course=${encodeURIComponent(course)}&`;
    if (department) url += `department=${encodeURIComponent(department)}&`;
    if (semester) url += `semester=${encodeURIComponent(semester)}&`;
    if (subject) url += `subject=${encodeURIComponent(subject)}&`;
    if (year) url += `year=${encodeURIComponent(year)}&`;
    if (examType) url += `examType=${encodeURIComponent(examType)}&`;

    try {
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};

        const res = await fetch(url, { headers });

        const pyqs = await res.json();

        displayPYQ(pyqs);

    } catch (err) {
        console.log(err);
        document.getElementById("pyqList").innerHTML =
            "<p>Error loading PYQs.</p>";
    }
}

// ================= DISPLAY PYQ =================
function displayPYQ(pyqs) {
    const pyqList = document.getElementById("pyqList");
    pyqList.innerHTML = "";

    if (!Array.isArray(pyqs) || pyqs.length === 0) {
        pyqList.innerHTML = "<p>No PYQ found.</p>";
        return;
    }

    pyqs.forEach(pyq => {
        pyqList.innerHTML += `
            <div class="pyq-card">
                <h3>${pyq.subject} - ${pyq.year}</h3>

                <p><strong>Course:</strong> ${pyq.course}</p>
                <p><strong>Department:</strong> ${pyq.department}</p>
                <p><strong>Semester:</strong> ${pyq.semester}</p>
                <p><strong>Exam:</strong> ${pyq.examType}</p>

                ${pyq.description ? `<p><strong>Description:</strong> ${pyq.description}</p>` : ""}


                <div class="pyq-actions">

    <a href="${pyq.file}"
       target="_blank"
       onclick="return checkPYQLogin(event)"
       class="view-btn">
        👁 View
    </a>

    <button
        class="download-btn"
        onclick="downloadPYQ('${pyq._id}')">
        ⬇ Download
    </button>



                ${
                    user &&
                    token &&
                    (
                        user.role === "admin" ||
                        (
                            user.role === "teacher" &&
                            pyq.uploadedBy &&
                            (
                                pyq.uploadedBy._id === user._id ||
                                pyq.uploadedBy === user._id
                            )
                        )
                    )
                    ? `<button class="delete-pyq-btn" onclick="deletePYQ('${pyq._id}')">Delete</button>`
                    : ""
                }

                </div>
            </div>
        `;
    });
}

// ================= DELETE PYQ =================
async function deletePYQ(id) {

        const confirmDelete = await showConfirmPopup(
        "Delete PYQ?",
        "Are you sure you want to delete this PYQ?"
    );

    if (!confirmDelete) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/pyq/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            showErrorPopup(data.message || data.error || "PYQ delete failed");
            return;
        }

        await showSuccessPopup(data.message || "PYQ deleted successfully");
        searchPYQ();

    } catch (err) {
        console.log(err);
        showErrorPopup("PYQ delete failed");
    }
}

// ================= INITIAL LOAD =================
searchPYQ();

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

// ================= FUTURE READY YEAR DROPDOWN =================

function loadYearDropdown(id) {
    const select = document.getElementById(id);

    if (!select) return;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear + 1;
    const endYear = 2021;

    for (let year = startYear; year >= endYear; year--) {
        const option = document.createElement("option");

        option.value = year;
        option.textContent = year;

        select.appendChild(option);
    }
}

// ================= DOWNLOAD PYQ =================

async function downloadPYQ(id) {

    if (!user || !token) {
        showWarningPopup("Please login first to download PYQ");
        return;
    }

    if (user.isProfileComplete === false) {
        showWarningPopup("Please complete your profile first");

        setTimeout(() => {
            window.location.href = "profile.html";
        }, 2000);

        return;
    }

    window.open(
        `${API_BASE_URL}/api/pyq/download/${id}`,
        "_blank"
    );
}

loadYearDropdown("year");
loadYearDropdown("uploadYear");