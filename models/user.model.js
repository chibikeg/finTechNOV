const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true
    },

    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true
    },

    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        unique: true,
        lowercase: true
    },

    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true
    },

    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 8,
        select: false
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    isActive: {
        type: Boolean,
        default: true
    },

    tokenVersion: {
        type: Number,
        default: 0,
        select: false
    }
}, {
    timestamps: true
});

//Hash password before saving to database
userSchema.pre("save", async function (){
    if(!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12)
})

//Compar password during login
userSchema.methods.comparePassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model("User", userSchema);

module.exports = User;