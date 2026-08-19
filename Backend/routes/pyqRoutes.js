const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PYQ = require("../models/PYQ");
const generateCustomId = require("../utils/generateCustomId");

const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");

const pyqUploadPath = path.join(__dirname, "../uploads/pyq");


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

            const upper =
                word.toUpperCase();

            if (
                upperWords.includes(upper)
            ) {
                return upper;
            }

            return (
                word.charAt(0)
                    .toUpperCase()
                +
                word.slice(1)
                    .toLowerCase()
            );

        })
        .join(" ");
}

if (!fs.existsSync(pyqUploadPath)) {
    fs.mkdirSync(pyqUploadPath, { recursive: true });
}

// ================= STORAGE =================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, pyqUploadPath);
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/\s+/g, "-");
        cb(null, Date.now() + "-" + safeName);
    }
});

// ================= FILE FILTER =================
const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only PDF, JPG and PNG files are allowed"),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// ================= UPLOAD PYQ =================
// Admin + Teacher only
router.post(
    "/upload",
    auth,
    roleAuth("admin", "teacher"),
    upload.single("file"),
    async (req, res) => {
        try {
            const {
                course,
                department,
                semester,
                subject,
                year,
                examType,
                description
            } = req.body;

            const cleanCourse = normalizeText(course);

            const cleanDepartment = normalizeText(department);

            const cleanSubject = normalizeText(subject);

            const cleanSemester = normalizeText(semester);

            const cleanExamType = normalizeText(examType);

            if (!course || !department || !semester || !subject || !year || !examType) {
                return res.status(400).json({
                    message: "All required fields must be filled"
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: "Please upload PYQ file"
                });
            }

            const customId =await generateCustomId(PYQ, "SN-PYQ-");

            const pyq = new PYQ({

                course: cleanCourse,
                department: cleanDepartment,
                semester: cleanSemester,
                subject: cleanSubject,
                year: Number(year),
                examType: cleanExamType,
                description: description || "",
                file: `${req.protocol}://${req.get("host")}/uploads/pyq/${req.file.filename}`,
                uploadedBy: req.user.id,
                customId
            });

            await pyq.save();

            res.json({
                message: "PYQ uploaded successfully",
                pyq
            });

        } catch (err) {

            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "File size should not be more than 10 MB"
                });
            }

            if (err.message === "Only PDF, JPG and PNG files are allowed") {
                return res.status(400).json({
                    message: err.message
                });
            }

            res.status(500).json({
                error: err.message
            });
        }
    }
);

// ================= SEARCH PYQ =================
router.get("/search", async (req, res) => {
    try {
        const {
            course,
            department,
            semester,
            subject,
            year,
            examType
        } = req.query;

        let query = {};

        if (course) { query.course = normalizeText(course); }

        if (department) { query.department = normalizeText(department); }

        if (semester) { query.semester = normalizeText(semester);}

        if (subject) { query.subject = normalizeText(subject); }

        if (year) query.year = Number(year);
        if (examType) { query.examType = normalizeText(examType); }

        const pyqs = await PYQ.find(query)
            .populate("uploadedBy", "firstName lastName email role")
            .sort({ createdAt: -1 });

        res.json(pyqs);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ================= VIEW PYQ =================

router.get("/view/:id", async (req, res) => {

    try {

        const pyq = await PYQ.findById(req.params.id)
            .populate(
                "uploadedBy",
                "firstName lastName"
            );

        if (!pyq) {

            return res.status(404).json({
                message: "PYQ not found"
            });

        }

        res.json(pyq);

    }

    catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

// ================= DOWNLOAD PYQ =================

router.get("/download/:id", async (req, res) => {

    try {

        const pyq = await PYQ.findById(req.params.id);

        if (!pyq) {

            return res.status(404).json({
                message: "PYQ not found"
            });

        }

        // Increase Download Count
        pyq.downloadCount += 1;

        await pyq.save();

        const fileName =
            pyq.file.split("/uploads/pyq/")[1];

        const filePath = path.join(
            __dirname,
            "../uploads/pyq",
            fileName
        );

        if (!fs.existsSync(filePath)) {

            return res.status(404).json({
                message: "File not found"
            });

        }

        res.download(filePath);

    }

    catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// ================= DELETE PYQ =================
// Admin can delete all, Teacher can delete own uploaded PYQ
router.delete("/delete/:id", auth, roleAuth("admin", "teacher"), async (req, res) => {
    try {
        const pyq = await PYQ.findById(req.params.id);

        if (!pyq) {
            return res.status(404).json({
                message: "PYQ not found"
            });
        }

        if (
            req.user.role === "teacher" &&
            pyq.uploadedBy.toString() !== req.user.id
        ) {
            return res.status(403).json({
                message: "You can delete only your own uploaded PYQ"
            });
        }

        // Delete physical file
        if (pyq.file) {
            const fileName = pyq.file.split("/uploads/pyq/")[1];

            const filePath = path.join(
                __dirname,
                "../uploads/pyq",
                fileName
            );

            if (fileName && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await PYQ.findByIdAndDelete(req.params.id);

        res.json({
            message: "PYQ deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;