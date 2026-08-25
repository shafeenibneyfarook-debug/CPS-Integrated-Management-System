const mongoose = require("mongoose");
const User = require("../auth/user.model");

exports.listUsers = async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { role, isActive } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid user ID" });
    if (role !== undefined && !["admin", "manager", "operations_officer", "staff", "accounts_officer", "client", "supplier"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (isActive !== undefined && typeof isActive !== "boolean") return res.status(400).json({ message: "isActive must be true or false" });
    if (req.user._id.equals(id) && (role && role !== "admin" || isActive === false)) return res.status(400).json({ message: "You cannot remove your own administrator access" });
    const update = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    const user = await User.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user, message: "User access updated" });
};
