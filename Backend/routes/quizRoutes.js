const express = require("express");
const router = express.Router();

const Quiz = require("../models/Quiz");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const generateCustomId = require("../utils/generateCustomId");
const PDFDocument = require("pdfkit");

function normalizeText(text) {
    if (!text) return "";

    const upperWords = [
        "UG", "PG", "BCA", "BBA", "MCA", "MBA",
        "DBMS", "OS", "AI", "HR", "IT"
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

            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}


// ================= ADD QUIZ QUESTION =================
// Admin + Teacher

router.post("/add", auth, roleAuth("admin", "teacher"), async (req, res) => {

        try {

            const {
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
            } = req.body;

            // ================= VALIDATION =================

            if (
                !durationMinutes ||
                Number(durationMinutes) <= 0 ||
                !marksPerQuestion ||
                Number(marksPerQuestion) <= 0 ||
                negativeMarks === undefined ||
                negativeMarks === "" ||
                Number(negativeMarks) < 0
            ) {
                return res.status(400).json({
                    message: "Please configure quiz duration, marks per question and negative marks"
                });
            }

            if (
                !course ||
                !department ||
                !subject ||
                !unit ||
                !question ||
                !options ||
                !correctAnswer
            ) {
                return res.status(400).json({
                    message: "All fields required"
                });
            }

            if (!Array.isArray(options) || options.length !== 4) {
                return res.status(400).json({
                    message: "Exactly 4 options required"
                });
            }

            if (
                !options
                    .map(opt => opt.trim())
                    .includes(correctAnswer.trim())
            ) {
                return res.status(400).json({
                    message: "Correct answer must be one of the options"
                });
            }

            if (options.some(opt => !opt || !opt.trim())) {
                return res.status(400).json({
                    message: "Options cannot be empty"
                });
            }

            // ================= CLEAN DATA =================

            const cleanCourse = normalizeText(course);

            const cleanDepartment =
                normalizeText(department);

            const cleanSubject =
                normalizeText(subject);

            const cleanUnit =
                normalizeText(unit);

            const cleanTopic =
                topic ? normalizeText(topic) : "";

            // ================= FIND EXISTING QUIZ SET =================

            let quizSet = await Quiz.findOne({

                course: cleanCourse,

                department: cleanDepartment,

                subject: cleanSubject,

                unit: cleanUnit,

                topic: cleanTopic
            });

            // ================= GENERATE CUSTOM ID =================

            const customId =await generateCustomId(Quiz, "SN-QUIZ-");

            // ================= QUESTION OBJECT =================

            const newQuestion = {
                question,
                options,
                correctAnswer,
                explanation: explanation || "",
                createdBy: req.user.id,
                createdByRole: req.user.role
            };

            // ================= IF QUIZ SET EXISTS =================

            if (quizSet) {

                quizSet.questions.push(newQuestion);

                await quizSet.save();

                return res.json({
                    message: "Question added to existing quiz set",
                    quizSet
                });
            }

            // ================= CREATE NEW QUIZ SET =================

            quizSet = new Quiz({
                course: cleanCourse,
                department: cleanDepartment,
                subject: cleanSubject,
                unit: cleanUnit,
                topic: cleanTopic,

                durationMinutes: Number(durationMinutes),
                marksPerQuestion: Number(marksPerQuestion),
                negativeMarks: Number(negativeMarks),
                instructions:
                    instructions ||
                    "Read all questions carefully before starting the quiz.",

                questions: [newQuestion],
                createdBy: req.user.id,
                createdByRole: req.user.role,
                customId
            });

            await quizSet.save();

            res.json({

                message:
                    "New quiz set created successfully",

                quizSet
            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });
        }
    }
);

// ================= SHUFFLE ARRAY =================
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// ================= START QUIZ =================
// Student / Teacher / Admin can start quiz

router.post("/start", auth, async (req, res) => {
    try {
        const {
            course,
            department,
            subject,
            units,
            topics,
            numberOfQuestions
        } = req.body;

        if (!course || !department || !subject) {
            return res.status(400).json({
                message: "Course, department and subject are required"
            });
        }

        let query = {
            course: { $regex: `^${normalizeText(course)}$`, $options: "i" },
            department: { $regex: `^${normalizeText(department)}$`, $options: "i" },
            subject: { $regex: `^${normalizeText(subject)}$`, $options: "i" }
        };

        if (units && Array.isArray(units) && units.length > 0) {
            query.unit = {
                $in: units.map(u => new RegExp(`^${normalizeText(u)}$`, "i"))
            };
        }

        if (topics && Array.isArray(topics) && topics.length > 0) {
            query.topic = {
                $in: topics.map(t => new RegExp(`^${normalizeText(t)}$`, "i"))
            };
        }

        const quizSets = await Quiz.find(query);

        if (!quizSets || quizSets.length === 0) {
            return res.status(404).json({
                message: "No quiz set found for selected criteria"
            });
        }

        let allQuestions = [];

        quizSets.forEach(set => {
            set.questions.forEach(q => {
                allQuestions.push({
                    _id: q._id,
                    quizSetId: set._id,

                    course: set.course,
                    department: set.department,
                    subject: set.subject,
                    unit: set.unit,
                    topic: set.topic,

                    question: q.question,
                    options: shuffleArray([...q.options])
                });
            });
        });

        if (allQuestions.length === 0) {
            return res.status(404).json({
                message: "No questions found in selected quiz set"
            });
        }

        const limit = Number(numberOfQuestions) || 10;

        const selectedQuestions = shuffleArray(allQuestions).slice(0, limit);

        const firstQuizSet = quizSets[0];

        res.json({
            message: "Quiz started successfully",
            totalQuestions: selectedQuestions.length,

            durationMinutes: firstQuizSet.durationMinutes,
            marksPerQuestion: firstQuizSet.marksPerQuestion,
            negativeMarks: firstQuizSet.negativeMarks,
            instructions:
                firstQuizSet.instructions ||
                "Read all questions carefully before starting the quiz.",

            questions: selectedQuestions
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ================= SUBMIT QUIZ =================

router.post("/submit", auth, async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                message: "Answers are required"
            });
        }

        let score = 0;
        let review = [];

        for (let ans of answers) {

            const quizSet = await Quiz.findById(ans.quizSetId);

            if (!quizSet) {
                continue;
            }

            const question = quizSet.questions.id(ans.questionId);

            if (!question) {
                continue;
            }

            const isCorrect = question.correctAnswer === ans.selectedAnswer;

            const marksPerQuestion = quizSet.marksPerQuestion;

            const negativeMarks = quizSet.negativeMarks;

            if (isCorrect) {
                score += marksPerQuestion;
            } else if (ans.selectedAnswer) {
                score -= negativeMarks;
            }

            review.push({
                question: question.question,
                selectedAnswer: ans.selectedAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                explanation: question.explanation || ""
            });
        }

        res.json({
            message: "Quiz submitted successfully",
            totalQuestions: answers.length,
            score,
            review
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ================= GET UNITS BY SUBJECT =================
router.get("/units", async (req, res) => {
    try {
        const { course, department, subject } = req.query;

        if (!course || !department || !subject) {
            return res.status(400).json({
                message: "Course, department and subject are required"
            });
        }

        const cleanCourse = normalizeText(course);
        const cleanDepartment = normalizeText(department);
        const cleanSubject = normalizeText(subject);

        const units = await Quiz.distinct("unit", {
            course: { $regex: `^${cleanCourse}$`, $options: "i" },
            department: { $regex: `^${cleanDepartment}$`, $options: "i" },
            subject: { $regex: `^${cleanSubject}$`, $options: "i" }
        });

        const cleanUnits = [...new Set(units.map(u => normalizeText(u)))];

        res.json(cleanUnits);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ================= GET TOPICS BY SUBJECT =================
router.get("/topics", async (req, res) => {
    try {
        const { course, department, subject } = req.query;

        if (!course || !department || !subject) {
            return res.status(400).json({
                message: "Course, department and subject required"
            });
        }

        const topics = await Quiz.distinct("topic", {
            course: { $regex: `^${normalizeText(course)}$`, $options: "i" },
            department: { $regex: `^${normalizeText(department)}$`, $options: "i" },
            subject: { $regex: `^${normalizeText(subject)}$`, $options: "i" }
        });

        const cleanTopics = topics
            .filter(t => t && t.trim() !== "")
            .map(t => normalizeText(t));

        res.json([...new Set(cleanTopics)]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= LIST QUIZ SETS =================
// Admin: all quiz sets
// Teacher: own quiz sets

router.get("/list", auth, roleAuth("admin", "teacher"), async (req, res) => {
    try {
        let query = {};

        if (req.user.role === "teacher") {
            query.createdBy = req.user.id;
        }

        const quizSets = await Quiz.find(query)
            .populate("createdBy", "firstName lastName email role")
            .populate("questions.createdBy", "firstName lastName email role")
            .sort({ createdAt: -1 });

        res.json(quizSets);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});


// ================= UPDATE QUIZ QUESTION =================
// Admin: any question
// Teacher: only own question

router.put(
    "/update/:quizSetId/:questionId",
    auth,
    roleAuth("admin", "teacher"),
    async (req, res) => {
        try {
            const quizSet = await Quiz.findById(req.params.quizSetId);

            if (!quizSet) {
                return res.status(404).json({
                    message: "Quiz set not found"
                });
            }

            const question = quizSet.questions.id(req.params.questionId);

            if (!question) {
                return res.status(404).json({
                    message: "Question not found"
                });
            }

            if (
                req.user.role === "teacher" &&
                question.createdBy.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    message: "You can update only your own quiz questions"
                });
            }

            const {
                question: questionText,
                options,
                correctAnswer,
                explanation
            } = req.body;

            if (questionText) {
                question.question = questionText;
            }

            if (options) {
                if (!Array.isArray(options) || options.length !== 4) {
                    return res.status(400).json({
                        message: "Exactly 4 options required"
                    });
                }

                question.options = options;
            }

            if (correctAnswer) {
                question.correctAnswer = correctAnswer;
            }

            question.explanation = explanation || "";

            await quizSet.save();

            res.json({
                message: "Quiz question updated successfully",
                quizSet
            });

        } catch (err) {
            res.status(500).json({
                error: err.message
            });
        }
    }
);


// ================= DELETE QUIZ QUESTION =================
// Admin: any question
// Teacher: own question

router.delete(
    "/delete/:quizSetId/:questionId",
    auth,
    roleAuth("admin", "teacher"),
    async (req, res) => {

        try {

            const quizSet =
                await Quiz.findById(req.params.quizSetId);

            if (!quizSet) {
                return res.status(404).json({
                    message: "Quiz set not found"
                });
            }

            const question =
                quizSet.questions.id(req.params.questionId);

            if (!question) {
                return res.status(404).json({
                    message: "Question not found"
                });
            }

            // Teacher can delete only own question
            if (
                req.user.role === "teacher" &&
                question.createdBy.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    message:
                        "You can delete only your own quiz questions"
                });
            }

            // Remove question
            question.deleteOne();

            // If no questions left → delete whole quiz set
            if (quizSet.questions.length === 0) {

                await Quiz.findByIdAndDelete(quizSet._id);

                return res.json({
                    message:
                        "Question deleted and empty quiz set removed"
                });
            }

            await quizSet.save();

            res.json({
                message: "Quiz question deleted successfully"
            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });
        }
    }
);

// ================= COMMON SEARCH QUIZ =================
// Student/Admin/Teacher all can search

router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            const allQuiz = await Quiz.find().sort({ createdAt: -1 });
            return res.json(allQuiz);
        }
        const regex = new RegExp(query, "i");

        const quizSets = await Quiz.find({
            $or: [
                { course: regex },
                { department: regex },
                { subject: regex },
                { unit: regex },
                { topic: regex },
                { "questions.question": regex }
            ]
        })
            .populate("createdBy", "firstName lastName email role")
            .populate("questions.createdBy", "firstName lastName email role")
            .sort({ createdAt: -1 });

        res.json(quizSets);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ================= UPDATE QUIZ SETTINGS =================

router.put(
    "/settings/:quizSetId",
    auth,
    roleAuth("admin", "teacher"),
    async (req, res) => {
        try {
            const { durationMinutes, marksPerQuestion, negativeMarks, instructions } = req.body;

            if (
                !durationMinutes ||
                Number(durationMinutes) <= 0 ||
                !marksPerQuestion ||
                Number(marksPerQuestion) <= 0 ||
                negativeMarks === undefined ||
                negativeMarks === "" ||
                Number(negativeMarks) < 0
            ) {
                return res.status(400).json({
                    message: "Please enter valid quiz settings"
                });
            }

            const quizSet = await Quiz.findById(req.params.quizSetId);

            if (!quizSet) {
                return res.status(404).json({
                    message: "Quiz set not found"
                });
            }

            if (
                req.user.role === "teacher" &&
                quizSet.createdBy.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    message: "You can update only your own quiz set settings"
                });
            }

            quizSet.durationMinutes = Number(durationMinutes);
            quizSet.marksPerQuestion = Number(marksPerQuestion);
            quizSet.negativeMarks = Number(negativeMarks);
            quizSet.instructions = instructions || quizSet.instructions;

            await quizSet.save();

            res.json({
                message: "Quiz settings updated successfully",
                quizSet
            });

        } catch (err) {
            res.status(500).json({
                error: err.message
            });
        }
    }
);

// ================= DOWNLOAD QUIZ =================

router.put("/download/:id", auth, async (req, res) => {

    try {

        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found"
            });
        }

        // Download count increase
        quiz.downloadCount += 1;
        await quiz.save();

        res.json({
            message: "Quiz downloaded successfully",
            quiz
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

/*// ================= DOWNLOAD COUNT =================

router.put("/download/:id", async (req, res) => {

    try {

        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found"
            });
        }

        quiz.downloadCount += 1;

        await quiz.save();

        res.json({
            message: "Download count updated"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});*/

// ================= DOWNLOAD QUIZ PDF =================

async function downloadQuiz(id) {

    console.log("Token =", token);
console.log("Authorization =", `Bearer ${token}`);

    if (!user || !token) {
        showWarningPopup("Please login first to download quiz");
        return;
    }

    try {

        // Download Count Update
        const countRes = await fetch(
            `${API_BASE_URL}/api/quiz/download/${id}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!countRes.ok) {
            showErrorPopup("Failed to update download count");
            return;
        }

        // Download PDF
        const pdfRes = await fetch(
            `${API_BASE_URL}/api/quiz/pdf/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!pdfRes.ok) {
            showErrorPopup("Download failed");
            return;
        }

        const blob = await pdfRes.blob();

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = "Quiz.pdf";

        document.body.appendChild(a);

        a.click();

        a.remove();

        window.URL.revokeObjectURL(url);

    } catch (err) {

        console.log(err);

        showErrorPopup("Download failed");

    }

}
module.exports = router;