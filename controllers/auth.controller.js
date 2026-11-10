const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    logoutUser} = require("../services/auth.service");

const register = async (req, res) => {
    const result = await registerUser(req.body);
    res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: result
    });
}

const login = async (req, res) => {
    const result = await loginUser(req.body);
    res.status(200).json({
        success: true,
        message: "Login successful",
        data: result
    });
}

const getProfile = async (req, res) => {
    const user = await getUserProfile(req.user._id);
    res.status(200).json({
        success: true,
        message: "User profile retrieved successfully",
        data: user
    });
}

const updateProfile = async (req, res) => {
    const user = await updateUserProfile(req.user._id, req.body);
    res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        data: user
    });
}

const logout = async (req, res) => {
    await logoutUser(req.user._id);
    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
}


module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    logout
}