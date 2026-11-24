const {z} = require("zod");

const fundWalletSchema = z.object({
    amountKobo: z
        .number()
        .int("Amount must be an integer")
        .positive("Amount must be greater than zero")
        .max(
            Number.MAX_SAFE_INTEGER,
            "Amount exceeds the supported limit"
        )
})

const transferWalletSchema = z.object({
    recipientWalletNumber: z    
        .string()
        .trim()
        .min(1, "Recepient wallet number is required"),

    amountKobo: z
        .number()
        .int("Amount must be an integer")
        .positive("Amount must be greater than zero")
        .max(
            Number.MAX_SAFE_INTEGER,
            "Amount exceeds the supported limit"
        )
});

module.exports = {
    fundWalletSchema,
    transferWalletSchema
}