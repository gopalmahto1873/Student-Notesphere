const Note = require("../models/Note");
const Quiz = require("../models/Quiz");
const PYQ = require("../models/PYQ");

//===========GET TEACHER DASHBOARD STATS===============

exports.getDashboardStats = async (req, res) => {

    try {

        const teacherId = req.user.id;
        const totalNotes = await Note.countDocuments({uploadedBy: teacherId});
        const totalQuiz = await Quiz.countDocuments({createdBy: teacherId});
        const totalPYQ = await PYQ.countDocuments({uploadedBy: teacherId});
        const notes = await Note.find({uploadedBy: teacherId});

        let totalDownloads = 0;
        notes.forEach(note => {

            totalDownloads +=
                note.downloadCount || 0;

        });

        const recentUploads =
            await Promise.all([

                Note.countDocuments({
                    uploadedBy: teacherId,
                    createdAt: {
                        $gte: new Date(
                            Date.now() - (7 * 24 * 60 * 60 * 1000)
                        )
                    }
                }),

                Quiz.countDocuments({
                    createdBy: teacherId,
                    createdAt: {
                        $gte: new Date(
                            Date.now() - (7 * 24 * 60 * 60 * 1000)
                        )
                    }
                }),

                PYQ.countDocuments({
                    uploadedBy: teacherId,
                    createdAt: {
                        $gte: new Date(
                            Date.now() - (7 * 24 * 60 * 60 * 1000)
                        )
                    }
                })

            ]);

        const totalRecentUploads =
            recentUploads.reduce(
                (a, b) => a + b,
                0
            );

        res.status(200).json({

            totalNotes,
            totalQuiz,
            totalPYQ,
            totalDownloads,
            recentUploads: totalRecentUploads,
            totalViews: totalDownloads

        });

    }

    catch (err) {

        console.log(err);
        res.status(500).json({
            message:
                "Unable to load dashboard stats."
        });

    }

};


//========GET MY UPLOADS============

exports.getMyUploads = async (req, res) => {

    try {

        const teacherId = req.user.id;

        const notes =
            await Note.find({
                uploadedBy: teacherId
            })
            .sort({
                createdAt: -1
            });

        const quizzes =
            await Quiz.find({
                createdBy: teacherId
            })
            .sort({
                createdAt: -1
            });

        const pyqs =
            await PYQ.find({
                uploadedBy: teacherId
            })
            .sort({
                createdAt: -1
            });

        const uploads = [];



        // ================= NOTES =================

        notes.forEach(note => {
        

            uploads.push({
                id: note._id,
                type: "notes",
                title: note.title,
                department: note.department,
                subject: note.subject,
                uploadDate: note.createdAt,
                downloads: note.downloadCount || 0,
                status: "Published"
            });

        });



        // ================= QUIZ =================

        quizzes.forEach((quiz) => {

    uploads.push({

        id: quiz._id,
        type: "quiz",
        title: `${quiz.subject} Quiz`,
        department: quiz.department,
        subject: quiz.subject,
        uploadDate: quiz.createdAt,
        downloads: 0,
        status: "Published"

    });

});



        // ================= PYQ =================

        pyqs.forEach(pyq => {

            uploads.push({
            id: pyq._id,
            type: "pyq",
            title: `${pyq.subject} (${pyq.year})`,
            department: pyq.department,
            subject: pyq.subject,
            uploadDate: pyq.createdAt,
            downloads: 0,
            status: "Published"
        });

        });



        uploads.sort((a, b) => {

            return new Date(b.uploadDate) -
                    new Date(a.uploadDate);

        });

        res.status(200).json(uploads);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            message:
                "Unable to load uploads."
        });

    }

};

// ===============================================
// UPLOAD NOTE
// ===============================================

exports.uploadNote = async (req, res) => {

    try {

        const {

            course,
            department,
            semester,
            subject,
            unit,
            topic,
            title,
            fileType

        } = req.body;

        if (

            !course ||

            !department ||

            !subject ||

            !title ||

            !fileType

        ) {

            return res.status(400).json({

                message: "Please fill all required fields."

            });

        }

        if (!req.file) {

            return res.status(400).json({

                message: "Please upload a file."

            });

        }

        const note = new Note({

            course,
            department,
            semester,
            subject,
            unit,
            topic,
            title,
            fileType,
            fileMimeType: req.file.mimetype,
            fileUrl: `/uploads/${req.file.filename}`,
            fileSize: req.file.size,
            uploadedBy: req.user.id,
            uploadedByRole: req.user.role
        });

        await note.save();

        res.status(201).json({

            message: "Note uploaded successfully.",
            note

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Failed to upload note."

        });

    }

};

// ===============================================
// UPLOAD QUIZ
// ===============================================

exports.uploadQuiz = async (req, res) => {

    try {

        const {

            course,
            department,
            subject,
            unit,
            topic,
            durationMinutes,
            marksPerQuestion,
            negativeMarks,
            instructions,
            questions

        } = req.body;

        let quizQuestions = questions;

        if (typeof questions === "string") {
            quizQuestions = JSON.parse(questions);
        }

        if (!quizQuestions || quizQuestions.length === 0) {
    return res.status(400).json({
        message: "Quiz must contain at least one question."
    });
}

        const quiz = new Quiz({

            course,

            department,

            subject,

            unit,

            topic,

            durationMinutes,

            marksPerQuestion,

            negativeMarks,

            instructions,

            questions: quizQuestions,

            createdBy: req.user.id,

            createdByRole: req.user.role

        });

        await quiz.save();

        res.status(201).json({

            message: "Quiz created successfully.",

            quiz

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Failed to create quiz."

        });

    }

};



// ===============================================
// UPLOAD PYQ
// ===============================================

exports.uploadPYQ = async (req, res) => {

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

        if (

            !course ||

            !department ||

            !semester ||

            !subject ||

            !year

        ) {

            return res.status(400).json({

                message: "All fields are required."

            });

        }

        if (!req.file) {

            return res.status(400).json({

                message: "Please upload a PDF."

            });

        }

        const pyq = new PYQ({

            course,

            department,

            semester,

            subject,

            year,

            examType,

            description,

            file: `/uploads/${req.file.filename}`,

            uploadedBy: req.user.id

        });

        await pyq.save();

        res.status(201).json({

            message: "PYQ uploaded successfully.",

            pyq

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Failed to upload PYQ."

        });

    }

};

// ===============================================
// GET SINGLE UPLOAD
// ===============================================

exports.getUploadById = async (req, res) => {

    try {

        const { type, id } = req.params;

        let data = null;
        if (type === "notes") {
            data = await Note.findById(id);
        }

        else if (type === "quiz") {
            data = await Quiz.findById(id);
        }

        else if (type === "pyq") {
            data = await PYQ.findById(id);
        }

        if (!data) {

            return res.status(404).json({
                message: "Upload not found."
            });

        }

        res.status(200).json(data);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Unable to load upload."
        });

    }

};

// ===============================================
// DELETE UPLOAD
// ===============================================

exports.deleteUpload = async (req, res) => {

    try {

        const { type, id } = req.params;

        if (type === "notes") {

            const deleted = await Note.findOneAndDelete({
                _id:id,
                uploadedBy:req.user.id
            });

            if(!deleted){
                return res.status(404).json({
                    message:"Note not found."
                });
            }

        }

        else if (type === "quiz") {

            await Quiz.findOneAndDelete({

                _id: id,

                createdBy: req.user.id

            });

        }

        else if (type === "pyq") {

            await PYQ.findOneAndDelete({

                _id: id,

                uploadedBy: req.user.id

            });

        }

        else {

            return res.status(400).json({

                message: "Invalid upload type."

            });

        }

        res.status(200).json({

            message: "Upload deleted successfully."

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Delete failed."

        });

    }

};



// ===============================================
// UPDATE NOTE
// ===============================================

exports.updateNote = async (req, res) => {

    try {

        const note = await Note.findOne({
            _id: req.params.id,
            uploadedBy: req.user.id
        });

        if (!note) {

            return res.status(404).json({

                message: "Note not found."

            });

        }

        note.course = req.body.course;
        note.department = req.body.department;
        note.subject = req.body.subject;
        note.semester = req.body.semester;
        note.unit = req.body.unit;
        note.topic = req.body.topic;
        note.title = req.body.title;
        note.fileType = req.body.fileType;

        if (req.file) {

            note.fileUrl = `/uploads/${req.file.filename}`;

            note.fileMimeType = req.file.mimetype;

            note.fileSize = req.file.size;

        }

        await note.save();

        res.status(200).json({

            message: "Note updated successfully.",

            note

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Unable to update note."

        });

    }

};



// ===============================================
// UPDATE QUIZ
// ===============================================

exports.updateQuiz = async (req, res) => {

    try {

        const quiz = await Quiz.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!quiz) {

            return res.status(404).json({

                message: "Quiz not found."

            });

        }

        Object.assign(quiz, req.body);

        await quiz.save();

        res.status(200).json({

            message: "Quiz updated successfully.",

            quiz

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Unable to update quiz."

        });

    }

};

// ===============================================
// UPDATE PYQ
// ===============================================

exports.updatePYQ = async (req, res) => {

    try {

        const pyq = await PYQ.findOne({
            _id: req.params.id,
            uploadedBy: req.user.id
        });

        if (!pyq) {

            return res.status(404).json({

                message: "PYQ not found."

            });

        }

        Object.assign(pyq, req.body);

        if (req.file) {

            pyq.file = `/uploads/${req.file.filename}`;

        }

        await pyq.save();

        res.status(200).json({

            message: "PYQ updated successfully.",

            pyq

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Unable to update PYQ."

        });

    }

};