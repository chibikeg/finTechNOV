const {
    getWallet,
    getWalletBalance,
    fundWallet,
    transferWallet
} = require("../services/wallet.service");

//Get wallet details
const getMyWallet = async( req, res, next) => {
    try{
        const wallet = await getWallet(req.user._id);

        return res.status(200).json({
            success: true,
            message: "Wallet retrieved successfully",
            data: Wallet,
        });
    } catch (error){
        next (error)
    }
}

//GEt wallet balance
const getMyWalletBalance = async( req, res, next) => {
    try{
        const wallet = await getWalletBalance(req.user._id);

        return res.status(200).json({
            success: true,
            message: "Wallet balance retrieved successfully",
            data: Wallet,
        });
    } catch (error){
        next (error)
    }
}

//SImulated wallet funding

const fundMyWallet = async( req, res, next) => {
    try{
        const {amountKobo} = req.body;
        const idempotency = req.get("idempotency-key")

       const result = await fundWallet(
        req.user._id,
        amountKobo,
        idempotencyKey
       );

       //Fetch the latest balance, including on duplicate requests
       const balance = await getWalletBalance (req.user._id)

        return res.status(200).json({
            success: true,
            message: result.duplicate ? "This funding request was already processd" : "Wallet funded successfully",
            data: {
                transaction: result.transaction,
                wallet: balance,
                duplicate: result.duplicate
            }
        });

    } catch (error){
        next (error)
    }
}

const transferMyWallet = async (req, res, next) => {
    try{
        const { recipientWalletNumber, amountKobo } = req.body;

        //The sender is obtained from the authenticated user.
        // Never accept the sender's ID from the request body.

        const senderUserId = req.user._id;
        const idempotencyKey = req.get("Idempotency-Key");

        const result = await transferWallet(
            senderUserId,
            recipientWalletNumber,
            amountKobo,
            idempotencyKey
        );

        return res.status(result.duplicate ? 200 : 201).json({
            success: true,
            message: result.duplicate
                ? "This transfer was already processed"
                : "Transfer completed successfully",
                data: result,
        });
    } catch(error){
        next(error)
    }
}


module.exports = {
    getMyWallet,
    getMyWalletBalance,
    fundMyWallet,
    transferMyWallet

}