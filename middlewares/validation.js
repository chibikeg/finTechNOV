const validate = (schema) => {
    return async (req, res, next) => {
        const result = await schema.safeParseAsync(req.body);
        if (!result.success) {
            res.status(400).json({ 
                success: false,
                message: "Validation failed",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join(" . "),
                    message: issue.message
                }))
             });
            return;
        }

        req.body = result.data;
        next();
    }
}

module.exports = validate;