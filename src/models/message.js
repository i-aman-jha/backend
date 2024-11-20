const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
