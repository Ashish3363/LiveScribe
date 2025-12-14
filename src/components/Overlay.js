import { useEffect, useState } from "react";
import axios from "axios";

const Overlay = () => {
    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId"));
    const [transcribedText, setTranscribedText] = useState("");

    const endSession = async () => {
        if (!sessionId) return; // If no session exists, don't proceed
        try {
            const response = await axios.post("http://localhost:5000/api/transcriptions/end_session", {
                sessionId,
            });
            console.log("Session ended:", response.data.message);
            setSessionId(null); // Reset session ID in state
            localStorage.removeItem("sessionId"); // Remove session ID from local storage
        } catch (error) {
            console.error("Error ending session:", error);
        }
    };

    const enableClicks = () => {
        if (window.electron) {
            window.electron.enableClicks();
        }
    };

    const disableClicks = () => {
        if (window.electron) {
            window.electron.disableClicks();
        }
    };

    const closeOverlay = () => {
        if (window.electron && window.electron.send) {
            window.electron.send("close-overlay");
            endSession();
        }
    };

    useEffect(() => {
        const fetchTranscription = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5000/transcription");
                const data = await response.json();
                setTranscribedText(data.text);
            } catch (error) {
                console.error("Error fetching transcription:", error);
            }
        };

        const interval = setInterval(fetchTranscription, 10);
        return () => clearInterval(interval);
    }, []);

    // Function to limit the displayed text
    const formatText = (text) => {
        if (!text) return "Listening...";

        // Limit text to 80 characters
        let limitedText = text.slice(-80);

        // Insert a line break after every 40 characters
        return `${limitedText.slice(0, 40)}\n${limitedText.slice(40, 80)}`;
    };

    return (
        <div
            onMouseEnter={enableClicks}
            onMouseLeave={disableClicks}
            style={{
                position: "fixed",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "black",
                color: "white",
                padding: "10px 20px",
                borderRadius: "10px",
                fontSize: "18px",
                fontWeight: "bold",
                textAlign: "left",
                width: "460px", // Fixed width for 40 characters
                height: "70px", // Fixed height for 2 lines
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "pre-line", // Allows line breaks in text
                overflow: "hidden",
                pointerEvents: "auto",
            }}
        >
            {formatText(transcribedText)}

            <button
                onClick={closeOverlay}
                style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    background: "red",
                    border: "none",
                    color: "white",
                    padding: "5px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "8px",
                }}
            >
                X
            </button>
        </div>
    );
};

export default Overlay;
