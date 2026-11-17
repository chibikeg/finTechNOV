const mongoose = require("mongoose");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model")
const generateReference = require("../helpers/generateReference")

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}

const getWallet = async (userId)=> {
    const wallet = await Wallet.findOne({
        user: userId,
    }).select("-__v");

    if(!wallet){
        throw createError("wallet not found", 404)
    }

    return wallet;
}

const getWalletBalance = async(userId) =>{
    const wallet = await Wallet.findOne({
        user: userId,
    }).select("balanceKobo currency status walletNumber");

    if(!wallet){
       throw createError("wallet not found", 404)
    }

    return{
        walletNumber: wallet.walletNumber,
        balanceKobo: wallet.balanceKobo,
        currency: wallet.currency,
        status: wallet.status
    }
}

const fundWallet = async (
    userId,
    amountKobo,
    idempotencyKey
) => {
    //Simulated funding must not be enabled in production
    if(process.env.NODE_ENV === "production"){
        throw createError(
            "Simulated funding is disabled in production", 403
        )
    }

    if(!Number.isSafeInteger(amountKobo) || amountKobo <= 0){
        throw createError("Invalid funding amount")
    }

    if(
        typeof idempotencyKey !== "string" ||
        idempotencyKey.length < 8 ||
        idempotencyKey.length > 100
    ){
        throw createError("A valid idempotency key is required")
    }
}