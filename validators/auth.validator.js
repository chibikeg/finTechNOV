const { z } = require('zod');

const registerSchema = z.object({
    firstName: z.string().trim().min(3, { message: "First name is required" }),
    lastName: z.string().trim().min(3, { message: "Last name is required" }),
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
    phone: z.string().trim().min(10, { message: "Invalid phone number" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" })
}).strict();

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" })
}).strict();

const updateProfileSchema = z.object({
    firstName: z.string().trim().min(3, { message: "First name is required" }).optional(),
    lastName: z.string().trim().min(3, { message: "Last name is required" }).optional(),
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }).optional(),
    phone: z.string().trim().min(10, { message: "Invalid phone number" }).optional()
}).strict().refine((data) => Object.keys(data).length > 0, {
    message: "At least one profile field must be provided"
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema
}