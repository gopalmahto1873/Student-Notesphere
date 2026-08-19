const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateCustomId = require("../utils/generateCustomId");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ================= MULTER CONFIG =================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG and PNG images are allowed"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// ================= REGISTER =================
router.post(
    "/register",
    upload.fields([
        {
            name: "profilePhoto",
            maxCount: 1
        },
        {
            name: "idProof",
            maxCount: 1
        }
    ]),
    async (req, res) => {
    try {
        
        const body = req.body || {};
        
        console.log(req.body);

        const firstName = body.firstName;
        const middleName = body.middleName;
        const lastName = body.lastName;
        const dob = body.dob;
        const university = body.university;
        const department = body.department;
        const session = body.session;
        const email = body.email;
        const password = body.password;
        const studentType = body.studentType;
        const role = body.role;

        const lastSession = body.lastSession;
        const lastUniversity = body.lastUniversity;
        const passingYear = body.passingYear;
        const currentStatus = body.currentStatus;

        // Teacher Fields
        const qualification = body.qualification;
        const subject = body.subject;
        const experience = body.experience;
        const institution = body.institution;

        // ================= AGE VALIDATION =================

        const age =
            new Date().getFullYear() -
            new Date(dob).getFullYear();

        if (role === "student" && age < 15) {
            return res.status(400).json({
                message: "Student must be at least 15 years old."
            });
        }

        if (role === "teacher" && age < 22) {
            return res.status(400).json({
                message: "Teacher must be at least 22 years old."
            });
        }

        // Common Validation
        if (!firstName || !dob || !role || !email || !password) {
            return res.status(400).json({
                message: "Required form data missing."
            });
        }

        // Regular Student Validation
        if (role === "student") {

            if (!studentType) {
                return res.status(400).json({
                    message: "Please select Student Type."
                });
            }

            // Regular Student Validation
            if ( studentType === "Regular" &&
                (!session || !university || !department)
            ) {
                return res.status(400).json({
                    message: "Please fill all Regular Student details."
                });
            }
        

            // Ex Student Validation
            if (
                studentType === "Ex-Student" &&
                (
                    !lastSession ||
                    !lastUniversity ||
                    !passingYear ||
                    !currentStatus
                )
            ) {
                return res.status(400).json({
                    message: "Please fill all Ex-Student details."
                });
            }
        }
        // ================= TEACHER VALIDATION =================
        if (role === "teacher") {

            if (
                !qualification ||
                !subject ||
                !experience ||
                !institution
            ) {
                return res.status(400).json({
                    message: "Please complete teacher details."
                });
            }

        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const customId =await generateCustomId(User, "SN-USER-");

        const photoUrl =
            req.files?.profilePhoto
                ? `http://localhost:5000/uploads/${req.files.profilePhoto[0].filename}`
                : "";

        const idProofUrl =
            req.files?.idProof
                ? `http://localhost:5000/uploads/${req.files.idProof[0].filename}`
                : "";

        // ================= CREATE USER OBJECT =================

        const userData = {

            firstName,
            middleName,
            lastName,
            dob,

            email,
            password: hashedPassword,

            role,
            photo: photoUrl,

            customId,

            isProfileComplete: true

        };

        // ================= STUDENT DATA =================

        if (role === "student") {

            userData.studentType = studentType;

            if (studentType === "Regular") {

                userData.university = university;
                userData.department = department;
                userData.session = session;

            }

            if (studentType === "Ex-Student") {

                userData.lastUniversity = lastUniversity;
                userData.lastSession = lastSession;
                userData.passingYear = passingYear;
                userData.currentStatus = currentStatus;

            }

            userData.approvalStatus = "approved";

        }

        // ================= TEACHER DATA =================

        if (role === "teacher") {

            userData.qualification = qualification;
            userData.subject = subject;
            userData.experience = experience;
            userData.institution = institution;

            userData.idProof = idProofUrl;

            userData.approvalStatus = "pending";

        }

        // ================= ADMIN DATA =================

        if (role === "admin") {

            userData.approvalStatus = "approved";

        }

        const user = new User(userData);

        await user.save();
        // ================= SEND WELCOME EMAIL =================
        try {

            if (user.role === "teacher") {

                await sendEmail(

                    user.email,

                    "Teacher Registration Submitted - Student Notesphere",

        `Hello ${user.firstName},

        Your Teacher Registration has been submitted successfully.

        Your Account Details

        User ID : ${user.customId}
        Email : ${user.email}

        Your account is currently under Admin Verification.

        You will be able to login only after your account is approved.

        We will notify you by email after approval.

        Regards,
        Student Notesphere Team`

                );

            }

            else {

                await sendEmail(

                    user.email,

                    "Registration Completed - Student Notesphere",

        `Hello ${user.firstName},

        Your registration has been completed successfully.

        Your Account Details

        User ID : ${user.customId}
        Email : ${user.email}

        You can now login and access Notes, Quiz and PYQ.

        Regards,
        Student Notesphere Team`

                );

            }

        }
        catch(emailErr){

            console.log("Registration email failed:", emailErr.message);
        }

        // ================= RESPONSE =================
        res.status(201).json({
            message: "Registration successful"
        });
            } catch (err) {

        console.log("REGISTER ERROR:", err);

        res.status(500).json({
            error: err.message
        });
    }
});
    
// ================= LOGIN =================
router.post("/login", async (req, res) => {
    console.log("========== LOGIN ROUTE ==========");
    console.log(req.body);
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.password) {
            return res.status(400).json({ message: "Please login using Google" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }
        
        // ================= TEACHER APPROVAL =================

        if (user.role === "teacher") {

            if (user.approvalStatus === "pending") {

                return res.status(403).json({
                    message: "Your account is waiting for Admin approval."
                });

            }

            if (user.approvalStatus === "rejected") {

                const token = jwt.sign(
                    {
                        id: user._id,
                        role: user.role
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "1d" }
                );

                return res.status(403).json({

                    status: "rejected",

                    token,

                    user,

                    message: `Your account has been rejected.

            Reason:
            ${user.rejectionReason}

            Please update your ID Proof and submit again.`

                });

            }
        }
        // ================= SAVE LAST LOGIN =================
        user.lastLogin = new Date();

        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const loginTime = new Date().toLocaleString();

        try {
            await sendEmail(
                user.email,
                "Login Alert - Student Notesphere",
                `Hello ${user.firstName || "User"},

            Your account has been logged in successfully.

            Login Details:
            Email: ${user.email}
            Role: ${user.role}
            Time: ${loginTime}

            If this was not you, please reset your password immediately.

            Regards,
            Student Notesphere Team`
            );
        } catch (emailError) {
            console.log("Login email failed but login allowed:", emailError.message);
        }

        res.json({
            message: "Login successful",
            token,
            user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= GOOGLE LOGIN =================
router.post("/google-login", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: "Google credential not provided" });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Invalid Google account data" });
        }

        const { email, given_name, family_name, picture } = payload;

        let user = await User.findOne({ email });

        if (
            user.role === "teacher" &&
            user.approvalStatus === "pending"
        ) {
            return res.status(403).json({
                message: "Your account is waiting for Admin approval."
            });
        }

        if (
            user.role === "teacher" &&
            user.approvalStatus === "rejected"
        ) {
            return res.status(403).json({
                message: `Your account has been rejected.

                Reason: ${user.rejectionReason}`
            });
        }

        if (!user) {

            const customId =await generateCustomId(User, "SN-USER-");

            user = new User({
                customId: customId,
                firstName: given_name || "",
                middleName: "",
                lastName: family_name || "",
                dob: "",
                university: "",
                department: "",
                session: "",
                //semester: "",
                studentType: "Regular",
                email: email,
                password: "",
                role: "student",
                photo: picture || "",
                
                googleId: payload.sub,
                isGoogleUser: true,
                isProfileComplete: false
            });

            await user.save();
        } else {
            if (!user.photo && picture) user.photo = picture;
            if (!user.firstName && given_name) user.firstName = given_name;
            if (!user.lastName && family_name) user.lastName = family_name;

            if (!user.googleId) {
                user.googleId = payload.sub;
            }

            user.isGoogleUser = true;

            await user.save();
        }

        // ================= SAVE LAST LOGIN =================
        user.lastLogin = new Date();

        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Google login successful",
            token,
            user
        });

    } catch (err) {

        console.log("GOOGLE LOGIN ERROR:", err);

        res.status(500).json({
            message: "Google login failed",
            error: err.message
        });
    }
});

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetOTP = otp;
        user.resetOTPExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        console.log("OTP:", otp);

        // अभी email fail होने पर भी OTP terminal से test कर सकते हो
        try {
            await sendEmail(
    user.email,
    "Password Reset OTP - Student Notesphere",
    `Hello,

You requested to reset your password for Student Notesphere.

Your OTP is: ${otp}

This OTP is valid for 10 minutes.
Do not share this OTP with anyone.

If you did not request this, please ignore this email.

Regards,
Student Notesphere support Team`
);

            return res.json({ message: "OTP sent successfully to your registered email" });

        } catch (emailError) {
            console.log("Email failed, use terminal OTP:", emailError.message);

            return res.json({
                message: "Email failed. OTP generated. Check terminal."
            });
        }

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.resetOTP !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.resetOTPExpire < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        res.json({ message: "OTP verified" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email, OTP and new password are required"
            });
        }

        const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

        if (!passwordPattern.test(newPassword)) {
            return res.status(400).json({
            message: "Password must be at least 8 characters, include one capital letter and one special character"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.resetOTP) {
            return res.status(400).json({ message: "Please generate OTP first" });
        }

        if (user.resetOTP !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.resetOTPExpire < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOTP = undefined;
        user.resetOTPExpire = undefined;

        await user.save();

        res.json({ message: "Password reset successful" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= COMPLETE PROFILE =================

router.put(
    "/complete-profile",
    auth,
    async (req, res) => {

        try {

            const {
                dob,
                university,
                department,
                session,
                studentType
            } = req.body;

            // Validation
            if (
                !dob ||
                !university||
                !department ||
                !session ||
                
                !studentType
            ) {

                return res.status(400).json({
                    message:
                    "All fields are required"
                });
            }

            // Find user
            const user =
                await User.findById(req.user.id);

            if (!user) {

                return res.status(404).json({
                    message: "User not found"
                });
            }

            // Update profile
            user.dob = dob;

            user.university = university;

            user.department = department;

            user.session = session;

            //user.semester = semester;

            user.studentType = studentType;

            user.isProfileComplete = true;

            await user.save();

            res.json({
                message:
                "Profile completed successfully",

                user
            });

        } catch (err) {

            console.log(
                "COMPLETE PROFILE ERROR:",
                err
            );

            res.status(500).json({
                error: err.message
            });
        }
    }
);

// ================= RECENT LOGIN USERS =================

router.get(
    "/recent-logins",
    auth,
    roleAuth("admin"),
    async(req,res)=>{

        try{

            const users = await User.find()

                .sort({
                    lastLogin:-1
                })

                .limit(5)

                .select(
                    "firstName lastName lastLogin role"
                );

            res.json(users);

        }

        catch(err){

            res.status(500).json({
                error:err.message
            });

        }

    }
);

// ================= APPROVE TEACHER =================

router.put(
    "/approve-teacher/:id",
    auth,
    roleAuth("admin"),
    async (req, res) => {

        try {

            const teacher =
                await User.findById(req.params.id);

            if (!teacher) {

                return res.status(404).json({
                    message: "Teacher not found"
                });

            }

            teacher.approvalStatus = "approved";

            teacher.approvedBy = req.user.id;

            teacher.approvedAt = new Date();

            await teacher.save();

            try {

                await sendEmail(

                    teacher.email,

                    "Teacher Account Approved - Student Notesphere",

            `Hello ${teacher.firstName},

            Congratulations!

            Your Teacher Account has been approved successfully.

            You can now login to Student Notesphere.

            Thank you.

            Regards,
            Student Notesphere Team`

                );

            }
            catch(err){

                console.log(err);

            }

            res.json({

                message:
                "Teacher approved successfully."

            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    }
);

// ================= REJECT TEACHER =================

router.put(
    "/reject-teacher/:id",
    auth,
    roleAuth("admin"),
    async (req, res) => {
        const { reason } = req.body;

        try {

            const teacher = await User.findById(req.params.id);

            if (!teacher) {

                return res.status(404).json({
                    message: "Teacher not found"
                });

            }

            teacher.approvalStatus = "rejected";

            teacher.rejectionReason = reason || "Rejected by Admin";

            await teacher.save();
            
            try {

                await sendEmail(

                    teacher.email,

                    "Teacher Account Rejected - Student Notesphere",

            `Hello ${teacher.firstName},

            Your Teacher Account has been rejected.

            Reason

            ${teacher.rejectionReason}

            If you think this is incorrect, please contact the Administrator.

            Regards,
            Student Notesphere Team`

                );

            }
            catch(err){

                console.log(err);

            }

            res.json({

                message:
                "Teacher rejected successfully."

            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    }
);


module.exports = router;