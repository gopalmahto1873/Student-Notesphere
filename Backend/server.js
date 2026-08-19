require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());

app.use(express.json());

// Static folder for uploads
app.use("/uploads", express.static("uploads"));

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");
const quizRoutes = require("./routes/quizRoutes");
const pyqRoutes = require("./routes/pyqRoutes");
const contactRoutes = require("./routes/contactRoutes");
const teacherRoutes = require("./routes/teacherRoutes");

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/pyq", pyqRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/teacher", teacherRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("API is running...");
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Atlas Connected ✅"))
.catch((err) => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});