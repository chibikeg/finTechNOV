const {randomInt} = require('crypto');

const generateWalletNumber = () => {
    const walletNumber = randomInt(1000000000, 9999999999);
    return String(walletNumber);
}

module.exports = generateWalletNumber;