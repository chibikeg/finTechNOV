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

module.exports = {
    fundWalletSchema
}