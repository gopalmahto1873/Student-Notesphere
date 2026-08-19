const mongoose = require("mongoose");

const pyqSchema = new mongoose.Schema({

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

    semester: {
        type: String,
        required: true,
        trim: true,
        enum: ["Sem1", "Sem2", "Sem3", "Sem4", "Sem5", "Sem6", "Sem7", "Sem8"]
    },

    subject: {
        type: String,
        required: true,
        trim: true
    },

    year: {
        type: Number,
        required: true,
        min: 2020,
        max: new Date().getFullYear() + 1
    },

    examType: {
        type: String,
        enum: ["Mid Semester", "End Semester", "Sessional"],
        required: true
    },

    description: {
        type: String,
        trim: true,
        default: ""
    },

    file: {
        type: String,
        required: true
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

    customId: {
        type: String,
        unique: true
    }
}, { timestamps: true });

pyqSchema.index({
    course: 1,
    department: 1,
    semester: 1,
    subject: 1,
    year: 1
});

module.exports = mongoose.model("PYQ", pyqSchema);