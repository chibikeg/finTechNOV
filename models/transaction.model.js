const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    type: {
        type: String,
        enum: ["credit", "debit"],
        required: true
    },

    category: {
        type: String,
        enum: ["funding", "transfer", "refund", "adjustment"],
        required: true
    },

    amountKobo: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isSafeInteger,
            message: "Transaction must be a safe integer",
        },
    },

    reference: {
        type: String,
        required: true,
        unique: true
    },

    idempotencyKey: {
        type: String,
        default: null
    },

    description: {
        type: String,
        trim: true,
        maxlength: 300,
        default: ""
    },

    status: {
        type: String,
        enum: ["pending", "successful", "failed", "reversed"],
        default: pending,
    },

    balanceBeforeKobo: {
        type: Number,
        required: true,
        min: 0
    },

    balanceAfterKobo: {
        type: Number,
        required: true,
        min: 0
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, 
{
    timestamps: true,
});

//Retrieve wallet transcation efficiently
transactionSchema.index({
    wallet: 1,
    createdAt: -1
})

//Prevents reuse of an indempotency key by the same user
transactionSchema.model(
    {user:1, idempotencyKey: 1},
    {
        unique: true,
        partialFilterExpression: {
            idempotencyKey: { $type: "string" }
        }
    }
)

const Transaction = mongoose.model (
    "Transaction",
    transactionSchema
)

module.exports = Transaction;