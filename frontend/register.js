//====================  DOM ELEMENTS ============================
const registerForm = document.getElementById("registerForm");
const messageBox = document.getElementById("registerMessage");
const dobInput = document.getElementById("dob");
const roleRadios = document.querySelectorAll('input[name="role"]');
const studentTypeRadios = document.querySelectorAll('input[name="studentType"]');
const studentTypeContainer = document.getElementById("studentTypeContainer");
const regularStudentSection = document.getElementById("regularStudentSection");
const exStudentSection = document.getElementById("exStudentSection");
const teacherSection = document.getElementById("teacherSection");
const qualification = document.getElementById("qualification");
const subject = document.getElementById("subject");
const experience = document.getElementById("experience");
const institution = document.getElementById("institution");
const idProof = document.getElementById("idProof");
const registerBtn = document.querySelector(".register-submit-btn");

// Name Fields
const firstNameInput = document.getElementById("firstName");
const middleNameInput = document.getElementById("middleName");
const lastNameInput = document.getElementById("lastName");

// Login Fields
const emailInput = document.getElementById("email");
const confirmEmailInput = document.getElementById("confirmEmail");

const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const showBtn = document.querySelector(".show-btn");

// Student Fields
const sessionInput = document.getElementById("session");
const lastSessionInput = document.getElementById("lastSession");
const passingYearInput = document.getElementById("passingYear");

const profilePhoto = document.getElementById("profilePhoto");

//=================== REGISTER FUNCTION =============================

async function registerUser(e) {
    e.preventDefault();

    messageBox.style.display = "none";
    messageBox.className = "";
    messageBox.innerText = "";

   // ================= AUTO FORMAT =================
    firstNameInput.value = capitalizeWords(firstNameInput.value);
    middleNameInput.value = capitalizeWords(middleNameInput.value);
    lastNameInput.value = capitalizeWords(lastNameInput.value);

    const email = emailInput.value.trim().toLowerCase();
    const confirmEmail = confirmEmailInput.value.trim().toLowerCase();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    // ================= DOB VALIDATION =================
    if (!validateDOB()) {
        return;
    }

    // ================= EMAIL VALIDATION =================
    if (email !== confirmEmail) {
        showMessage("error-msg","Emails do not match ❌");
        return;
    }

    // ================= ROLE & STUDENT TYPE =================

    const selectedRole = document.querySelector('input[name="role"]:checked');

    if (!selectedRole) {

        showMessage("error-msg", "Please select your role.");
        return;

    }

    const role = selectedRole.value;

    let studentType = "";

    if (role === "student") {

        const selectedStudentType = document.querySelector('input[name="studentType"]:checked');

        if (!selectedStudentType) {
            showMessage("error-msg", "Please select Student Type.");
            return;
        }

        studentType = selectedStudentType.value;
    }


    // ================= REGULAR STUDENT VALIDATION =================

    if (studentType === "Regular") {

        const session = sessionInput.value.trim();
        const sessionPattern = /^[0-9]{4}-[0-9]{4}$/;

        if (!sessionPattern.test(session)) {

            showMessage( "error-msg", "Session must be in format 2023-2026");

            return;
        }


        const years = session.split("-");
        const startYear = Number(years[0]);
        const endYear = Number(years[1]);

        if (endYear <= startYear) {

            showMessage( "error-msg", "Session end year must be greater than start year");
            return;

        }

        const currentYear = new Date().getFullYear();

        if (startYear !== currentYear) {

            showMessage(
                "error-msg",
                `Session must start from the current year (${currentYear}).`
            );
            return;

        }

        // Session duration validation
        const duration = endYear - startYear;

        if (duration < 2 || duration > 6) {

            showMessage("error-msg", "Invalid academic session.");
            return;

        }

    }

    // ================= EX STUDENT VALIDATION =================
    if (studentType === "Ex-Student") {

        const lastSession = lastSessionInput.value.trim();
        const passingYear = passingYearInput.value.trim();

        if (lastSession === "" || passingYear === "") {

            showMessage( "error-msg", "Please fill Ex Student details" );
            return;

        }

    }

    // ================= TEACHER VALIDATION =================

    if (role === "teacher") {

        if (
            qualification.value === "" ||
            subject.value.trim() === "" ||
            experience.value.trim() === "" ||
            institution.value.trim() === ""
        ) {

            showMessage(
                "error-msg",
                "Please complete all Teacher details."
            );

            return;
        }

        if (idProof.files.length === 0) {

            showMessage(
                "error-msg",
                "Please upload your ID Proof."
            );

            return;
        }

        if (Number(experience.value) < 0) {

            showMessage(
                "error-msg",
                "Experience cannot be negative."
            );

            return;
        }

        const file = idProof.files[0];

        if (file && file.size > 5 * 1024 * 1024) {

            showMessage(
                "error-msg",
                "ID Proof must be less than 5 MB."
            );

            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/pdf"
        ];

        if (
            file &&
            !allowedTypes.includes(file.type)
        ) {

            showMessage(
                "error-msg",
                "Only JPG, PNG or PDF allowed."
            );

            return;

        }

    }

    // ================= PROFILE PHOTO VALIDATION =================

    const photo = profilePhoto.files[0];

    if (
        photo &&
        !["image/jpeg","image/png"].includes(photo.type)
    ){

        showMessage(
            "error-msg",
            "Only JPG and PNG images allowed."
        );

        return;

    }

    if (
        photo &&
        photo.size > 2 * 1024 * 1024
    ){

        showMessage(
            "error-msg",
            "Profile photo must be less than 2 MB."
        );

        return;
    }

    // ================= PASSWORD VALIDATION =================
    const passwordPattern =
        /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

        if (!passwordPattern.test(password)) {

            showMessage(
                "error-msg",
                "Password must contain one capital letter and one special character."
            );

            return;

        }
    if (password !== confirmPassword) {
        showMessage("error-msg","Passwords do not match ❌");
        return;
    }

    const formData = new FormData(registerForm);

    // ================= CLEAN FORM DATA =================

    // Teacher
    if (role === "teacher") {

        formData.delete("studentType");
        formData.delete("university");
        formData.delete("department");
        formData.delete("session");
        formData.delete("lastUniversity");
        formData.delete("lastSession");
        formData.delete("passingYear");
        formData.delete("currentStatus");

    }

    // Student
    else {

        formData.delete("qualification");
        formData.delete("subject");
        formData.delete("experience");
        formData.delete("institution");
        formData.delete("idProof");

    }

    // ================= BUTTON LOADING =================
    registerBtn.disabled = true;
    registerBtn.innerText = "Registering...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {

            showMessage("success-msg","Registration Successful ✅ Redirecting to Login...");

            registerBtn.innerText = "Registered";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);

            return;
        }

        showMessage("error-msg", data.message || data.error || "Registration failed ❌");

        registerBtn.disabled = false;
        registerBtn.innerText = "Register";

    } catch (error) {
        console.error("Registration Error:", error);

        showMessage("error-msg","Server error ❌");

        registerBtn.disabled = false;
        registerBtn.innerText = "Register";
    }
}

//====== Show / Hide Password =======
function togglePassword() {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";
        confirmPasswordInput.type = "text";
        showBtn.innerText = "Hide";

    } else {

        passwordInput.type = "password";
        confirmPasswordInput.type = "password";
        showBtn.innerText = "Show";

    }

}

// ================= CAPITALIZE FUNCTION =================
function capitalizeWords(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, function (char) {
            return char.toUpperCase();
        });
}

// ================= STUDENT TYPE SHOW / HIDE =================

studentTypeRadios.forEach(radio => {

    radio.addEventListener("change", function () {

        const regularInputs = regularStudentSection.querySelectorAll("input, select");

        const exInputs = exStudentSection.querySelectorAll("input, select");


        if(this.value === "Regular"){

            regularStudentSection.style.display = "grid";
            exStudentSection.style.display = "none";
            // Regular required ON
            regularInputs.forEach(field => {

                field.required = true;

            });

            // Ex required OFF
            exInputs.forEach(field => {

                field.required = false;
                field.value = "";

            });

        }
        else if(this.value === "Ex-Student"){

            regularStudentSection.style.display = "none";
            exStudentSection.style.display = "block";

            // Regular required OFF
            regularInputs.forEach(field => {

                field.required = false;
                field.value = "";

            });


            // Ex required ON
            exInputs.forEach(field => {

                if(field.id !== "currentStatus"){
                    field.required = true;
                }

            });

        }

    });

});

function showMessage(type, message) {

    messageBox.style.display = "block";
    messageBox.className = type;
    messageBox.innerText = message;

    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}

// ================= ROLE TOGGLE =================
function toggleRole() {

    const selectedRole = document.querySelector('input[name="role"]:checked');

    if (!selectedRole) {

        studentTypeContainer.style.display = "none";
        regularStudentSection.style.display = "none";
        exStudentSection.style.display = "none";
        teacherSection.style.display = "none";

        return;

    }

    const role = selectedRole.value;

    dobInput.value = "";
    updateDOBLimit();

    if (role === "student") {

        // Show Student Fields
        studentTypeContainer.style.display = "block";

        // Teacher Section Hide
        teacherSection.style.display = "none";

        // Student Type Required
        studentTypeRadios.forEach(radio => {
            radio.required = true;
        });

        // Teacher Required Remove
        qualification.required = false;
        subject.required = false;
        experience.required = false;
        institution.required = false;
        idProof.required = false;

        teacherSection
        .querySelectorAll("input, select")
        .forEach(field => {

            field.value = "";

        });
        idProof.value = "";

    } else {

        // Hide Student Section
        studentTypeContainer.style.display = "none";
        regularStudentSection.style.display = "none";
        exStudentSection.style.display = "none";

        regularStudentSection
        .querySelectorAll("input, select")
        .forEach(field => {

            field.required = false;
            field.value = "";

        });

        exStudentSection
        .querySelectorAll("input, select")
        .forEach(field => {

            field.required = false;
            field.value = "";

        });

        // Uncheck Student Type
        studentTypeRadios.forEach(radio => {
            radio.checked = false;
            radio.required = false;
        });

        // Show Teacher Section
        teacherSection.style.display = "block";

        // Teacher Required
        qualification.required = true;
        subject.required = true;
        experience.required = true;
        institution.required = true;
        idProof.required = true;

    }

}

roleRadios.forEach(radio => {
    radio.addEventListener("change", toggleRole);
});

// Page Load
toggleRole();

// ================= DOB VALIDATION BASED ON ROLE =================

function updateDOBLimit() {

    const today = new Date();

    // Selected Role
    const selectedRole =
        document.querySelector('input[name="role"]:checked')?.value;

    let minimumAge = 16;

    if (selectedRole === "teacher") {
        minimumAge = 25;
    }

    const maxDOB = new Date(
        today.getFullYear() - minimumAge,
        today.getMonth(),
        today.getDate()
    );

    dobInput.max = maxDOB.toISOString().split("T")[0];

}

// Page Load
updateDOBLimit();

// Role Change
roleRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        dobInput.value = "";
        updateDOBLimit();
    });
});

// ================= DOB SAFETY VALIDATION =================
function validateDOB() {

    const dobValue = dobInput.value;

    if (!dobValue) {
        showMessage("error-msg", "Please select your Date of Birth.");
        return false;
    }

    const dob = new Date(dobValue);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();

    const monthDiff = today.getMonth() - dob.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
        age--;
    }

    // ================= ROLE WISE AGE =================

    const selectedRole = document.querySelector('input[name="role"]:checked')?.value;

    let minimumAge = 16;

    if (selectedRole === "teacher") {

        minimumAge = 25;

    }

    if (age < minimumAge) {

        showMessage(

            "error-msg",

            `You must be at least ${minimumAge} years old to register.`

        );

        dobInput.focus();

        return false;

    }

    return true;
}