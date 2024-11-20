const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Group = require("./group"); // Import the Group model

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String, 
        default: null,
    },
}, { timestamps: true });

// Hash the password before saving the user
userSchema.pre('save', async function(next) {
    const user = this;
    if (!user.isModified('password')) return next();

    try {
        const SALT = await bcrypt.genSalt(9);
        user.password = await bcrypt.hash(user.password, SALT);

        // Add the user to all groups

        next();
    } catch (error) {
        next(error);
    }
});

// Compare password
userSchema.methods.comparePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

// Generate JWT
userSchema.methods.genJWT = function() {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
    return jwt.sign({ id: this._id, email: this.email }, JWT_SECRET, {
        expiresIn: '1h'
    });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
