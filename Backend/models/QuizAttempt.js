const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({

    quizSetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    studentName: String,

    email: String,

    department: String,

    quizMode: {
        type: String,
        enum: ["practice", "exam"],
        default: "practice"
    },

    showAnswer: {
        type: Boolean,
        default: true
    },

    totalQuestions: Number,

    attempted: Number,

    correct: Number,

    wrong: Number,

    skipped: Number,

    score: Number,

    review: [],

    submittedAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

module.exports =
    mongoose.model(
        "QuizAttempt",
        quizAttemptSchema
    );