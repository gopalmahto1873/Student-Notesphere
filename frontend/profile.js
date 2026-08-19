function normalizeText(text) {

    if (!text) return "";

    const upperWords = [
        "UG",
        "PG",
        "BCA",
        "BBA",
        "MCA",
        "MBA",
        "DBMS",
        "OS",
        "AI",
        "IT",
        "HR"
    ];

    return text
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map(word => {

            const upper = word.toUpperCase();

            if (upperWords.includes(upper)) {
                return upper;
            }

            return (
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase()
            );

        })
        .join(" ");
}

// ================= GET LOGGED IN USER =================
let user = JSON.parse(localStorage.getItem("loggedInUser"));
let token = localStorage.getItem("token");

if (!user || !token) {

    showMessagePopup(
        "Login Required 🔒",
        "Please login first."
    );

    setTimeout(() => {
        window.location.href = "login.html";
    },1500);

}

// ================= LOAD PROFILE =================

async function loadProfile() {
    console.log("Load Profile Called");

    try {

        console.log("User :", user);
console.log("Token :", token);

        const res = await fetch(
            `${API_BASE_URL}/api/users/profile/${user._id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await res.json();
        console.log("Profile Data :", data);


        if (!res.ok) {

            showMessagePopup(
                "Error ❌",
                data.message || "Unable to load profile."
            );

            return;
        }

        // ================= BASIC DETAILS =================

        document.getElementById("firstName").value =
            data.firstName || "";

        document.getElementById("middleName").value =
            data.middleName || "";

        document.getElementById("lastName").value =
            data.lastName || "";

        document.getElementById("dob").value =
            data.dob
                ? data.dob.substring(0,10)
                : "";



        // ================= REGULAR =================

        document.getElementById("university").value =
            data.university || "";
            
        document.getElementById("department").value =
            data.department || "";

        document.getElementById("session").value =
            data.session || "";



        // ================= EX STUDENT =================

        document.getElementById("lastSession").value =
            data.lastSession || "";

        document.getElementById("lastUniversity").value =
            data.lastUniversity || "";

        document.getElementById("passingYear").value =
            data.passingYear || "";

        document.getElementById("currentStatus").value =
            data.currentStatus || "";



        // ================= STUDENT TYPE =================

        const radio = document.querySelector(
            `input[name="studentType"][value="${data.studentType}"]`
        );

        if (radio) {

            radio.checked = true;

        }

        // Register page wala function call karo
        toggleStudentFields();

        // ================= ROLE BASED SECTIONS =================

        const studentSection = document.getElementById("studentSection");
        const teacherSection = document.getElementById("teacherSection");

        if (data.role === "student") {

            studentSection.style.display = "block";
            teacherSection.style.display = "none";

        }
        else if (data.role === "teacher") {

            studentSection.style.display = "none";
            teacherSection.style.display = "block";

            document.getElementById("qualification").value = data.qualification || "";

            document.getElementById("subject").value = data.subject || "";

            document.getElementById("experience").value = data.experience || "";

            document.getElementById("institution").value = data.institution || "";

            document.getElementById("designation").value = data.designation || "";

            // ================= TEACHER APPROVAL STATUS =================

            const approvalStatus = document.getElementById("approvalStatus");

            const reasonBox = document.getElementById("reasonBox");

            const rejectionReason = document.getElementById("rejectionReason");

            approvalStatus.textContent = data.approvalStatus || "pending";

            if (data.approvalStatus === "approved") {

                approvalStatus.style.color = "green";

                reasonBox.style.display = "none";

            }

            else if (data.approvalStatus === "pending") {

                approvalStatus.style.color = "orange";

                reasonBox.style.display = "none";

            }

            else if (data.approvalStatus === "rejected") {

                approvalStatus.style.color = "red";

                reasonBox.style.display = "block";

                rejectionReason.textContent =
                    data.rejectionReason || "No reason provided.";

            }

            const idProofLink = document.getElementById("idProofLink");

            if (data.idProof) {

                idProofLink.href =
                    data.idProof.startsWith("http")
                        ? data.idProof
                        : `${API_BASE_URL}${data.idProof}`;

                idProofLink.style.display = "inline-block";

            }
            else {

                idProofLink.style.display = "none";

            }

        }


        // ================= ACCOUNT INFORMATION =================

        document.getElementById("email").value =
            data.email || "";

        document.getElementById("customId").value =
            data.customId || "";

        document.getElementById("role").value =
            data.role || "";

        document.getElementById("createdAt").value =
            data.createdAt
                ? new Date(data.createdAt).toLocaleDateString("en-IN")
                : "";


        // ================= PHOTO =================

        document.getElementById("profileImage").src =
            data.photo
                ? (
                    data.photo.startsWith("http")
                    ? data.photo
                    : `${API_BASE_URL}${data.photo}`
                )
                : "logo.png";



        // ================= LOCAL STORAGE =================

        localStorage.setItem(
            "loggedInUser",
            JSON.stringify(data)
        );

        user = data;



        // ================= NAVBAR PHOTO =================

        const navProfile =
            document.getElementById("profileIcon");

        if (navProfile) {

            navProfile.src =
                data.photo
                    ? (
                        data.photo.startsWith("http")
                        ? data.photo
                        : `${API_BASE_URL}${data.photo}`
                    )
                    : "logo.png";

        }

    }

    catch (err) {

        console.error("Load Profile Error :", err);

        showMessagePopup(
            "Server Error ❌",
            err.message
        );

    }

}

// ================= TOGGLE STUDENT FIELDS =================

function toggleStudentFields() {

    const selectedType = document.querySelector(
        'input[name="studentType"]:checked'
    )?.value;

    const regularFields =
        document.getElementById("regularFields");

    const exStudentFields =
        document.getElementById("exStudentFields");

    if (selectedType === "Regular") {

        regularFields.style.display = "block";
        exStudentFields.style.display = "none";

    }

    else if (selectedType === "Ex-Student") {

        regularFields.style.display = "none";
        exStudentFields.style.display = "block";

    }

}

// ================= RADIO CHANGE =================

document
.querySelectorAll('input[name="studentType"]')
.forEach(radio => {

    radio.addEventListener("change", toggleStudentFields);

});



// ================= UPDATE PROFILE PHOTO =================

async function updateProfilePhoto() {
    let photoInput = document.getElementById("newProfilePhoto");
    let photo = photoInput.files[0];

    if (!photo) {
        showMessagePopup(
            "Photo Required 📷",
            "Please select a profile photo."
        );
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp"
    ];

    if (!allowedTypes.includes(photo.type)) {
        showMessagePopup(
            "Invalid Image ❌",
            "Only JPG, JPEG, PNG and WEBP images are allowed."
        );
        return;
    }

    if (photo.size > 2 * 1024 * 1024) {
        showMessagePopup(
            "Large Image ⚠",
            "Image size should be less than 2 MB."
        );
        return;
    }

    let formData = new FormData();
    formData.append("photo", photo);

    try {
        let res = await fetch(`${API_BASE_URL}/api/users/profile/photo/${user._id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        let data = await res.json();

        if (!res.ok) {
            showMessagePopup(
                "Update Failed ❌",
                data.message || data.error || "Photo update failed."
            );
            return;
        }

        showMessagePopup(
            "Photo Updated 📷",
            "Your profile photo has been updated successfully."
        );

        const updatedUser = data.user || data;

        document.getElementById("profileImage").src =
            updatedUser.photo
                ? (
                    updatedUser.photo.startsWith("http")
                        ? updatedUser.photo
                        : `${API_BASE_URL}${updatedUser.photo}`
                )
                : "logo.png";

        localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
        user = updatedUser;

        photoInput.value = "";

    } catch (err) {
        console.log(err);
        showMessagePopup(
            "Server Error ❌",
            "Unable to update profile photo."
        );
    }
}

// ================= UPDATE TEACHER ID PROOF =================

async function updateTeacherIdProof() {

    const fileInput = document.getElementById("newIdProof");

    const file = fileInput.files[0];

    if (!file) {

        showMessagePopup(
            "ID Proof",
            "Please select an ID Proof."
        );

        return;

    }

    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "application/pdf"

    ];

    if (!allowedTypes.includes(file.type)) {

        showMessagePopup(
            "Invalid File ❌",
            "Only PDF, JPG and PNG files are allowed."
        );
        return;

    }

    if (file.size > 5 * 1024 * 1024) {

        showMessagePopup(
            "Large File ⚠",
            "ID Proof must be less than 5 MB."
        );
        return;

    }

    const formData = new FormData();

    formData.append("idProof", file);

    try {

        const res = await fetch(

            `${API_BASE_URL}/api/users/profile/id-proof/${user._id}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            }

        );

        const data = await res.json();

        if (!res.ok) {
            showMessagePopup(
                "Update Failed ❌",
                data.message || "Unable to update ID Proof."
            );
            return;
        }

        showMessagePopup(
            "Success ✅",
            "ID Proof updated successfully."

        );

        fileInput.value = "";

        await loadProfile();

    }

    catch (err) {

        console.log(err);

        showMessagePopup(
            "Server Error ❌",
            "Unable to update ID Proof."
        );

    }

}

// ================= UPDATE PROFILE =================
async function updateProfile() {

    let updatedData = {

        firstName: normalizeText(
            document.getElementById("firstName").value
        ),

        middleName: normalizeText(
            document.getElementById("middleName").value
        ),

        lastName: normalizeText(
            document.getElementById("lastName").value
        ),

        dob: document.getElementById("dob").value

    };

    // ================= TEACHER DETAILS =================

    if (user.role === "teacher") {

        updatedData.qualification = normalizeText(
            document.getElementById("qualification").value
        );

        updatedData.subject = normalizeText(
            document.getElementById("subject").value
        );

        updatedData.experience =
            parseInt(document.getElementById("experience").value) || 0;

        updatedData.institution = normalizeText(
            document.getElementById("institution").value
        );

        updatedData.designation = normalizeText(
            document.getElementById("designation").value
        );

    }

    const selectedStudentType = document.querySelector(
    'input[name="studentType"]:checked'
    );

    updatedData.studentType = selectedStudentType
        ? selectedStudentType.value
        : "";

    if (updatedData.studentType === "Regular") {

        updatedData.university = normalizeText(
            document.getElementById("university").value
        );

        updatedData.department = normalizeText(
            document.getElementById("department").value
        );

        updatedData.session = document.getElementById("session").value.trim();

    }
    else if (updatedData.studentType === "Ex-Student") {

        updatedData.lastUniversity = normalizeText(
            document.getElementById("lastUniversity").value
        );

        updatedData.lastSession = document.getElementById("lastSession").value.trim();

        updatedData.passingYear = parseInt(document.getElementById("passingYear").value) || null;

        updatedData.currentStatus = document.getElementById("currentStatus").value;

    }

    // ================= TEACHER VALIDATION =================

    if (user.role === "teacher") {

        if (

            !updatedData.qualification ||
            !updatedData.subject ||
            !updatedData.institution

        ) {

            showMessagePopup(

                "Teacher Details",

                "Please complete all Teacher details."

            );

            return;

        }

    }

    // ================= COMMON VALIDATION =================

    if (

        !updatedData.firstName ||
        !updatedData.dob

    ) {

        showMessagePopup(
            "Incomplete Details ⚠️",
            "Please complete all required profile details."
        );

        return;

    }

    // ================= STUDENT VALIDATION =================

    if (user.role === "student" && !updatedData.studentType) {

        showMessagePopup(
            "Student Type ⚠️",
            "Please select Student Type."
        );

        return;

    }
    if (

        user.role === "student" &&
        updatedData.studentType === "Regular" && (

            !updatedData.university ||
            !updatedData.department ||
            !updatedData.session

        )

    ) {

        showMessagePopup(
            "Regular Student ⚠",
            "Please fill all Regular Student details."
        );

        return;

    }

    if (

        user.role === "student" &&
        updatedData.studentType === "Ex-Student" && (

            !updatedData.lastUniversity ||
            !updatedData.lastSession ||
            !updatedData.passingYear

        )

    ) {

        showMessagePopup(
            "Ex Student ⚠",
            "Please fill all Ex Student details."
        );

        return;

    }

    // ================= TEACHER ID PROOF =================

    if (user.role === "teacher") {

        const idProofInput = document.getElementById("newIdProof");

        if (idProofInput.files.length > 0) {

            const file = idProofInput.files[0];

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/jpg",
                "application/pdf"
            ];

            if (!allowedTypes.includes(file.type)) {

                showMessagePopup(
                    "Invalid File ❌",
                    "Only JPG, PNG and PDF files are allowed."
                );

                updateBtn.disabled = false;
                updateBtn.innerHTML = "Update Profile";

                return;

            }

            if (file.size > 5 * 1024 * 1024) {

                showMessagePopup(
                    "Large File ⚠",
                    "ID Proof must be less than 5 MB."
                );

                updateBtn.disabled = false;
                updateBtn.innerHTML = "Update Profile";

                return;

            }

        }

    }

    updatedData.isProfileComplete = true;

    const updateBtn = document.getElementById("updateProfileBtn");

    updateBtn.disabled = true;

    updateBtn.innerHTML = "⏳ Updating...";
    
    try {
        console.log("STEP 1 - Update Started");
        console.log("STEP 2 - Before Fetch");
        let res = await fetch(`${API_BASE_URL}/api/users/profile/update/${user._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
        console.log("STEP 3 - Fetch Completed");
        

        let data = await res.json();
        console.log("STEP 4 - Response Data", data);
        console.log(data);

        if (!res.ok) {
            showMessagePopup(
                "Update Failed ❌",
                data.message || data.error || "Profile update failed."
            );
            return;
        }

        localStorage.setItem(
            "loggedInUser",
            JSON.stringify(data.user)
        );

        user = data.user;

        await loadProfile();

        updateBtn.disabled = false;

        updateBtn.innerHTML = "Update Profile";

        if (data.logoutRequired) {

    updateBtn.disabled = false;
    updateBtn.innerHTML = "Update Profile";

    await showMessagePopup(
        "📄 Documents Submitted",
        "Your documents have been submitted successfully.\n\nYour account is under Admin verification.\n\nPlease login again after approval."
    );

    setTimeout(() => {

        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");

        window.location.replace("login.html");

    }, 300);

    return;
}

        showMessagePopup(
            "Success ✅",
            "Profile updated successfully."
        );
        

    } catch (err) {

        console.error("Update Profile Error:", err);

        updateBtn.disabled = false;

        updateBtn.innerHTML = "Update Profile";

        showMessagePopup(
            "Server Error ❌",
            err.message
        );

    }
}

// ================= CHANGE PASSWORD =================
async function changePassword() {
    let currentPassword = document.getElementById("currentPassword").value;
    let newPassword = document.getElementById("newPassword").value;
    let confirmPassword = document.getElementById("confirmNewPassword").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessagePopup(
            "Password Fields 🔑",
            "Please fill all password fields."
        );
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessagePopup(
            "Password Mismatch ❌",
            "New password and confirm password do not match."
        );
        return;
    }

    let pattern = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!pattern.test(newPassword)) {
        showMessagePopup(
            "Weak Password ⚠",
            "Password must contain at least 8 characters and one special character."
        );
        return;
    }

    try {
        let res = await fetch(`${API_BASE_URL}/api/users/profile/password/${user._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        let data = await res.json();

        if (!res.ok) {
            showMessagePopup(
                "Password Change Failed ❌",
                data.message || data.error || "Password change failed."
            );
            return;
        }

        showMessagePopup(
            "Success ✅",
            data.message || "Password changed successfully."
        );

        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmNewPassword").value = "";

    } catch (err) {
        console.log(err);
        showMessagePopup(
            "Server Error ❌",
            "Unable to change password."
        );
    }
}

// ================= INIT =================
loadProfile();