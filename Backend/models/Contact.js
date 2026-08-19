const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },

    status: {
        type: String,
        enum: ["new", "read", "replied"],
        default: "new"
    }

}, { timestamps: true });

module.exports = mongoose.model("Contact", contactSchema);