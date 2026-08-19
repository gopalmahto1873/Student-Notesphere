const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,  // ✔ FIXED EMAIL
                pass: process.env.EMAIL_PASS  // ✔ App Password (no space)
            }
        });

        await transporter.sendMail({
            from: `"Student Notesphere" <studentnotesphere@gmail.com>`,
            to,
            subject,
            text
        });

        console.log("✅ Email sent");

    } catch (err) {
        console.log("❌ Email error:", err.message);
        throw err;
    }
};

module.exports = sendEmail;