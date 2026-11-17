const {randomUUID} = require("crypto")

const generateReference = (prefix = "FC") => {
    const uniqueId = randomUUID()
            .replace(/-/g, "")
            .slice(0, 16)
            .toUpperCase()

    return `${prefix}-${uniqueId}`
}

module.exports = generateReference;