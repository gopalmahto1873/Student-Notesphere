const express = require("express");
const router = express.Router();
//const checkTeacherApproval = require("../middleware/checkTeacherApproval");
const multer = require("multer");
const User = require("../models/User");
const Note = require("../models/Note");
const Quiz = require("../models/Quiz");
const PYQ = require("../models/PYQ");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function normalizeText(text) {

    if (!text) return "";

    const upperWords = [
        "UG",
        "PG",
        "BCA",
        "BBA",
        "MCA",
        "MBA",
        "DBMS",
        "OS",
        "AI",
        "IT",
        "HR"
    ];

    return text
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map(word => {

            const upper = word.toUpperCase();

            if (upperWords.includes(upper)) {
                return upper;
            }

            return (
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase()
            );

        })
        .join(" ");
}

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
    storage,
    fileFilter
});

// ================= GET ALL USERS =================
router.get("/", auth, roleAuth("admin"), async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= UPDATE USER ROLE =================
router.put("/role/:id", auth, roleAuth("admin"), async (req, res) => {
    try {
        const { role } = req.body;

        if (!["student", "teacher", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { role: role },
            { new: true }
        ).select("-password");

        res.json({
            message: "User role updated successfully",
            user: updatedUser
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= GET PROFILE =================
router.get("/profile/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        .populate(
            "approvedBy",
            "firstName lastName email"
        )

        .select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= UPDATE PROFILE =================
router.put("/profile/update/:id", auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const oldUser = await User.findById(userId);
        let logoutRequired = false;

        if (!oldUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const {
            firstName,
            middleName,
            lastName,
            dob,

            studentType,

            university,
            department,
            session,

            lastUniversity,
            lastSession,
            passingYear,
            currentStatus,

            // Teacher
            qualification,
            subject,
            experience,
            institution,
            designation

        } = req.body;


        const cleanFirstName = normalizeText(firstName);

        const cleanMiddleName = middleName
            ? normalizeText(middleName)
            : "";

        const cleanLastName = lastName
            ? normalizeText(lastName)
            : "";

        const cleanDepartment = normalizeText(department);

        const cleanUniversity =
            university
                ? normalizeText(university)
                : "";

        const cleanLastUniversity =
            lastUniversity
                ? normalizeText(lastUniversity)
                : "";

        const cleanCurrentStatus =
            currentStatus
                ? normalizeText(currentStatus)
                : "";
        // ================= COMMON =================

        if (!firstName || !dob) {

            return res.status(400).json({
                message: "Please complete all required profile details."
            });

        }

        // ================= STUDENT VALIDATION =================

        if (oldUser.role === "student") {

            if (!studentType) {

                return res.status(400).json({
                    message: "Please select Student Type."
                });

            }

            if (
                studentType === "Regular" &&
                (
                    !university ||
                    !department ||
                    !session
                )
            ) {

                return res.status(400).json({
                    message: "Please fill all Regular Student details."
                });

            }

            if (
                studentType === "Ex-Student" &&
                (
                    !lastUniversity ||
                    !lastSession ||
                    !passingYear
                )
            ) {

                return res.status(400).json({
                    message: "Please fill all Ex Student details."
                });

            }

        }

        const updateData = {

            firstName: cleanFirstName,
            middleName: cleanMiddleName,
            lastName: cleanLastName,
            dob,
            studentType,
            isProfileComplete: true
        };

        // ================= TEACHER =================

        if (oldUser.role === "teacher") {

            updateData.qualification =
                qualification
                    ? normalizeText(qualification)
                    : "";

            updateData.subject =
                subject
                    ? normalizeText(subject)
                    : "";

            updateData.experience =
                experience || null;

            updateData.institution =
                institution
                    ? normalizeText(institution)
                    : "";

            updateData.designation =
                designation
                    ? normalizeText(designation)
                    : "";
            
            if (
                qualification !== oldUser.qualification ||
                subject !== oldUser.subject ||
                institution !== oldUser.institution
            ) {

                updateData.approvalStatus = "pending";
                updateData.teacherApproved = false;
                updateData.rejectionReason = "";
                updateData.approvedBy = null;
                updateData.approvedAt = null;

                logoutRequired = true;
            }

        }


        if (oldUser.role === "student") {

            // ================= REGULAR =================

            if (studentType === "Regular") {

                updateData.university = cleanUniversity;
                updateData.department = cleanDepartment;
                updateData.session = session.trim();
                updateData.lastUniversity = "";
                updateData.lastSession = "";
                updateData.passingYear = null;
                updateData.currentStatus = "";

            }

            // ================= EX STUDENT =================

            else {

                updateData.university = "";
                updateData.department = "";
                updateData.session = "";

                updateData.lastUniversity = cleanLastUniversity;
                updateData.lastSession = lastSession.trim();
                updateData.passingYear = passingYear;
                updateData.currentStatus = cleanCurrentStatus;

            }

        }


        // ================= SAVE =================

        const updatedUser = await User.findByIdAndUpdate(

            userId,
            updateData,
            { new: true }
        ).select("-password");

        try {
            if (
                oldUser.isProfileComplete === false &&
                updatedUser.isProfileComplete === true
            ) {

                await sendEmail(
                    updatedUser.email,
                    "Registration Completed - Student Notesphere",
                    `Hello ${updatedUser.firstName},

Your registration has been completed successfully.

Your Account Details:
User ID: ${updatedUser.customId}
Email: ${updatedUser.email}
Role: ${updatedUser.role}

You can now access Notes, Quiz and PYQ sections.

Regards,
Student Notesphere Team`
                );
            } else {
                await sendEmail(
                    updatedUser.email,
                    "Profile Updated - Student Notesphere",
                    `Hello ${updatedUser.firstName},

Your profile details have been updated successfully.

If this change was not made by you, please contact support immediately.

Regards,
Student Notesphere Team`
                );
            }
        } catch (emailErr) {
            console.log("Profile email failed:", emailErr.message);
        }

        console.log("Logout Required :", oldUser.role === "teacher");
console.log(updatedUser.approvalStatus);
console.log("Sending Response to Frontend");
        res.json({

            message: "Profile updated successfully",
            logoutRequired,
            user: updatedUser

        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ================= UPDATE ID PROOF =================

router.put(
    "/profile/id-proof/:id",
    auth,
    upload.single("idProof"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    message: "Please select an ID Proof."
                });

            }

            const idProofUrl =
                `http://localhost:5000/uploads/${req.file.filename}`;

            const teacher = await User.findById(req.params.id);

            if (!teacher) {
                return res.status(404).json({
                    message: "User not found."
                });
            }

            const updateData = {idProof: idProofUrl};

            // Sirf teacher ke liye approval reset hoga
            if (teacher.role === "teacher") {

                updateData.approvalStatus = "pending";
                updateData.teacherApproved = false;
                updateData.rejectionReason = "";
                updateData.approvedBy = null;
                updateData.approvedAt = null;

            }

            console.log("ID Proof Update User ID:", req.params.id);
            const updatedUser =
                await User.findByIdAndUpdate(
                    req.params.id,
                    updateData,
                    { new: true }
                ).select("-password");
            
            const checkUser = await User.findById(req.params.id);

            console.log("Approval Status :", checkUser.approvalStatus);
            console.log("Teacher Approved :", checkUser.teacherApproved);
            console.log("Rejection Reason :", checkUser.rejectionReason);

            res.json({

                message:
                    "ID Proof uploaded successfully. Waiting for Admin approval.",

                logoutRequired: teacher.role === "teacher",

                user: updatedUser

            });

        }

        catch (err) {
            res.status(500).json({
                error: err.message
            });
        }

    }
);

// ================= CHANGE PASSWORD =================
router.put("/profile/password/:id", auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Wrong current password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= UPDATE PROFILE PHOTO =================
router.put("/profile/photo/:id", auth, upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please select a photo" });
        }

        const photoUrl = `http://localhost:5000/uploads/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { photo: photoUrl },
            { new: true }
        ).select("-password");

        res.json({
            message: "Profile photo updated successfully",
            user: updatedUser
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= ADMIN STATS =================
router.get("/stats", auth, roleAuth("admin"), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        const students = await User.countDocuments({ role: "student" });
        const teachers = await User.countDocuments({ role: "teacher" });
        const admins = await User.countDocuments({ role: "admin" });

        const totalNotes = await Note.countDocuments();
        const totalQuizzes = await Quiz.countDocuments();
        const totalPYQ = await PYQ.countDocuments();

        const departments = await Note.distinct("department");
        const totalDepartments = departments.length;

        res.json({
            totalUsers,
            students,
            teachers,
            admins,
            totalNotes,
            totalQuizzes,
            totalPYQ,
            totalDepartments
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});


// ================= EXPORT USERS EXCEL =================

router.get("/export/users", auth, roleAuth("admin"), async (req, res) => {
    try {

        const users = await User.find().select("-password");

        const data = users.map(user => ({
            UserID: user.customId,
            Name: `${user.firstName || ""} ${user.lastName || ""}`,
            Email: user.email,
            Role: user.role,
            Department: user.department || "",
            Session: user.session || "",
            Semester: user.semester || "",
            Status: user.isActive ? "Active" : "Inactive"
        }));

        const workbook = XLSX.utils.book_new();

        const worksheet = XLSX.utils.json_to_sheet(data);

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Users"
        );

        const buffer = XLSX.write(
            workbook,
            {
                type: "buffer",
                bookType: "xlsx"
            }
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=Users_Report.xlsx"
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(buffer);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
});


// ================= RECENT LOGIN USERS =================

router.get( "/recent-logins", auth, roleAuth("admin"),
    async (req, res) => {

        try {

            const users = await User.find({
                lastLogin: {
                    $ne: null
                }
            })

            .sort({
                lastLogin: -1
            })

            .limit(5)

            .select(
                "firstName lastName lastLogin role"
            );

            res.json(users);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    }
);

// ================= RECENT ACTIVITIES =================

router.get(
    "/recent-activities",
    auth,
    roleAuth("admin"),
    async (req, res) => {

        try {

            const notes = await Note.find()
                .sort({ createdAt: -1 })
                .limit(5);

            const quizzes = await Quiz.find()
                .sort({ createdAt: -1 })
                .limit(5);

            const pyqs = await PYQ.find()
                .sort({ createdAt: -1 })
                .limit(5);

            let activities = [];

            notes.forEach(note => {
                activities.push({
                    type: "Note",
                    title: note.title,
                    date: note.createdAt
                });
            });

            quizzes.forEach(quiz => {
                activities.push({
                    type: "Quiz",
                    title: quiz.topic || quiz.subject,
                    date: quiz.createdAt
                });
            });

            pyqs.forEach(pyq => {
                activities.push({
                    type: "PYQ",
                    title: pyq.topic || pyq.subject,
                    date: pyq.createdAt
                });
            });

            activities.sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );

            res.json(
                activities.slice(0, 10)
            );

        }
        catch (err) {

            res.status(500).json({
                error: err.message
            });

        }
    }
);

// ================= EXPORT USERS EXCEL =================

router.get(
    "/export-users",
    auth,
    roleAuth("admin"),
    async(req,res)=>{

        try{

            const users = await User.find();

            const workbook =
                new ExcelJS.Workbook();

            const worksheet =
                workbook.addWorksheet(
                    "Users"
                );

            worksheet.columns = [

                {
                    header:"Name",
                    key:"name",
                    width:25
                },

                {
                    header:"Email",
                    key:"email",
                    width:30
                },

                {
                    header:"Department",
                    key:"department",
                    width:20
                },

                {
                    header:"Role",
                    key:"role",
                    width:15
                }

            ];

            users.forEach(user=>{

                worksheet.addRow({

                    name:
                    `${user.firstName || ""}
                    ${user.lastName || ""}`,

                    email:user.email,

                    department:
                    user.department || "-",

                    role:user.role

                });

            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

            res.setHeader(
                "Content-Disposition",
                "attachment; filename=users-report.xlsx"
            );

            await workbook.xlsx.write(res);

            res.end();

        }

        catch(err){

            res.status(500).json({
                error:err.message
            });

        }

    }
);

// ================= DOWNLOAD DASHBOARD REPORT PDF =================

router.get(
    "/dashboard-report",
    auth,
    roleAuth("admin"),
    async (req, res) => {

        try {

            const totalUsers =
                await User.countDocuments();

            const students =
                await User.countDocuments({
                    role: "student"
                });

            const teachers =
                await User.countDocuments({
                    role: "teacher"
                });

            const admins =
                await User.countDocuments({
                    role: "admin"
                });

            const totalNotes =
                await Note.countDocuments();

            const totalQuiz =
                await Quiz.countDocuments();

            const totalPYQ =
                await PYQ.countDocuments();

            const doc =
                new PDFDocument();

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                "attachment; filename=dashboard-report.pdf"
            );

            doc.pipe(res);

            // ================= TITLE =================

            doc
                .fontSize(20)
                .text(
                    "Student Notesphere Dashboard Report",
                    {
                        align: "center"
                    }
                );

            doc.moveDown();

            // ================= USER DATA =================

            doc
                .fontSize(14)
                .text(
                    `Total Users : ${totalUsers}`
                );

            doc.text(
                `Students : ${students}`
            );

            doc.text(
                `Teachers : ${teachers}`
            );

            doc.text(
                `Admins : ${admins}`
            );

            doc.moveDown();

            // ================= CONTENT DATA =================

            doc.text(
                `Total Notes : ${totalNotes}`
            );

            doc.text(
                `Total Quiz Sets : ${totalQuiz}`
            );

            doc.text(
                `Total PYQ : ${totalPYQ}`
            );

            doc.moveDown();

            // ================= DATE =================

            doc.text(
                `Generated On : ${new Date().toLocaleString()}`
            );

            doc.end();

        }

        catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    }
);

// ================= DEPARTMENT ANALYTICS =================

router.get(
    "/department-stats",
    auth,
    roleAuth("admin"),
    async (req, res) => {

        try {

            const result = await User.aggregate([

                {
                    $group: {
                        _id: "$department",
                        count: { $sum: 1 }
                    }
                },

                {
                    $sort: {
                        count: -1
                    }
                }

            ]);

            res.json(result);

        }

        catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    }
);

// ================= DELETE USER =================

router.delete(
    "/:id",
    auth,
    roleAuth("admin"),
    async (req, res) => {


        try {

            const user = await User.findById(req.params.id);

            if (!user) {

                return res.status(404).json({
                    message: "User not found"
                });

            }

            // ================= ADMIN SELF DELETE BLOCK =================

            if (req.user.id === user._id.toString()) {

                return res.status(403).json({
                    message: "You cannot delete your own account."
                });

            }

            // ================= DELETE PROFILE PHOTO =================

            if (
                user.photo &&
                user.photo.includes("/uploads/")
            ) {

                const fileName =
                    user.photo.split("/uploads/")[1];

                const filePath = path.join(
                    __dirname,
                    "../uploads",
                    fileName
                );

                if (fs.existsSync(filePath)) {

                    fs.unlinkSync(filePath);

                }

            }

            // ================= DELETE USER =================

            await User.findByIdAndDelete(user._id);

            res.json({

                message:
                    "User deleted successfully."

            });

        }

        catch (err) {

            res.status(500).json({

                error: err.message

            });

        }

    }
);

// ================= PENDING TEACHERS =================
router.get(
    "/pending-teachers",
    auth,
    roleAuth("admin"),
    async (req, res) => {

        try {

            const teachers = await User.find({
                role: "teacher",
                approvalStatus: "pending"
            }).select("-password");

            res.json(teachers);

        }

        catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    }
);

// ================= APPROVE TEACHERS =================
router.put(
    "/approve-teacher/:id",
    auth,
    roleAuth("admin"),
    async (req, res) => {

        console.log("Reject Route Called");
console.log(req.params.id);
console.log(req.body);

        try {

            const teacher = await User.findById(req.params.id);

            if (!teacher) {
                return res.status(404).json({
                    message: "Teacher not found"
                });
            }

            teacher.approvalStatus = "approved";
            teacher.teacherApproved = true;
            teacher.approvedBy = req.user.id;
            teacher.approvedAt = new Date();
            teacher.rejectionReason = "";

            await teacher.save();

            res.json({
                message: "Teacher approved successfully"
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

        try {

            const { reason } = req.body;

            const teacher = await User.findById(req.params.id);

            if (!teacher) {
                return res.status(404).json({
                    message: "Teacher not found"
                });
            }

            teacher.approvalStatus = "rejected";
            teacher.teacherApproved = false;
            teacher.rejectionReason = reason;
            teacher.approvedBy = req.user.id;
            teacher.approvedAt = new Date();

            await teacher.save();

            // Email bhejna
            try {
                await sendEmail(
                    teacher.email,
                    "Teacher Registration Rejected - Student Notesphere",
`Hello ${teacher.firstName},

Unfortunately your teacher registration has been rejected.

Reason:
${reason}

If you believe this was a mistake, please contact the administrator.

Regards,
Student Notesphere Team`
                );
            } catch (err) {
                console.log("Reject email failed:", err.message);
            }

            res.json({
                message: "Teacher rejected successfully."
            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    }
);

module.exports = router;