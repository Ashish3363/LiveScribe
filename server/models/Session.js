const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionTitle: { type: String, required: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date, default: null } // Default should allow null if no end time
});

module.exports = mongoose.model("Session", sessionSchema);
