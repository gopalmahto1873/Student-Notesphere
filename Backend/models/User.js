const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },

    middleName: {
        type: String,
        trim: true,
        default: ""
    },

    lastName: {
        type: String,
        trim: true,
        default: ""
    },

    dob: {
        type: Date,
        default: null
    },

    university: {
        type: String,
        trim: true,
        default: ""
    },

    department: {
        type: String,
        trim: true,
        default: ""
    },

    session: {
        type: String,
        trim: true,
        default: ""
    },

    studentType: {
        type: String,
        enum: ["Regular", "Ex-Student"],
        default: "Regular"
    },

    lastSession: {
        type: String,
        trim: true,
        default: ""
    },

    lastUniversity: {
        type: String,
        trim: true,
        default: ""
    },

    passingYear: {
        type: Number,
        default: null
    },

    currentStatus: {
        type: String,
        trim: true,
        default: ""
    },

        // ================= TEACHER DETAILS =================

    qualification: {
        type: String,
        trim: true,
        default: ""
    },

    subject: {
        type: String,
        trim: true,
        default: ""
    },

    experience: {
        type: Number,
        default: null
    },

    institution: {
        type: String,
        trim: true,
        default: ""
    },

    designation: {
        type: String,
        trim: true,
        default: ""
    },

    idProof: {
        type: String,
        default: ""
    },

    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },

    teacherApproved: {
        type: Boolean,
        default: false
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    approvedAt: {
        type: Date,
        default: null
    },

    rejectionReason: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // ================= LAST LOGIN =================

    lastLogin: {
        type: Date,
        default: null
    },

    password: {
        type: String,
        default: ""
    },

    role: {
        type: String,
        enum: ["student", "teacher", "admin"],
        default: "student"
    },

    photo: {
        type: String,
        default: ""
    },

    googleId: {
        type: String,
        default: ""
    },

    isGoogleUser: {
        type: Boolean,
        default: false
    },

    isProfileComplete: {
        type: Boolean,
        default: false
    },

    customId: {
        type: String,
        unique: true
    },

    resetOTP: {
        type: String,
        default: ""
    },

    resetOTPExpire: {
        type: Date,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);