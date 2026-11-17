const mongoose = require("mongoose");
const Wallet = require("../models/wallet.model");
const bcrypt = require("bcrypt");
const generateWalletNumber = require("../helpers/generateWalletNumber");
const User = require("../models/user.model");
const { generateToken } = require("./token.service");


const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}
const registerUser = async ({ firstName, lastName, email, phone, password }) => {
    const session = await mongoose.startSession();

    try {
        const { firstName, lastName, email, phone, password } = req.body;
        session.startTransaction();

        //. Check whether user alredy exists
        const existingUser = await User.findOne({ email }).session(session);
        if (existingUser) {
            throw httpError("An account with this email already exists", 409);
        }

        //2. Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        //3. Create user
        const [user] = await User.create(
            [
                {
                    firstName,
                    lastName,
                    email,
                    phone,
                    password: hashedPassword
                }
            ],
            { session }
        );

        //4. Generate wallet number and create wallet
        let wallet;
        let attempts = 0;

        while (!wallet && attempts < 5) {
            attempts++;

            try {
                const walletNumber = generateWalletNumber();

                [wallet] = await Wallet.create(
                    [
                        {
                            user: user._id,
                            walletNumber,
                            balanceKobo: 0,
                        }
                    ],
                    { session }
                )
            } catch (error) {
                //Retry only if the wallet number collided
                if (error.code === 11000 && error.keyPattern && error.keyPattern.walletNumber) {
                    continue;
                }
                throw error;
            }

        if(!wallet){
            throw new Error("Failed to create a unique wallet number after multiple attempts");
        }

        //5. Commit both transaction
        await session.commitTransaction();

        //6. Generate token after successful commit
        const token = generateToken(user._id);

            return {
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
                wallet: {
                    walletNumber: wallet.walletNumber,
                    balanceKobo: wallet.balanceKobo,
                    currency: wallet.currency
        
                },
                success: true,
                message: "Account created successfully"
            };
        } 
    }catch (error) {
            if(session.inTransaction()){
                await session.abortTransaction();
            }

            next(error);
        } finally {
            await session.endSession();
        }
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
