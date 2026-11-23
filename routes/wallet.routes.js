const express = require("express")
const {
        getMyWallet,
        getMyWalletBalance,
        fundMyWallet
} = require("../controllers/wallet.controller");
const protect = require("../middlewares/auth");
const validate = require ("../middlewares/validation")
const {fundWalletSchema} = require("../validators/wallet.validation");
const router = express.Router()

//All wallet routes require authentication
router.use(protect);

//Retrieve wallet details
router.get("/me", getMyWallet)

//Retrieve Wallet Balance
router.get("/balance", getMyWalletBalance)

//Simulated wallet funding
router.post("/fund", validate(fundWalletSchema), fundMyWallet)

module.exports = router;