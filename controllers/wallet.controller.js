const {
    getWallet,
    getWalletBalance,
    fundWallet
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


module.exports = {
    getMyWallet,
    getMyWalletBalance,
    fundMyWallet
}