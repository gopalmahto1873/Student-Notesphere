const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth");

const roleMiddleware = require("../middleware/roleAuth");

const teacherController = require("../controllers/teacherController");

const multer = require("multer");

// ================= MULTER CONFIG =================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

// ================= DASHBOARD =================

// Dashboard Statistics

router.get(

    "/dashboard-stats",

    authMiddleware,

    roleMiddleware("teacher"),

    teacherController.getDashboardStats

);

// ================= UPLOADS =================

// Get All Uploads

router.get(

    "/uploads",

    authMiddleware,

    roleMiddleware("teacher"),

    teacherController.getMyUploads

);

// Get Single Upload

router.get(

    "/upload/:type/:id",

    authMiddleware,

    roleMiddleware("teacher"),

    teacherController.getUploadById

);

// ================= NOTES =================

// Upload Note

router.post(

    "/notes",

    authMiddleware,

    roleMiddleware("teacher"),

    upload.single("file"),

    teacherController.uploadNote

);

// ================= QUIZ =================

// Upload Quiz

router.post(

    "/quiz",

    authMiddleware,

    roleMiddleware("teacher"),

    teacherController.uploadQuiz

);

// ================= PYQ =================

// Upload PYQ

router.post(

    "/pyq",

    authMiddleware,

    roleMiddleware("teacher"),

    upload.single("file"),

    teacherController.uploadPYQ

);
// ================= DELETE =================

// Delete Upload

router.delete(

    "/upload/:type/:id",

    authMiddleware,

    roleMiddleware("teacher"),

    teacherController.deleteUpload

);

// ================= UPDATE NOTE =================

router.put(

    "/notes/:id",

    authMiddleware,

    roleMiddleware("teacher"),

    teacherController.updateNote

);

// ================= UPDATE QUIZ =================

router.put(

    "/quiz/:id",

    authMiddleware,

    roleMiddleware("teacher"),

    teacherController.updateQuiz

);

// ================= UPDATE PYQ =================

router.put(

    "/pyq/:id",

    authMiddleware,

    roleMiddleware("teacher"),

    teacherController.updatePYQ

);

module.exports = router;