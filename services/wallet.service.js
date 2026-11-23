const mongoose = require("mongoose");
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const generateReference = require("../helpers/generateReference");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
};

const getWallet = async (userId) => {
  const wallet = await Wallet.findOne({
    user: userId,
  }).select("-__v");

  if (!wallet) {
    throw createError("wallet not found", 404);
  }

  return wallet;
};

const getWalletBalance = async (userId) => {
  const wallet = await Wallet.findOne({
    user: userId,
  }).select("balanceKobo currency status walletNumber");

  if (!wallet) {
    throw createError("wallet not found", 404);
  }

  return {
    walletNumber: wallet.walletNumber,
    balanceKobo: wallet.balanceKobo,
    currency: wallet.currency,
    status: wallet.status,
  };
};

const fundWallet = async (userId, amountKobo, idempotencyKey) => {
  //Simulated funding must not be enabled in production
  if (process.env.NODE_ENV === "production") {
    throw createError("Simulated funding is disabled in production", 403);
  }

  if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
    throw createError("Invalid funding amount");
  }

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 100
  ) {
    throw createError("A valid idempotency key is required");
  }

  //Check whether yhis request was already processed
  const existingTransaction = await Transaction.findOne({
    user: userId,
    idempotencyKey,
  });
  if (existingTransaction) {
    return {
      transcetion: existingTransaction,
      duplicate: true,
    };
  }

  const session = await mongoose.startSession();
  const reference = generateReference("FC-FUND");

  try {
    let result;

    await session.withTransaction(async () => {
      const wallet = await Wallet.findOne({
        user: userId,
      }).session(session);

      if (!wallet) {
        throw createError("Wallet not found", 404);
      }

      if (wallet.status !== "active") {
        throw createError("Wallet not active", 403);
      }

      //Prevent exceeding Javascripts's safe integer ramge
      const updateWallet = await Wallet.findOneAndUpdate(
        {
          _id: wallet._id,
          user: userId,
          status: "active",
          balanceKobo: {
            $lte: Number.MAX_SAFE_INTEGER - amountKobo,
          },
        },
        {
          $inc: {
            balanceKobo: amountKobo,
          },
        },
        {
          new: true,
          session,
          runValidators: true,
        },

       
      );

       if(!updateWallet){
            throw createError(
                "Wallet could not be updated. Please retry"
            )
        }


        const balanceAfterKobo = updatedWallet.balanceKobo;

        const balanceBeforeKobo = updatedWallet.balanceKobo - amountKobo;

        const [transaction] = await Transaction.create(
            [
                {
                    user: userId,
                    wallet: wallet._id,
                    type: "credit",
                    category: "funding",
                    amountKobo,
                    reference,
                    idempotencyKey,
                    description: "Simulated wallet funding",
                    status: "successful",
                    balanceBeforeKobo,
                    balanceAfterKobo
                },
            ],
            {session}
        );

        result = {
            transaction,
            wallet: updateWallet,
            duplicate: false
        }
    });

    return result;

  } catch (error) {
    //A concurrent request may have used the same key

    if(error.code === 11000){
        const exisiting = await Transaction.findOne({
            user: userId,
            idempotencyKey
        });

        if(existing){
            return {
                transaction: existing,
                duplicate: true
            }
        }
    }
    throw error
  } finally {
    await session.endSession()
  }
};


module.exports = {
    getWallet,
    getWalletBalance,
    fundWallet

}