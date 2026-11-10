const jwt = require("jsonwebtoken");

const getSecret = () => {
    const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET_KEY is not configured");
    }

    return secret;
}

const generateToken = (userId, tokenVersion = 0) => {
    return jwt.sign(
        { sub: String(userId), tokenVersion },
        getSecret(),
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
}

const verifyToken = (token) => jwt.verify(token, getSecret());

module.exports = { generateToken, verifyToken };