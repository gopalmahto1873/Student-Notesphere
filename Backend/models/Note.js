const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({

    // UG / PG
    course: {
        type: String,
        enum: ["UG", "PG"],
        required: true
    },

    // BCA / BBA / MCA / MBA
    department: {
        type: String,
        required: true,
        trim: true
    },

    // Java / DBMS / Accounting etc.
    subject: {
        type: String,
        required: true,
        trim: true
    },

    // Optional: Sem1, Sem2...
    semester: {
        type: String,
        enum: [
            "",
            "Sem1",
            "Sem2",
            "Sem3",
            "Sem4",
            "Sem5",
            "Sem6"
        ],
        default: "",
        trim: true
    },

    // Optional: Unit 1, Unit 2...
    unit: {
        type: String,
        default: "",
        trim: true
    },

    // Optional: Topic name
    topic: {
        type: String,
        default: "",
        trim: true
    },

    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },

    fileType: {
        type: String,
        enum: [
            "pdf",
            "image",
            "text"
        ],
        required: true
    },

    fileMimeType: {
        type: String,
        default: ""
    },

    fileUrl: {
        type: String,
        required: true
    },

    fileSize: {
        type: Number,
        default: 0
    },

    downloadCount: {
        type: Number,
        default: 0
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    uploadedByRole: {
        type: String,
        default: ""
    },

    customId: {
        type: String,
        unique: true
    }

}, { timestamps: true });

noteSchema.index({
    department: 1,
    subject: 1,
    semester: 1
});

module.exports = mongoose.model("Note", noteSchema);