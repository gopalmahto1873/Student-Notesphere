const jwt = require("jsonwebtoken");

module.exports = function (req, res, next)
{
    const authHeader = req.headers["authorization"];

    if (!authHeader)
    {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }

    // Remove "Bearer "
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    try
    {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (err)
    {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
};