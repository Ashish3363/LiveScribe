const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    summaryText: { type: String, required: true },
});

module.exports = mongoose.model("Summary", summarySchema);
