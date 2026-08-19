const mongoose = require("mongoose");

// ================= QUESTION SUB-SCHEMA =================
const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true
        },

        options: {
            type: [
                {
                    type: String,
                    required: true,
                    trim: true
                }
            ],
            required: true,
            validate: {
                validator: function (arr) {
                    return (
                        arr.length === 4 &&
                        arr.every(option => option.trim() !== "")
                    );
                },
                message: "Exactly 4 non-empty options required"
            }
        },

        correctAnswer: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (value) {
                    return this.options.includes(value);
                },
                message: "Correct answer must be one of the options"
            }
        },

        explanation: {
            type: String,
            default: "",
            trim: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        createdByRole: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);


// ================= QUIZ SET SCHEMA =================
const quizSchema = new mongoose.Schema(
    {
        course: {
            type: String,
            enum: ["UG", "PG"],
            required: true
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        unit: {
            type: String,
            required: true,
            trim: true,
            enum: ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"]
        },

        topic: {
            type: String,
            default: "",
            trim: true
        },

        durationMinutes: {
            type: Number,
            required: true,
            min: 1
        },

        marksPerQuestion: {
            type: Number,
            required: true,
            min: 1
        },

        negativeMarks: {
            type: Number,
            required: true,
            min: 0
        },

        // Quiz Instructions
        instructions: {
            type: String,
            default: "Read all questions carefully before starting."
        },

        questions: {
            type: [questionSchema],
            default: []
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        createdByRole: {
            type: String,
            default: ""
        },

        downloadCount: {
    type: Number,
    default: 0
},

        customId: {
            type: String,
            unique: true
        }
    },
    { timestamps: true }
);


// Prevent duplicate quiz set for same course/department/subject/unit/topic
quizSchema.index(
    {
        course: 1,
        department: 1,
        subject: 1,
        unit: 1,
        topic: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("Quiz", quizSchema);