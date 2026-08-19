// ================= LOGIN + ROLE CHECK =================
const user = JSON.parse(localStorage.getItem("loggedInUser"));
const token = localStorage.getItem("token");

if (!user || !token) {
    alert("Please login first");
    window.location.href = "login.html";
}

if (user.role !== "admin" && user.role !== "teacher") {
    alert("Only Admin and Teacher can add quiz questions");
    window.location.href = "index.html";
}

// ================= LOAD DEPARTMENTS BY COURSE =================
document.getElementById("course").addEventListener("change", async function () {
    const course = this.value;
    const departmentList = document.getElementById("departmentOptions");

    departmentList.innerHTML = "";
    document.getElementById("department").value = "";
    document.getElementById("subject").value = "";
    document.getElementById("subjectOptions").innerHTML = "";

    if (!course) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/departments/${course}`);
        const departments = await res.json();

        departments.forEach(dep => {
            departmentList.innerHTML += `<option value="${dep}">`;
        });

    } catch (err) {
        console.log(err);
        alert("Failed to load departments");
    }
});

// ================= LOAD SUBJECTS BY DEPARTMENT =================
document.getElementById("department").addEventListener("change", async function () {
    const department = this.value;
    const subjectList = document.getElementById("subjectOptions");

    subjectList.innerHTML = "";
    document.getElementById("subject").value = "";

    if (!department) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/subjects/${department}`);
        const subjects = await res.json();

        subjects.forEach(sub => {
            subjectList.innerHTML += `<option value="${sub}">`;
        });

    } catch (err) {
        console.log(err);
        alert("Failed to load subjects");
    }
});

// ================= CORRECT ANSWER OPTIONS AUTO UPDATE =================
const optionInputs = ["option1", "option2", "option3", "option4"];

optionInputs.forEach(id => {
    document.getElementById(id).addEventListener("input", updateCorrectAnswerOptions);
});

function updateCorrectAnswerOptions() {
    const correctAnswer = document.getElementById("correctAnswer");

    const previousValue = correctAnswer.value;

    correctAnswer.innerHTML = `<option value="">Select Correct Answer</option>`;

    optionInputs.forEach(id => {
        const value = document.getElementById(id).value.trim();

        if (value) {
            correctAnswer.innerHTML += `
                <option value="${value}">${value}</option>
            `;
        }
    });

    correctAnswer.value = previousValue;
}

// ================= ADD QUIZ QUESTION =================
document.getElementById("quizForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const course = document.getElementById("course").value;
    const department = document.getElementById("department").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const unit = document.getElementById("unit").value.trim();
    const question = document.getElementById("question").value.trim();

    const option1 = document.getElementById("option1").value.trim();
    const option2 = document.getElementById("option2").value.trim();
    const option3 = document.getElementById("option3").value.trim();
    const option4 = document.getElementById("option4").value.trim();

    const correctAnswer = document.getElementById("correctAnswer").value;
    const explanation = document.getElementById("explanation").value.trim();

    if (!course || !department || !subject || !unit || !question) {
        alert("Please fill course, department, subject, unit and question");
        return;
    }

    if (!option1 || !option2 || !option3 || !option4) {
        alert("Please fill all 4 options");
        return;
    }

    const options = [option1, option2, option3, option4];

    const uniqueOptions = new Set(options.map(opt => opt.toLowerCase()));

    if (uniqueOptions.size !== 4) {
        alert("All 4 options must be different");
        return;
    }

    if (!correctAnswer) {
        alert("Please select correct answer");
        return;
    }

    const btn = this.querySelector("button");
    btn.disabled = true;
    btn.innerText = "Adding...";

    try {
        const res = await fetch(`${API_BASE_URL}/api/quiz/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({
                course,
                department,
                subject,
                unit,
                question,
                options,
                correctAnswer,
                explanation
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || data.error || "Question add failed");
            btn.disabled = false;
            btn.innerText = "Add Question";
            return;
        }

        alert(data.message || "Quiz question added successfully");

        this.reset();
        document.getElementById("correctAnswer").innerHTML =
            `<option value="">Select Correct Answer</option>`;

        btn.disabled = false;
        btn.innerText = "Add Question";

    } catch (err) {
        console.log(err);

        btn.disabled = false;
        btn.innerText = "Add Question";

        alert("Question add failed");
    }
});