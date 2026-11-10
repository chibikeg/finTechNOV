const express = require("express");
const router = express.Router();
const { register,
    login,
    getProfile,
    updateProfile,
    logout} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth");
const {
    registerSchema,
    loginSchema,
    updateProfileSchema
} = require("../validators/auth.validator");
const validate = require("../middlewares/validation");
const asyncHandler = require("../helpers/asyncHandler");

//Register
router.post("/register", validate(registerSchema), asyncHandler(register));

//Login
router.post("/login", validate(loginSchema), asyncHandler(login));

//Get Profile
router.get("/profile", protect, asyncHandler(getProfile));

//Update Profile
router.put("/profile", protect, validate(updateProfileSchema), asyncHandler(updateProfile));

//Logout
router.post("/logout", protect, asyncHandler(logout));


module.exports = router;