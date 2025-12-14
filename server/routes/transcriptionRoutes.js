const express = require("express");
const router = express.Router();
const Summary = require("../models/Summary");
const Session = require("../models/Session");
const Transcription = require("../models/Transcription");

// Start a new session
router.post("/start_session", async (req, res) => {
    try {
        console.log("Start session route hit!");
        const { userId, sessionTitle } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const newSession = new Session({ userId, sessionTitle });
        await newSession.save();

        res.json({ message: "Session started", sessionId: newSession._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// End session
router.post("/end_session", async (req, res) => {
    try {
        console.log("End session route hit!"); 
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ error: "Session ID is required" });

        await Session.findByIdAndUpdate(sessionId, { endTime: new Date() });
        res.json({ message: "Session ended", sessionId });
    } catch (err) {
        console.error("Error ending session:", err);
        res.status(500).json({ error: err.message });
    }
});


router.get("/history", async (req, res) => {
    try {
        console.log("Get history route hit!");
        const { userId } = req.query; 
        console.log("User ID:", userId);

        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const sessions = await Session.find({ userId }).sort({ startTime: -1 });
        console.log("Sessions:", sessions);
        res.json({ sessions });
    } catch (err) {
        console.error("Error fetching sessions:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/session_transcriptions", async (req, res) => {
    try {
        console.log("Get session_transcriptions route hit!");
        const { sessionId } = req.query; 
        console.log("Session ID:", sessionId);

        if (!sessionId) return res.status(400).json({ error: "session ID is required" });

        const session_transcriptions = await Transcription.find({ sessionId }).sort({ timestamp: 1 });
        console.log("session_transcriptions:", session_transcriptions);
        
        res.json({ session_transcriptions: session_transcriptions || [] });
    } catch (err) {
        console.error("Error fetching summaries:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/summaries", async (req, res) => {
    try {
        console.log("Get summaries route hit!");
        const { userId } = req.query;
        console.log("User ID:", userId);

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Step 1: Fetch sessionIds where userId matches
        const sessions = await Session.find({ userId }).select("_id sessionTitle");
        console.log("Sessions:", sessions);

        if (!sessions.length) {
            return res.json({ summaries: [] });
        }

        // Extract sessionIds
        const sessionIds = sessions.map(session => session._id);
        console.log("Session IDs:", sessionIds);

        // Step 2: Fetch summaries using the sessionIds
        const summaries = await Summary.find({ sessionId: { $in: sessionIds } });
        console.log("Summaries:", summaries);

        if (!summaries.length) {
            return res.json({ summaries: [] });
        }

        // Step 3: Create a mapping of sessionId -> sessionName
        const sessionMap = sessions.reduce((acc, session) => {
            acc[session._id.toString()] = session.sessionTitle;
            return acc;
        }, {});

        // Step 4: Attach session names to summaries
        const summariesWithSessionNames = summaries.map(summary => ({
            ...summary.toObject(),
            sessionName: sessionMap[summary.sessionId.toString()] || "Unknown Session"
        }));

        console.log("final summaries:", summariesWithSessionNames)
        res.json({ summaries: summariesWithSessionNames });

    } catch (err) {
        console.error("Error fetching summaries:", err);
        res.status(500).json({ error: err.message });
    }
});

//delete session and summary
router.delete("/delete_session/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Delete session
        const deletedSession = await Session.findByIdAndDelete(sessionId);
        if (!deletedSession) return res.status(404).json({ error: "Session not found" });

        // Delete related summaries
        const deletedSummaries = await Summary.deleteMany({ sessionId });

        res.json({
            message: "Session and related summaries deleted successfully",
            deletedSessionId: sessionId,
            deletedSummariesCount: deletedSummaries.deletedCount
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// delete a summary
router.delete("/delete_summary/:summaryId", async (req, res) => {
    try {
        console.log("delete summary route hit!");
        const { summaryId } = req.params;
        console.log("Deleting summary with ID:", summaryId);

        const deletedSummary = await Summary.findByIdAndDelete(summaryId);
        if (!deletedSummary) {
            console.log("ummary not found", summaryId);
            return res.status(404).json({ error: "Summary not found" });
        }

        res.json({ message: "Summary deleted successfully", summaryId });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
