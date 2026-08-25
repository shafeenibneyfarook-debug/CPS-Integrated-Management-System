const User = require("../modules/auth/user.model");
const { verifyToken } = require("../modules/auth/auth.utils");

exports.authenticate = async (req, res, next) => {
    try {
        const [scheme, token] = (req.headers.authorization || "").split(" ");
        if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Authentication required" });
        const payload = verifyToken(token);
        const user = await User.findById(payload.sub);
        if (!user || !user.isActive) return res.status(401).json({ message: "Account is unavailable" });
        req.user = user;
        next();
    } catch (_error) {
        return res.status(401).json({ message: "Invalid or expired session" });
    }
};

exports.authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
};
