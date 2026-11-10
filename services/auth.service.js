    const User = require("../models/user.model");
    const { generateToken } = require("./token.service");

    const httpError = (message, statusCode) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
    }

    const registerUser = async ({ firstName, lastName, email, phone, password }) => {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw httpError("An account with this email already exists", 409);
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            phone,
            password
        });

        return {
            token: generateToken(user._id, user.tokenVersion),
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        };
    }

    const loginUser = async ({ email, password }) => {
        const user = await User.findOne({ email }).select("+password +tokenVersion");

        if (!user) {
            throw httpError("Invalid email or password", 401);
        }

        if (!user.isActive) {
            throw httpError("Your account has been suspended. Please contact support for assistance.", 403);
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw httpError("Invalid email or password", 401);
        }

        return {
            token: generateToken(user._id, user.tokenVersion),
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        };
    }

    const getUserProfile = async (userId) => {
        const user = await User.findById(userId);

        if (!user) {
            throw httpError("User not found", 404);
        }

        return user;
    }

    const updateUserProfile = async (userId, updateData) => {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            throw httpError("User not found", 404);
        }

        return user;
    }

    const logoutUser = async (userId) => {
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { tokenVersion: 1 } },
            { new: true }
        );

        if (!user) {
            throw httpError("User not found", 404);
        }

        return user;
    }

    module.exports = {
        registerUser,
        loginUser,
        getUserProfile,
        updateUserProfile,
        logoutUser
    }
