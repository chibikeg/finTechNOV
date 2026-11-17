const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    walletNumber: {
        type: String,
        required: true,
        unique: true    
    },

    balanceKobo: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
            validator: Number.isSafeInteger,
            message: "Wallet balance must be a safe integer value in kobo."
        }
    }, 

    currency: {
        type: String,
        enum: ["NGN", "YEN", "USD"],
        default: "NGN"
    },

    status: {
        type: String,
        enum:["active", "frozen", "closed"],
        default: "active"
    }
}, {
    timestamps: true
})

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;