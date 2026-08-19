module.exports = function (...allowedRoles) 
{
    return (req, res, next) => 
    {
        if (!req.user || !req.user.role) 
        {
            return res.status(403).json({ message: "Role information not found" });
        }

        if (!allowedRoles.includes(req.user.role)) 
        {
            return res.status(403).json({ message: "Access denied. You are not authorized." });
        }

        next();
    };
};