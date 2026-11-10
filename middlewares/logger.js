function loggerMiddleware(req, res, next) {
    console.log({
        method: req.method,
        url: req.originalUrl,
        time: new Date().toISOString(),
    })

    next();
}

module.exports = {loggerMiddleware}