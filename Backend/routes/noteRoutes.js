const express = require("express");
const router = express.Router();
const multer = require("multer");
const Note = require("../models/Note");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const generateCustomId = require("../utils/generateCustomId");
const fs = require("fs");
const path = require("path");

// ================= NORMALIZE TEXT =================
function normalizeText(text) {

    const upperWords = [
        "BCA", "BBA", "MCA", "MBA",
        "DBMS", "OS", "AI", "HR", "IT",
        "C", "C++", "HTML", "CSS", "JS"
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

            return word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase();

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
    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/plain"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, JPG, PNG and TXT files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// ================= GET FILE TYPE =================
function getFileType(mimetype) {
    if (mimetype === "application/pdf") return "pdf";
    if (mimetype === "text/plain") return "text";
    if (mimetype.startsWith("image/")) return "image";
    return "other";
}

// ================= ADD / UPLOAD NOTE =================
// Admin + Teacher only
router.post(
    "/add",
    auth,
    roleAuth("admin", "teacher"),
    upload.single("file"),
    async (req, res) => {
        try {
            const { course, department, subject, semester, unit, topic, title } = req.body;

            if (!course || !department || !subject || !title) {
                return res.status(400).json({
                message: "Course, department, subject and title are required"
                });
            }

            const cleanDepartment = normalizeText(department);
            const cleanSubject = normalizeText(subject);
            const cleanUnit = unit ? normalizeText(unit) : "";
            const cleanTopic = topic ? normalizeText(topic) : "";
            const cleanTitle = normalizeText(title);

            if (!req.file) {
                return res.status(400).json({
                    message: "Please select a file"
                });
            }

            const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
            const fileType = getFileType(req.file.mimetype);
            const customId =await generateCustomId(Note, "SN-NOTE-");

            // ================= CHECK DUPLICATE NOTE =================
            const existingNote = await Note.findOne({
                course: course,
                department: cleanDepartment,
                subject: cleanSubject,
                unit: cleanUnit,
                topic: cleanTopic,
                title: cleanTitle
            });

            if (existingNote) {
                return res.status(400).json({
                message: "This note already exists"
                });
            }
            // ================= SAVE NOTE =================
            const note = new Note({
                course,
                department: cleanDepartment,
                subject: cleanSubject,
                semester: semester || "",
                unit: cleanUnit,
                topic: cleanTopic,
                title: cleanTitle,

                fileMimeType: req.file.mimetype,
                fileSize: req.file.size,
                downloadCount: 0,

                fileType,
                fileUrl,
                uploadedBy: req.user.id,
                uploadedByRole: req.user.role,
                customId
            });

            await note.save();

            res.json({
                message: "Note uploaded successfully",
                note
            });

        } catch (err) {
            console.log("NOTE UPLOAD ERROR:", err);
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "File size should not be more than 10 MB"
                });
            }

            res.status(500).json({
                error: err.message
            });
        }
    }
);

// ================= GET ALL NOTES =================
router.get("/", async (req, res) => {
    try {
        const notes = await Note.find()
            .populate("uploadedBy", "firstName lastName email role")
            .sort({ createdAt: -1 });

        res.json(notes);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= SEARCH / FILTER NOTES =================
router.get("/search", async (req, res) => {
    try {
        const { course, department, subject, semester, search } = req.query;

        let query = {};

        if (course) query.course = course;
        if (department) query.department = department;
        if (subject) query.subject = { $regex: subject, $options: "i" };
        if (semester) query.semester = semester;

        // Smart multi-keyword search
        if (search) {
            const words = search.trim().split(/\s+/);

            query.$and = words.map(word => ({
                $or: [
                    { course: { $regex: word, $options: "i" } },
                    { department: { $regex: word, $options: "i" } },
                    { subject: { $regex: word, $options: "i" } },
                    { title: { $regex: word, $options: "i" } },
                    { unit: { $regex: word, $options: "i" } },
                    { topic: { $regex: word, $options: "i" } }
                ]
            }));
        }

        const notes = await Note.find(query)
            .populate("uploadedBy", "firstName lastName email role")
            .sort({ createdAt: -1 });

        res.json(notes);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= UPDATE NOTE =================
// Admin: any note
// Teacher: only own note
router.put(
    "/update/:id",
    auth,
    roleAuth("admin", "teacher"),
    async (req, res) => {
        try {
            const { course, department, subject, semester, unit, topic, title } = req.body;

            const note = await Note.findById(req.params.id);

            if (!note) {
                return res.status(404).json({ message: "Note not found" });
            }

            if (
                req.user.role === "teacher" &&
                note.uploadedBy.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    message: "You can edit only your own notes"
                });
            }

            note.course = course || note.course;
            note.department = department || note.department;
            note.subject = subject || note.subject;
            note.semester = semester || note.semester;
            note.unit = unit || note.unit;
            note.topic = topic || note.topic;
            note.title = title || note.title;

            await note.save();

            res.json({
                message: "Note updated successfully",
                note
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ================= DELETE NOTE =================
// Admin: any note
// Teacher: only own note
router.delete(
    "/delete/:id",
    auth,
    roleAuth("admin", "teacher"),
    async (req, res) => {
        try {
            const note = await Note.findById(req.params.id);

            if (!note) {
                return res.status(404).json({ message: "Note not found" });
            }

            if (
                req.user.role === "teacher" &&
                note.uploadedBy.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    message: "You can delete only your own notes"
                });
            }

            // Delete physical file

            if (note.fileUrl) {

                const fileName =
                    note.fileUrl.split("/uploads/")[1];

                const filePath =
                    path.join(__dirname, "..", "uploads", fileName);

                if (fs.existsSync(filePath)) {

                    fs.unlinkSync(filePath);
                }
            }

            await Note.findByIdAndDelete(req.params.id);

            res.json({
                message: "Note deleted successfully"
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ================= GET DEPARTMENTS BY COURSE =================
router.get("/departments/:course", async (req, res) => {
    try {
        const course = req.params.course;

        const departments = await Note.distinct("department", {
            course: course
        });

        res.json(departments);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= GET SUBJECTS BY DEPARTMENT =================
router.get("/subjects/:department", async (req, res) => {
    try {
        const department = req.params.department;

        const subjects = await Note.distinct("subject", {
            department: department
        });

        res.json(subjects);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/download/:id", auth, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        note.downloadCount += 1;

        await note.save();

        res.json({
            message: "Download count updated",
            downloadCount: note.downloadCount
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ================= DOWNLOAD FILE =================
router.get("/file/:id", auth, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        const fileName =
            note.fileUrl.split("/uploads/")[1];

        const filePath =
            path.join(__dirname, "..", "uploads", fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        // download count update
        note.downloadCount += 1;
        await note.save();

        // force download
        res.download(filePath);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ================= RECENT NOTES =================

router.get(
    "/recent",
    auth,
    roleAuth("admin"),
    async (req, res) => {

        try {

            const notes = await Note.find()

                .sort({ createdAt: -1 })

                .limit(5)

                .select(
                    "title subject department createdAt"
                );

            res.json(notes);

        }
        catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    }
);

module.exports = router;