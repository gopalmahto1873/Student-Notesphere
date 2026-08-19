const User = require("../models/User");

module.exports = async (req, res, next) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({
                message: "User not found."
            });

        }

        // Sirf teacher ke liye check
        if (
            user.role === "teacher" &&
            user.approvalStatus !== "approved"
        ) {

            return res.status(403).json({

                message:
                "Your account is under verification. Please wait for Admin approval."

            });

        }

        next();

    }

    catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

};