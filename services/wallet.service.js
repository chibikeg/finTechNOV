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

  try{
    let transferResult;

    await session.withTransaction(async () => {
      // 5. Find the sender's wallet
      const senderWallet = await wallet.findOne ({
        user: senderUserId,
      }).session(session);

      if (!senderWallet){
        throw createError("Sender wallet not found", 404)
      }

      //6. Find the recipient's wallet
      const recipientWallet = await Wallet.findOne({
        walletNumber: recipientNumber,
      }).session(session);

       if (!recipientWallet){
        throw createError("Recipient wallet not found", 404)
      }

      //7. Prevent self-transfer
      if(senderWallet._id.equals(recipientWallet._id)){
          throw createError("You cannot transfer money to yourself")
      }

      //8. Check both wallets are active
      if(
        senderWallet.status !== "active" ||
        recipientWallet.status !== "active"
      ){
          throw createError("Both wallets must be active")
      }

      //9. Debit the sender atomically
      //The balance condition prevents overdrawing the wallet
      const updateSenderWallet = await wallet.findOneAndUpdate(
        {
          _id: senderWallet._id,
          user: senderUserId,
          status: "active",
          balanceKobo: { $gte: amountKobo }
        },
        {
          $inc: {
            balanceKobo: -amountKobo
          },
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );
      if (!updatedSenderWallet){
        throw createError("insufficient wallet balance", 400);
      }

      //10. Credit the recipient aomically
      // The upper-bound condition protects against exceeding
      //JavaScript's safe integer limit.

      const updatedRecipientWallet = await Wallet.findOneAndUpdate(
        {
          _id: recipientWallet._id,
          status:"active",
          balanceKobo: {
            $lte: Number.MAX_SAFE_INTEGER - amountKobo,
          }
        },

        {
          $inc: {
            balanceKobo: amountKobo,
          },
        },

        {
          new: true,
          session,
          runValidators: true
        }
      );

      if(!updatedRecipientWallet){
        throw createError(
          "Recipient wallet could not be credited",
          400
        )
      }

      //11. Calculate balance snapshots
      const senderBalanceBefore = updateSenderWallet.balanceKobo + amountKobo;

      const recipientBalanceBefore = updateRecipientWallet.balanceKobo - amountKobo;

      //12. Create both transaction records
      const [debitTransaction, creditTransaction] =
        await Transaction.create(
          [
            {
              user: senderUserId,
              wallet: senderWallet._id,
              type: "debit",
              category: "transfer",
              amountKobo,
              reference: debitReference,
              transferReference, idempotencyKey,
              description: `Transfer to ${recipientNumber}`,
              status: "successful",
              balanceBeforeKobo: senderBalanceBefore,
              balanceAfterKobo: updatedSenderWallet.balanceKobo,
              metadata: {
                recipientWalletId: recipientWallet._id,
                recipientWalletNumber: recipientNumber,
              },
            },
            {
              user: recipientWallet.user,
              wallet: recipientWallet._id,
              type: "credit",
              category: "transfer",
              amountKobo,
              reference: creditReference,
              transferReference,
              description: `Transfer received from ${senderWallet.walletNumber}`,
              status: "successful",
              balanceBeforeKobo: recipientBalanceBefore,
              balanceAfterKobo: updatedRecipientWallet.balanceKobo,
              metadata: {
                senderWalletId: senderWallet._id,
                senderWalletNumber: senderWallet.walletNumber,
              },
            },
          ],
          { session }
        );

        //13. Prepare the response
        transferResult = {
          duplicate: false,
          transferReference,
          debitTransaction,
          creditTransaction,
          senderWallet: updatedSenderWallet,
          recipientWallet: updatedRecipientWallet,
        };
    })

    return transferResult;
  } catch(error){
    //A simultaneous duplicate request may reach the unique index
    // before the first request has completed
    if(error.code === 11000){
      const existing = await getExistingTransfer();

      if(existing){
        return await returnExistingTransfer(existing);
      }
    }

    throw error;
  } finally{
    await session.endSession();
  }

}


module.exports = {
    getWallet,
    getWalletBalance,
    fundWallet,
    transferWallet

}