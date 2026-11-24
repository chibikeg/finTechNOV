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


const tranferWallet = async (senderUserId, recipientWalletNumber, amountKobo, idempotencyKey) => {
   // 1. Validate the amount
   if(!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
    throw createError ("Enter a valid tranfer amount")
   }

   //2. Validate the recipient wallet Number
   if (
    typeof recipientWalletNumber !== "string" ||
    !recipeintWalletNumber.trim()
   ){
    throw createError ("Recipient wallet number is required")
   }

   //3 Validate the idempotency key 
  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 100
  ) {
    throw createError("A valid idempotency key is required");
  }

  const recipientNumber = recipientWalletNumber.trim()
  //4. Helper: check whether a previuos request used this key
  const getExistingTransfer = async () => {
    return Transaction.findOne({
      user: senderUserId,
      idempotencyKey,
      category: "transfer"
    })
  }

  //Helper: make sure a resued key has the same request details
  const returnExistingTransfer = async (existingTransaction) => {
    const previousRecipientId = 
      existingTransaction.metadata?.recipientWalletId?.toString();

      const recipient = await Wallet.findOne({
        walletNumber: recipientNumber,
      });

      if (
        existingTransaction.amountKobo !== amountKobo ||
        previousRecipientId !== recipient?._id.toString()
      ){
        throw createError(
         "This idempotency key was already used for a different transfer",
          409
        )
        
      }

      const creditTransaction = await Transaction.findOne({
        transferReference: existingTransaction.transferReference,
        type: "credit",
      });

      const senderWallet = await Wallet.findById(existingTransaction.wallet);
      const recipientWallet = recipient
        ? await wallet.findById(recipient._id)
        : null;
      
        return {
          duplicaete: true,
          transferRefernece: existingTransaction.transferReference,
          debitTransaction: existingTransaction,
          creditTransaction,
          senderWallet,
          recipientWallet
        }
    
  }

  // 4. Check whether this request has already been processed
  const existingTranssaction = await getExistingTransfer();

  if (existingTransaction) {
    return returnExistingTransfer(existingTranssaction)
  }

  // Generate refernces outside the transaction callback
  // MongoDB may retry the callback, so we should not generate new
  // references every time it runs

  const transferReference = generateReference("FC-TRANSFER");
  const debitReference = generateReference("FC-DEBIT");
  const creditReference = generateReference("FC-DEBIT");

  const session = await mongoose.startSession();

  

}


module.exports = {
    getWallet,
    getWalletBalance,
    fundWallet

}