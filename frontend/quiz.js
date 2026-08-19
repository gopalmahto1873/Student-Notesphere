let quizSettings = {};
let quizTimer = null;

let remainingSeconds = 0;
let currentQuestionIndex = 0;
let markedForReview = [];

// ================= LOGIN CHECK =================
let user = JSON.parse(localStorage.getItem("loggedInUser"));
let token = localStorage.getItem("token");

const quizDashboard = document.querySelector(".quiz-dashboard");
const addQuizSection = document.getElementById("addQuizSection");
const manageQuizSection = document.getElementById("manageQuizSection");

const userRole = user?.role?.toLowerCase();

if (userRole === "admin" || userRole === "teacher") {

    quizDashboard.classList.remove("student-layout");
    quizDashboard.classList.add("admin-layout");

    // ================= SHOW DASHBOARD =================

    quizDashboard.style.visibility = "visible";
    quizDashboard.style.opacity = "1";

    if (addQuizSection) {
        addQuizSection.style.display = "block";
    }

    if (manageQuizSection) {
        manageQuizSection.style.display = "block";
    }

    loadQuizQuestions();

} else {

    quizDashboard.classList.remove("admin-layout");
    quizDashboard.classList.add("student-layout");

    // ================= SHOW DASHBOARD =================

    quizDashboard.style.visibility = "visible";
    quizDashboard.style.opacity = "1";

    if (addQuizSection) {
        addQuizSection.style.display = "none";
    }

    if (manageQuizSection) {
        manageQuizSection.style.display = "none";
    }
}

// ================= GLOBAL VARIABLES =================
let currentQuestions = [];
let selectedAnswers = [];

// ================= LOAD DEPARTMENTS BY COURSE =================
document.getElementById("course").addEventListener("change", async function () {
    const course = this.value;
    const departmentSelect = document.getElementById("department");
    const subjectSelect = document.getElementById("subject");

    departmentSelect.innerHTML = `<option value="">Select Department</option>`;
    subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
    document.getElementById("unitList").innerHTML = "";

    if (!course) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/departments/${course}`);
        const departments = await res.json();

        departments.forEach(dep => {
            departmentSelect.innerHTML += `
                <option value="${dep}">${dep}</option>
            `;
        });

    } catch (err) {
        console.log(err);
        showErrorPopup("Failed to load departments");
    }
});

// ================= LOAD SUBJECTS BY DEPARTMENT =================
document.getElementById("department").addEventListener("change", async function () {
    const department = this.value;
    const subjectSelect = document.getElementById("subject");

    subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
    document.getElementById("unitList").innerHTML = "";

    if (!department) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/subjects/${department}`);
        const subjects = await res.json();

        subjects.forEach(sub => {
            subjectSelect.innerHTML += `
                <option value="${sub}">${sub}</option>
            `;
        });

        // AUTO SELECT FIRST SUBJECT + LOAD UNITS
        if (subjects.length > 0) {
            subjectSelect.value = subjects[0];
            loadUnits();
            loadTopics();
        }

    } catch (err) {
        console.log(err);
        showErrorPopup("Failed to load subjects");
    }
});

// ================= LOAD UNITS BY SUBJECT =================
async function loadUnits() {
    const course = document.getElementById("course").value;
    const department = document.getElementById("department").value;
    const subject = document.getElementById("subject").value;

    const unitList = document.getElementById("unitList");
    unitList.innerHTML = "";

    if (!course || !department || !subject) {
        unitList.innerHTML = "<p>Please select course, department and subject.</p>";
        return;
    }

    try {

        const headers = token
            ? { "Authorization": `Bearer ${token}` }
            : {};

        const res = await fetch(
            `${API_BASE_URL}/api/quiz/units?course=${encodeURIComponent(course)}&department=${encodeURIComponent(department)}&subject=${encodeURIComponent(subject)}`,
            {
                headers
            }
        );

        const units = await res.json();

        if (!Array.isArray(units) || units.length === 0) {
            unitList.innerHTML = "<p>No units found.</p>";
            return;
        }

        units.forEach(unit => {
            unitList.innerHTML += `
                <label>
                    <input type="checkbox" value="${unit}">
                    ${unit}
                </label>
            `;
        });

    } catch (err) {
        console.log("Units load error:", err);
        showErrorPopup("Failed to load units");
    }
}

document.getElementById("subject").addEventListener("change", loadUnits);
document.getElementById("subject").addEventListener("change", loadTopics);

// ================= LOAD TOPICS =================
async function loadTopics() {
    const course = document.getElementById("course").value;
    const department = document.getElementById("department").value;
    const subject = document.getElementById("subject").value;

    const topicList = document.getElementById("topicList");
    topicList.innerHTML = "";

    if (!course || !department || !subject) return;

    try {
        const headers = token
            ? { "Authorization": `Bearer ${token}` }
            : {};

        const res = await fetch(
            `${API_BASE_URL}/api/quiz/topics?course=${encodeURIComponent(course)}&department=${encodeURIComponent(department)}&subject=${encodeURIComponent(subject)}`,
            { headers }
        );

        const topics = await res.json();

        if (!Array.isArray(topics) || topics.length === 0) {
            topicList.innerHTML = "<p>No topics found.</p>";
            return;
        }

        topics.forEach(topic => {
            topicList.innerHTML += `
                <label>
                    <input type="checkbox" value="${topic}">
                    ${topic}
                </label>
            `;
        });

    } catch (err) {
        console.log(err);
    }
}

// ================= QUIZ SCOPE CHANGE =================
document.getElementById("quizScope").addEventListener("change", function () {
    const unitBox = document.getElementById("unitBox");
    const topicBox = document.getElementById("topicBox");

    unitBox.style.display = "none";
    topicBox.style.display = "none";

    if (this.value === "units") {
        unitBox.style.display = "block";
    }

    if (this.value === "topics") {
        topicBox.style.display = "block";
    }
});

// ================= START QUIZ =================
async function startQuiz() {
    const course = document.getElementById("course").value;
    const department = document.getElementById("department").value;
    const subject = document.getElementById("subject").value;
    const quizScope = document.getElementById("quizScope").value;
    const numberOfQuestions = document.getElementById("numberOfQuestions").value;

    if (!user || !token) {
        showWarningPopup("Please login first to start quiz");
        return;
    }

    if (user.isProfileComplete === false) {
        showWarningPopup("Please complete your profile first");
        setTimeout(() => {
            window.location.href = "profile.html";
        }, 2000);
        return;
    }

    let units = [];

    if (quizScope === "units") {
        const checkedUnits = document.querySelectorAll("#unitList input:checked");

        checkedUnits.forEach(chk => {
            units.push(chk.value);
        });

        if (units.length === 0) {
            showWarningPopup("Please select at least one unit");
            return;
        }
    }

    let topics = [];

    if (quizScope === "topics") {
        const checkedTopics = document.querySelectorAll("#topicList input:checked");

        checkedTopics.forEach(chk => {
            topics.push(chk.value);
        });

        if (topics.length === 0) {
            showWarningPopup("Please select at least one topic");
            return;
        }
    }

    if (!course || !department || !subject) {
        showWarningPopup("Please select course, department and subject");
        return;
    }

    try {
        showLoader("Starting quiz...");
        const res = await fetch(`${API_BASE_URL}/api/quiz/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                course,
                department,
                subject,
                units,
                topics,
                numberOfQuestions
            })
        });

        const data = await res.json();

        await wait(800);
        hideLoader();

        if (!res.ok) {
            showErrorPopup(data.message || data.error || "Quiz start failed");
            return;
        }

        quizSettings = {

            durationMinutes:
                data.durationMinutes || 10,

            marksPerQuestion:
                data.marksPerQuestion || 1,

            negativeMarks:
                data.negativeMarks || 0,

            instructions:
                data.instructions ||
                "Read all questions carefully."
        };

        currentQuestions = data.questions;
        selectedAnswers = [];
        markedForReview = [];
        currentQuestionIndex = 0;

        document.getElementById("quizTitle").innerText =
            `${course} - ${department} - ${subject} Quiz`;

        openInstructionPopup(data.totalQuestions);
        return;

    } catch (err) {
        console.log(err);

        hideLoader();

        showErrorPopup("Quiz start failed");
    }
    
}

// ================= DISPLAY QUESTIONS =================

function displayQuestions() {
    const q = currentQuestions[currentQuestionIndex];
    const container = document.getElementById("questionsContainer");

    const saved = selectedAnswers.find(
        ans => ans.questionId === q._id
    );

    let optionsHtml = "";

    q.options.forEach((option, index) => {
        const optionLabel = ["A", "B", "C", "D"][index];
        const checked =
            saved && saved.selectedAnswer === option
                ? "checked"
                : "";

        optionsHtml += `
            <label class="option">
                <input 
                    type="radio"
                    name="question_${q._id}"
                    value="${option}"
                    ${checked}
                    onchange="saveAnswer('${q.quizSetId}', '${q._id}', this.value)"
                >
                <span class="option-label">${optionLabel}.</span>
                <span>${option}</span>
            </label>
        `;
    });

    container.innerHTML = `
        <div class="question-card">
            <h3>Q${currentQuestionIndex + 1}. ${q.question}</h3>

            <p><strong>Unit:</strong> ${q.unit}</p>

            ${q.topic ? `<p><strong>Topic:</strong> ${q.topic}</p>` : ""}

            ${optionsHtml}

            <div class="quiz-actions">
                <button class="prev-btn" onclick="previousQuestion()"> ⬅ Previous </button>

                <button class="review-btn" onclick="markForReview()"> ⭐ Mark For Review</button>

                <button class="clear-btn" onclick="clearResponse()"> 🗑 Clear </button>

                <button class="save-btn"
                onclick="saveAndNext()">
                💾 Save & Next
                </button>

            </div>
        </div>
    `;

    renderPalette();
}

// ================= SAVE ANSWER =================

function saveAnswer(quizSetId, questionId, selectedAnswer) {

    const existing = selectedAnswers.find(
        ans => ans.questionId === questionId
    );

    if (existing) {
        existing.selectedAnswer = selectedAnswer;
    } else {
        selectedAnswers.push({
            quizSetId,
            questionId,
            selectedAnswer
        });
    }
    renderPalette();
}

// ================= SUBMIT QUIZ =================
async function submitQuiz( autoSubmit = false ) {
    if (!autoSubmit && selectedAnswers.length !== currentQuestions.length) {
        const confirmSubmit = await showConfirmPopup(
            "Submit Quiz",
            "Some questions are unanswered. Submit anyway?"
        );
        if (!confirmSubmit) return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                answers: selectedAnswers
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showErrorPopup(data.message || data.error || "Quiz submit failed");
            return;
        }


        clearInterval( quizTimer );
        showResult(data);

    } catch (err) {
        console.log(err);
        showErrorPopup("Quiz submit failed");
    }
}

// ================= SHOW RESULT =================
function showResult(data) {

    document.getElementById("quizSection").style.display = "none";
    document.getElementById("resultSection").style.display = "block";

    const resultBox = document.getElementById("resultBox");

    const totalQuestions = currentQuestions.length;

    const correctCount = data.review.filter(
        item => item.isCorrect
    ).length;

    const wrongCount = data.review.filter(
        item => item.selectedAnswer && !item.isCorrect
    ).length;

    const unattemptedCount =
        totalQuestions - selectedAnswers.length;

    const reviewCount =
        markedForReview.filter(id => {
            return !selectedAnswers.some(ans => ans.questionId === id);
        }).length;

    const answeredReviewCount =
        markedForReview.filter(id => {
            return selectedAnswers.some(ans => ans.questionId === id);
        }).length;

    const percentage =
        totalQuestions > 0
            ? ((correctCount / totalQuestions) * 100).toFixed(2)
            : 0;

    let grade = "D";

    if (percentage >= 90) grade = "A+";
    else if (percentage >= 75) grade = "A";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 40) grade = "C";

    resultBox.innerHTML = `
        <div class="result-summary-card">

            <h2>🏆 Quiz Result</h2>

            <div class="score-box">
                <h3>${data.score} / ${totalQuestions}</h3>
                <p>Final Score</p>
            </div>

            <div class="result-grid">

                <div class="result-item">
                    <span>Percentage</span>
                    <strong>${percentage}%</strong>
                </div>

                <div class="result-item">
                    <span>Grade</span>
                    <strong>${grade}</strong>
                </div>

                <div class="result-item correct-bg">
                    <span>Correct</span>
                    <strong>${correctCount}</strong>
                </div>

                <div class="result-item wrong-bg">
                    <span>Wrong</span>
                    <strong>${wrongCount}</strong>
                </div>

                <div class="result-item skipped-bg">
                    <span>Unattempted</span>
                    <strong>${unattemptedCount}</strong>
                </div>

                <div class="result-item review-bg">
                    <span>Review</span>
                    <strong>${reviewCount}</strong>
                </div>

                <div class="result-item answered-review-bg">
                    <span>Answered + Review</span>
                    <strong>${answeredReviewCount}</strong>
                </div>

            </div>

            <p class="performance-message">
                ${getPerformanceMessage(correctCount, totalQuestions)}
            </p>

        </div>

        <h2 class="review-title">Question Review</h2>
    `;

    data.review.forEach((item, index) => {

        const cardClass =
            item.isCorrect
                ? "correct-card"
                : item.selectedAnswer
                    ? "wrong-card"
                    : "unattempted-card";

        resultBox.innerHTML += `
            <div class="review-card ${cardClass}">

                <h3>Q${index + 1}. ${item.question}</h3>

                <p>
                    <strong>Your Answer:</strong>
                    <span class="${item.isCorrect ? "correct" : "wrong"}">
                        ${item.selectedAnswer || "Not Attempted"}
                    </span>
                </p>

                <p>
                    <strong>Correct Answer:</strong>
                    <span class="correct">
                        ${item.correctAnswer}
                    </span>
                </p>

                <p>
                    <strong>Result:</strong>
                    <span class="${item.isCorrect ? "correct" : "wrong"}">
                        ${item.isCorrect ? "Correct ✅" : item.selectedAnswer ? "Wrong ❌" : "Unattempted ⚪"}
                    </span>
                </p>

                ${
                    item.explanation
                    ? `
                        <details class="explanation-box">
                            <summary>View Explanation</summary>
                            <p>${item.explanation}</p>
                        </details>
                    `
                    : ""
                }

            </div>
        `;
    });

    resultBox.innerHTML += `
        <button onclick="restartQuiz()" class="submit-btn">
            Try Another Quiz
        </button>
    `;
}

// ================= PERFORMANCE MESSAGE =================
function getPerformanceMessage(score, total) {

    let percentage = (score / total) * 100;

    if (percentage >= 90) {
        return "Excellent Performance 🏆";
    } else if (percentage >= 75) {
        return "Very Good Performance ⭐";
    } else if (percentage >= 60) {
        return "Good Attempt 👍";
    } else if (percentage >= 40) {
        return "Keep Practicing 📚";
    } else {
        return "You Need More Revision ✍️";
    }
}
// ================= RESTART QUIZ =================
function restartQuiz() {
    currentQuestions = [];
    selectedAnswers = [];

    document.querySelector(".quiz-setup").style.display = "block";
    document.getElementById("availableQuizSection").style.display = "block";
    document.getElementById("quizSection").style.display = "none";
    document.getElementById("resultSection").style.display = "none";

    document.getElementById("questionsContainer").innerHTML = "";
    document.getElementById("resultBox").innerHTML = "";

    clearInterval(quizTimer);
    remainingSeconds = 0;

    document.getElementById(
        "timerBox"
    ).innerText = "⏰ 00:00";
}

// ================= ADD QUIZ QUESTION - ADMIN / TEACHER =================

// correct answer dropdown auto update
const addOptionInputs = ["opt1", "opt2", "opt3", "opt4"];

addOptionInputs.forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateAddCorrectOptions);
});

function updateAddCorrectOptions() {
    const correctSelect = document.getElementById("addCorrectAnswer");

    const oldValue = correctSelect.value;

    correctSelect.innerHTML = `<option value="">Select Correct Answer</option>`;

    addOptionInputs.forEach(id => {
        const value = document.getElementById(id).value.trim();

        if (value) {
            correctSelect.innerHTML += `
                <option value="${value}">${value}</option>
            `;
        }
    });

    correctSelect.value = oldValue;
}

// form submit
document.getElementById("quizForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const course = document.getElementById("addCourse").value;
    const department = document.getElementById("addDepartment").value.trim();
    const subject = document.getElementById("addSubject").value.trim();
    const unit = document.getElementById("addUnit").value.trim();
    const topic = document.getElementById("addTopic").value.trim();
    
    const durationMinutes = document.getElementById("durationMinutes").value;
    const marksPerQuestion = document.getElementById("marksPerQuestion").value;
    const negativeMarks = document.getElementById("negativeMarks").value;

    if (!durationMinutes || Number(durationMinutes) <= 0) {
        showWarningPopup("Please enter quiz duration");
        return;
    }

    if (!marksPerQuestion || Number(marksPerQuestion) <= 0) {
        showWarningPopup("Please enter marks per question");
        return;
    }

    if (negativeMarks === "" || Number(negativeMarks) < 0) {
        showWarningPopup("Please enter valid negative marks");
        return;
    }

    const instructions = document.getElementById("quizInstructions").value.trim();
    
    const question = document.getElementById("addQuestion").value.trim();

    const option1 = document.getElementById("opt1").value.trim();
    const option2 = document.getElementById("opt2").value.trim();
    const option3 = document.getElementById("opt3").value.trim();
    const option4 = document.getElementById("opt4").value.trim();

    const correctAnswer = document.getElementById("addCorrectAnswer").value;
    const explanation = document.getElementById("addExplanation").value.trim();

    if (!course || !department || !subject || !unit || !question) {
        showWarningPopup("Please fill course, department, subject, unit and question");
        return;
    }

    if (!option1 || !option2 || !option3 || !option4) {
        showWarningPopup("Please fill all 4 options");
        return;
    }

    const options = [option1, option2, option3, option4];

    const uniqueOptions = new Set(options.map(opt => opt.toLowerCase()));

    if (uniqueOptions.size !== 4) {
        showWarningPopup("All 4 options must be different");
        return;
    }

    if (!correctAnswer) {
        showWarningPopup("Please select correct answer");
        return;
    }

    const btn = this.querySelector("button");
    btn.disabled = true;
    btn.innerText = "Adding...";

    try {
        showLoader("Adding quiz question...");

        const res = await fetch(`${API_BASE_URL}/api/quiz/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                course,
                department,
                subject,
                unit,
                topic,

                durationMinutes,
                marksPerQuestion,
                negativeMarks,
                instructions,

                question,
                options,
                correctAnswer,
                explanation
            })
        });

        const data = await res.json();

        if (!res.ok) {
            hideLoader();

            showErrorPopup(
                data.message || data.error || "Question add failed"
            );

            btn.disabled = false;
            btn.innerText = "Add Question";

            return;
        }

        await wait(800);

        hideLoader();

        await showSuccessPopup(
            "Question added successfully ✅ Add next question for same quiz set."
        );

        // ================= KEEP QUIZ SET DETAILS SAME =================

        // Course / Department / Subject / Unit / Topic same rahega
        document.getElementById("addCourse").value = course;
        document.getElementById("addDepartment").value = department;
        document.getElementById("addSubject").value = subject;
        document.getElementById("addUnit").value = unit;
        document.getElementById("addTopic").value = topic;

        // Quiz settings same rahenge
        document.getElementById("durationMinutes").value = durationMinutes;
        document.getElementById("marksPerQuestion").value = marksPerQuestion;
        document.getElementById("negativeMarks").value = negativeMarks;
        document.getElementById("quizInstructions").value = instructions;

        // ================= CLEAR ONLY QUESTION DETAILS =================

        document.getElementById("addQuestion").value = "";

        document.getElementById("opt1").value = "";
        document.getElementById("opt2").value = "";
        document.getElementById("opt3").value = "";
        document.getElementById("opt4").value = "";

        document.getElementById("addCorrectAnswer").innerHTML =
            `<option value="">Select Correct Answer</option>`;

        document.getElementById("addExplanation").value = "";

        btn.disabled = false;
        btn.innerText = "Add Question";

        loadQuizQuestions();

    } catch (err) {
        console.log("Frontend error:", err);

        hideLoader();

        btn.disabled = false;
        btn.innerText = "Add Question";

        showErrorPopup(
            "Question add failed. Server may be stopped or route error."
        );
    }
});
// ================= ADD QUIZ: LOAD DEPARTMENTS FROM NOTES =================
document.getElementById("addCourse")?.addEventListener("change", async function () {
    const course = this.value;
    const departmentInput = document.getElementById("addDepartment");
    const subjectInput = document.getElementById("addSubject");

    departmentInput.value = "";
    subjectInput.value = "";

    let list = document.getElementById("addDepartmentOptions");

    if (!list) {
        list = document.createElement("datalist");
        list.id = "addDepartmentOptions";
        document.body.appendChild(list);
        departmentInput.setAttribute("list", "addDepartmentOptions");
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
        showErrorPopup("Failed to load departments");
    }
});

// ================= ADD QUIZ: LOAD SUBJECTS FROM NOTES =================
document.getElementById("addDepartment")?.addEventListener("change", async function () {
    const department = this.value;
    const subjectInput = document.getElementById("addSubject");

    subjectInput.value = "";

    let list = document.getElementById("addSubjectOptions");

    if (!list) {
        list = document.createElement("datalist");
        list.id = "addSubjectOptions";
        document.body.appendChild(list);
        subjectInput.setAttribute("list", "addSubjectOptions");
    }

    list.innerHTML = "";

    if (!department) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notes/subjects/${department}`);
        const subjects = await res.json();

        subjects.forEach(sub => {
            list.innerHTML += `<option value="${sub}">`;
        });

    } catch (err) {
        console.log(err);
        showErrorPopup("Failed to load subjects");
    }
});

// ================= LOAD QUIZ SETS =================

async function loadQuizQuestions() {

    try {

        const res = await fetch(
            `${API_BASE_URL}/api/quiz/list`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        const quizList =
            document.getElementById("quizList");

        quizList.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {

            quizList.innerHTML =
                "<p>No quiz sets found.</p>";

            return;
        }

        data.forEach(set => {

            let questionsHtml = "";

            set.questions.forEach((q, index) => {

                questionsHtml += `

                    <div class="nested-question">

                        <p>
                            <strong>Q${index + 1}:</strong>
                            ${q.question}
                        </p>

                        <button 
                            class="edit-btn"

                            onclick="
                                editQuiz(
                                    '${set._id}',
                                    '${q._id}'
                                )
                            "
                        >
                            Edit
                        </button>

                        <button 
                            class="delete-btn"

                            onclick="
                                deleteQuiz(
                                    '${set._id}',
                                    '${q._id}'
                                )
                            "
                        >
                            Delete
                        </button>

                    </div>
                `;
            });

            quizList.innerHTML += `

                <div class="quiz-card">

                    <h3>
                        ${set.subject} - ${set.unit}
                    </h3>

                    ${
                        set.topic
                        ? `<p><strong>Topic:</strong> ${set.topic}</p>`
                        : ""
                    }

                    <p>
                        <strong>Course:</strong>
                        ${set.course}
                    </p>

                    <p>
                        <strong>Department:</strong>
                        ${set.department}
                    </p>

                    <p>
                        <strong>Total Questions:</strong>
                        ${set.questions.length}
                    </p>

                    <button 
                        class="edit-settings-btn"
                        onclick="openQuizSettingsPopup(
                            '${set._id}',
                            '${set.durationMinutes}',
                            '${set.marksPerQuestion}',
                            '${set.negativeMarks}',
                            \`${set.instructions || ""}\`
                        )"
                    >
                        Edit Settings
                    </button>

                    <hr>

                    ${questionsHtml}

                </div>
            `;
        });

    } catch (err) {
        console.log(err);
        showErrorPopup("Failed to load quiz sets");
    }
}

// ================= DELETE QUIZ =================

async function deleteQuiz(quizSetId, questionId) {

    const confirmDelete = await showConfirmPopup(
        "Delete Quiz Question",
        "Are you sure you want to delete this quiz question?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const res = await fetch(
            `${API_BASE_URL}/api/quiz/delete/${quizSetId}/${questionId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            showErrorPopup(
                data.message || data.error || "Delete failed"
            );
            return;
        }

        showSuccessPopup(
            data.message || "Quiz question deleted successfully"
        );

        loadQuizQuestions();

    } catch (err) {
        console.log(err);

        showErrorPopup("Delete failed");
    }
}

// ================= EDIT QUIZ OPEN POPUP =================

async function editQuiz(quizSetId, questionId) {

    try {

        const res = await fetch(
            `${API_BASE_URL}/api/quiz/list`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        // Find quiz set
        const quizSet = data.find(
            set => set._id === quizSetId
        );

        if (!quizSet) {
            showErrorPopup("Quiz set not found");
            return;
        }

        // Find question
        const quiz =
            quizSet.questions.find(
                q => q._id === questionId
            );

        if (!quiz) {
            showErrorPopup("Question not found");
            return;
        }

        // Open popup
        document.getElementById("editPopup").style.display = "flex";

        // Store IDs
        document.getElementById("editQuizSetId").value =
            quizSetId;

        document.getElementById("editQuestionId").value =
            questionId;

        // Fill data
        document.getElementById("editQuestion").value =
            quiz.question;

        document.getElementById("editOpt1").value =
            quiz.options[0] || "";

        document.getElementById("editOpt2").value =
            quiz.options[1] || "";

        document.getElementById("editOpt3").value =
            quiz.options[2] || "";

        document.getElementById("editOpt4").value =
            quiz.options[3] || "";

        // Correct answer dropdown
        const select =
            document.getElementById("editCorrect");

        select.innerHTML = `
            <option value="${quiz.options[0]}">${quiz.options[0]}</option>
            <option value="${quiz.options[1]}">${quiz.options[1]}</option>
            <option value="${quiz.options[2]}">${quiz.options[2]}</option>
            <option value="${quiz.options[3]}">${quiz.options[3]}</option>
        `;

        select.value = quiz.correctAnswer;

        document.getElementById("editExplanation").value =
            quiz.explanation || "";

    } catch (err) {

        console.log(err);

        showErrorPopup("Failed to open edit popup");
    }
}
["editOpt1", "editOpt2", "editOpt3", "editOpt4"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateEditCorrectOptions);
});

function updateEditCorrectOptions() {
    const select = document.getElementById("editCorrect");

    const oldValue = select.value;

    const options = [
        document.getElementById("editOpt1").value.trim(),
        document.getElementById("editOpt2").value.trim(),
        document.getElementById("editOpt3").value.trim(),
        document.getElementById("editOpt4").value.trim()
    ];

    select.innerHTML = "";

    options.forEach(opt => {
        if (opt) {
            select.innerHTML += `<option value="${opt}">${opt}</option>`;
        }
    });

    select.value = oldValue;
}
// ================= CLOSE POPUP =================
function closePopup() {
    document.getElementById("editPopup").style.display = "none";
}

// ================= UPDATE QUIZ =================

async function updateQuiz() {

    const quizSetId =
        document.getElementById("editQuizSetId").value;

    const questionId =
        document.getElementById("editQuestionId").value;

    const question =
        document.getElementById("editQuestion")
        .value
        .trim();

    const opt1 =
        document.getElementById("editOpt1")
        .value
        .trim();

    const opt2 =
        document.getElementById("editOpt2")
        .value
        .trim();

    const opt3 =
        document.getElementById("editOpt3")
        .value
        .trim();

    const opt4 =
        document.getElementById("editOpt4")
        .value
        .trim();

    const correctAnswer =
        document.getElementById("editCorrect").value;

    const explanation =
        document.getElementById("editExplanation")
        .value
        .trim();

    if (
        !question ||
        !opt1 ||
        !opt2 ||
        !opt3 ||
        !opt4 ||
        !correctAnswer
    ) {
        showWarningPopup("Please fill all required fields");
        return;
    }

    const options = [opt1, opt2, opt3, opt4];

    const uniqueOptions =
        new Set(options.map(opt => opt.toLowerCase()));

    if (uniqueOptions.size !== 4) {
        showWarningPopup("All 4 options must be different");
        return;
    }

    try {

        const res = await fetch(

            `${API_BASE_URL}/api/quiz/update/${quizSetId}/${questionId}`,

            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    question,
                    options,
                    correctAnswer,
                    explanation
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            showErrorPopup(data.message || data.error || "Update failed");
            return;
        }

        showSuccessPopup(data.message ||"Quiz updated successfully");

        closePopup();
        loadQuizQuestions();

    } catch (err) {

        console.log(err);

        showErrorPopup("Update failed");
    }
}

// ================= COMMON QUIZ SEARCH =================
document.getElementById("commonQuizSearch")?.addEventListener("input", async function () {
    const query = this.value.trim();
    const resultsBox = document.getElementById("commonQuizResults");

    if (query === "") {
        resultsBox.innerHTML = "";
        resultsBox.style.display = "none";
        return;
    }

    resultsBox.style.display = "grid";

    try {
        const headers = token
            ? { "Authorization": `Bearer ${token}` }
            : {};

        const res = await fetch(
            `${API_BASE_URL}/api/quiz/search?query=${encodeURIComponent(query)}`,
            { headers }
        );

        const data = await res.json();

        displayCommonQuizResults(data);

    } catch (err) {
        console.log(err);
        resultsBox.innerHTML = "<p>Error searching quiz.</p>";
    }
});
// ================= DISPLAY SEARCH RESULTS =================

function displayCommonQuizResults(data) {

    const resultsBox =
        document.getElementById("commonQuizResults");

    resultsBox.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        resultsBox.style.display = "block";
        resultsBox.innerHTML = "<p>No quiz found.</p>";
        return;
    }

    resultsBox.style.display = "grid";

    data.forEach(set => {

        resultsBox.innerHTML += `
            <div class="common-quiz-card">

                <h3>${set.subject} - ${set.unit}</h3>

                ${set.topic ? `<p><strong>Topic:</strong> ${set.topic}</p>` : ""}

                <p><strong>Course:</strong> ${set.course}</p>
                <p><strong>Department:</strong> ${set.department}</p>
                <p><strong>Total Questions:</strong> ${set.questions.length}</p>

                <button class="start-search-quiz"
                    onclick="startQuizFromSearch(
                        '${set.course}',
                        '${set.department}',
                        '${set.subject}',
                        '${set.unit}',
                        '${set.topic || ""}'
                    )">
                    Start Quiz
                </button>

                <button class="download-btn"
        onclick="downloadQuiz('${set._id}')">
        ⬇ Download
    </button>
                

            </div>
        `;
    });
}

// ================= DOWNLOAD QUIZ =================

/*async function downloadQuiz(quizId) {

    try {

        const res = await fetch(
            `${API_BASE_URL}/api/quiz/download/${quizId}`
        );

        const data = await res.json();

        if (!res.ok) {
            showErrorPopup(data.message || "Download failed");
            return;
        }

        const quiz = data.quiz;

        let content = "";

        content += `Course : ${quiz.course}\n`;
        content += `Department : ${quiz.department}\n`;
        content += `Subject : ${quiz.subject}\n`;
        content += `Unit : ${quiz.unit}\n`;

        if (quiz.topic) {
            content += `Topic : ${quiz.topic}\n`;
        }

        content += "\n";

        quiz.questions.forEach((q, index) => {

            content += `Q${index + 1}. ${q.question}\n`;

            q.options.forEach((opt, i) => {
                content += `${String.fromCharCode(65 + i)}. ${opt}\n`;
            });

            content += "\n";

        });

        const blob = new Blob(
            [content],
            { type: "text/plain" }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download =
            `${quiz.subject}-${quiz.unit}.txt`;

        a.click();

        URL.revokeObjectURL(url);

    } catch (err) {

        console.log(err);

        showErrorPopup("Download failed");
    }
}*/

// ================= START QUIZ FROM SEARCH =================

function startQuizFromSearch(course, department, subject, unit, topic) {

    if (!user || !token) {
        showWarningPopup("Please login first to start quiz");
        return;
    }

    if (user.isProfileComplete === false) {
        showWarningPopup("Please complete your profile first");

        setTimeout(() => {
            window.location.href = "profile.html";
        }, 2000);

        return;
    }

    document.getElementById("course").value = course;
    document.getElementById("department").innerHTML =
        `<option value="${department}">${department}</option>`;
    document.getElementById("subject").innerHTML =
        `<option value="${subject}">${subject}</option>`;

    document.getElementById("department").value = department;
    document.getElementById("subject").value = subject;

    if (topic) {
        document.getElementById("quizScope").value = "topics";
        document.getElementById("topicBox").style.display = "block";
        document.getElementById("unitBox").style.display = "none";

        document.getElementById("topicList").innerHTML = `
            <label>
                <input type="checkbox" value="${topic}" checked>
                ${topic}
            </label>
        `;
    } else {
        document.getElementById("quizScope").value = "units";
        document.getElementById("unitBox").style.display = "block";
        document.getElementById("topicBox").style.display = "none";

        document.getElementById("unitList").innerHTML = `
            <label>
                <input type="checkbox" value="${unit}" checked>
                ${unit}
            </label>
        `;
    }

    document.querySelector(".quiz-setup").scrollIntoView({
        behavior: "smooth"
    });
}


document.addEventListener("DOMContentLoaded", function () {
    loadAllPublicQuiz();
});

async function loadAllPublicQuiz() {
    const resultsBox = document.getElementById("commonQuizResults");

    try {
        const headers = token
            ? { "Authorization": `Bearer ${token}` }
            : {};

        const res = await fetch(`${API_BASE_URL}/api/quiz/search?query=`, {
            headers
        });

        const data = await res.json();

        displayCommonQuizResults(data);

    } catch (err) {
        console.log(err);
        resultsBox.innerHTML = "<p>Error loading quiz.</p>";
    }
}

function openInstructionPopup(totalQuestions) {

    document.getElementById(
        "instructionText"
    ).innerText =
        quizSettings.instructions;

    document.getElementById(
        "quizMetaText"
    ).innerHTML = `
        Total Questions: ${totalQuestions}<br>
        Duration: ${quizSettings.durationMinutes} Minutes<br>
        Marks Per Question: +${quizSettings.marksPerQuestion}<br>
        Negative Marks: -${quizSettings.negativeMarks}
    `;

    document.getElementById(
        "instructionPopup"
    ).style.display = "flex";
}

function beginQuizAfterInstruction() {

    document.getElementById("instructionPopup").style.display = "none";

    document.querySelector(".quiz-setup").style.display = "none";

    document.getElementById("availableQuizSection").style.display = "none";

    document.getElementById("quizSection").style.display = "block";

    document.getElementById("resultSection").style.display = "none";

    startTimer( quizSettings.durationMinutes );

    displayQuestions();
    renderPalette();

    window.scrollTo({
    top: 0,
    behavior: "smooth"
});
}


function startTimer(minutes) {

    remainingSeconds = minutes * 60;

    clearInterval(quizTimer);

    updateTimerText();

    quizTimer = setInterval(function () {

        remainingSeconds--;

        if (remainingSeconds <= 0) {

            remainingSeconds = 0;
            updateTimerText();

            clearInterval(quizTimer);

            showSuccessPopup(
                "⏰ Time is over. Your quiz has been submitted automatically."
            );

            setTimeout(() => {
                submitQuiz(true);
            }, 1200);

            return;
        }

        updateTimerText();

    }, 1000);
}

function updateTimerText() {

    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;

    document.getElementById("timerBox").innerText =
        `⏰ ${mins}:${secs.toString().padStart(2, "0")}`;
}

function renderPalette() {
    const box = document.getElementById("questionPalette");
    box.innerHTML = "";

    let answeredCount = 0;
    let reviewCount = 0;
    let answeredReviewCount = 0;
    let notAttemptedCount = 0;

    currentQuestions.forEach((q, index) => {
        const answered = selectedAnswers.some(
            ans => ans.questionId === q._id
        );

        const review = markedForReview.includes(q._id);

        let cls = "not-attempted";

        if (answered && review) {
            cls = "answered-review";
            answeredReviewCount++;
        } else if (answered) {
            cls = "answered";
            answeredCount++;
        } else if (review) {
            cls = "review";
            reviewCount++;
        } else {
            cls = "not-attempted";
            notAttemptedCount++;
        }

        if (index === currentQuestionIndex) {
            cls += " current";
        }

        box.innerHTML += `
            <button class="palette-btn ${cls}" onclick="goToQuestion(${index})">
                ${index + 1}
            </button>
        `;
    });

    document.getElementById("totalCount").innerText = currentQuestions.length;
    document.getElementById("answeredCount").innerText = answeredCount;
    document.getElementById("reviewCount").innerText = reviewCount;
    document.getElementById("answeredReviewCount").innerText = answeredReviewCount;
    document.getElementById("notAttemptedCount").innerText = notAttemptedCount;
}
function goToQuestion(index) {
    currentQuestionIndex = index;
    displayQuestions();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestions();
    }
}

async function saveAndNext() {

    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestions();
        return;
    }

    const confirmSubmit = await showConfirmPopup(
        "Submit Quiz",
        "You are on the last question. Do you want to submit the quiz?"
    );

    if (confirmSubmit) {
        submitQuiz();
    }
}

function markForReview() {
    const q = currentQuestions[currentQuestionIndex];

    if (!markedForReview.includes(q._id)) {
        markedForReview.push(q._id);
    }

    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestions();
    } else {
        renderPalette();

        showSuccessPopup(
            "Question marked for review."
        );
    }
}

function clearResponse() {
    const q = currentQuestions[currentQuestionIndex];

    selectedAnswers = selectedAnswers.filter(
        ans => ans.questionId !== q._id
    );

    markedForReview = markedForReview.filter(
        id => id !== q._id
    );

    displayQuestions();
    renderPalette();
}

document.getElementById("finishQuizSetBtn") ?.addEventListener("click", async () => {

    const confirmFinish =
        await showConfirmPopup(
            "Finish Quiz Set",
            "All questions added?"
        );

    if (!confirmFinish) return;

    document.getElementById("quizForm").reset();

    document.getElementById(
        "addCorrectAnswer"
    ).innerHTML =
    `<option value="">
        Select Correct Answer
    </option>`;

    showSuccessPopup(
        "Quiz Set Completed Successfully ✅"
    );

});

function openQuizSettingsPopup(id, duration, marks, negative, instructions) {
    document.getElementById("settingsQuizSetId").value = id;
    document.getElementById("editDurationMinutes").value = duration;
    document.getElementById("editMarksPerQuestion").value = marks;
    document.getElementById("editNegativeMarks").value = negative;
    document.getElementById("editInstructions").value = instructions;

    document.getElementById("settingsPopup").style.display = "flex";
}

function closeSettingsPopup() {
    document.getElementById("settingsPopup").style.display = "none";
}

async function updateQuizSettings() {
    const id = document.getElementById("settingsQuizSetId").value;

    const durationMinutes = document.getElementById("editDurationMinutes").value;
    const marksPerQuestion = document.getElementById("editMarksPerQuestion").value;
    const negativeMarks = document.getElementById("editNegativeMarks").value;
    const instructions = document.getElementById("editInstructions").value.trim();

    if (!durationMinutes || Number(durationMinutes) <= 0) {
        showWarningPopup("Please enter valid duration");
        return;
    }

    if (!marksPerQuestion || Number(marksPerQuestion) <= 0) {
        showWarningPopup("Please enter valid marks");
        return;
    }

    if (negativeMarks === "" || Number(negativeMarks) < 0) {
        showWarningPopup("Please enter valid negative marks");
        return;
    }

    const res = await fetch(`${API_BASE_URL}/api/quiz/settings/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            durationMinutes,
            marksPerQuestion,
            negativeMarks,
            instructions
        })
    });

    const data = await res.json();

    if (!res.ok) {
        showErrorPopup(data.message || data.error || "Settings update failed");
        return;
    }

    closeSettingsPopup();
    showSuccessPopup("Quiz settings updated successfully ✅");
    loadQuizQuestions();
}


// ================= DOWNLOAD QUIZ =================
async function downloadQuiz(id) {

    if (!user || !token) {
        showWarningPopup("Please login first to download quiz");
        return;
    }

    try {

        await fetch(
            `${API_BASE_URL}/api/quiz/download/${id}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        window.open(
            `${API_BASE_URL}/api/quiz/pdf/${id}`,
            "_blank"
        );

    } catch (err) {

        console.log(err);

        showErrorPopup("Download failed");

    }

}