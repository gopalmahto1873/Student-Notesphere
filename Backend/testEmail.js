const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "gopaldspmu2426@gmail.com",
            pass: "tbvphthgqznjbzdx"
        }
    });

    await transporter.sendMail({
        from: "gopaldspmu2426@gmail.com",
        to,
        subject,
        text
    });

    console.log("✅ Email sent");
};

module.exports = sendEmail;
