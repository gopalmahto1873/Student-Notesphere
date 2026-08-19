const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Contact = require("../models/Contact");

router.post("/send", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email"
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                message: "Message should not exceed 1000 characters"
            });
        }

        const contact = new Contact({
            name,
            email,
            message
        });

        await contact.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: "Student Notesphere - New Feedback",
            text: `
Name: ${name}
Email: ${email}

Message:
${message}
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            message: "Feedback sent successfully"
        });

    } catch (err) {
        console.log("CONTACT ERROR:", err);

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;