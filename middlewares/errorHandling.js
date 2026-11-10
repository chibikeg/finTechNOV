function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const isMalformedJson = err.type === "entity.parse.failed";
    let statusCode = Number(err.statusCode || err.status) || 500;
    let message = err.message || "Something went wrong";

    if (isMalformedJson || err.name === "ValidationError" || err.name === "CastError") {
        statusCode = 400;
    } else if (err.code === 11000) {
        statusCode = 409;
        message = "An account with this email already exists";
    }

    if (statusCode < 400 || statusCode > 599) {
        statusCode = 500;
    }

    if (statusCode === 500 && process.env.NODE_ENV === "production") {
        message = "Internal server error";
    } else if (isMalformedJson) {
        message = "Invalid JSON request body";
    }

    res.status(statusCode).json({
        success: false,
        status: "error",
        message
    });
}
    
module.exports = errorHandler;