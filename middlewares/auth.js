const mongoose = require('mongoose');
const User = require('../models/user.model');
const { verifyToken } = require('../services/token.service');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1];

        if(!token){
            return res.status(401).json({
                success: false,
                message: "Access denied. Please, log in ..."
            })
        }

        //Verify token
        const decoded = verifyToken(token);
        if (
            typeof decoded.sub !== "string" ||
            !mongoose.isValidObjectId(decoded.sub) ||
            !Number.isInteger(decoded.tokenVersion)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        const user = await User.findById(decoded.sub).select("+tokenVersion");

        if(!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            })
        }

        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        if(!user.isActive){
            return res.status(403).json({
                success: false,
                message: "Account is suspended"
            })
        };

        //Attach user to request 
        req.user = user;

        next();
    } catch (error) {
        if(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            })
        }

        return next(error);
    }
}

module.exports = {protect};