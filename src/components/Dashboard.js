import React, { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Dropdown from 'react-bootstrap/Dropdown';
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SupportGuide.css";
import { FaMicrophone, FaFileAlt, FaEdit, FaQuestionCircle, FaCreditCard, FaDownload, FaTrash } from "react-icons/fa";

import vex from 'vex-js';
import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-default.css';
import vexDialog from 'vex-dialog';

vex.registerPlugin(vexDialog);
vex.defaultOptions.className = 'vex-theme-default';

// Modify the font family of the vex dialog
vex.defaultOptions.content = `
    <div class="vex-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
        {{content}}
    </div>
`;

const promptForSessionName = () => {
    return new Promise((resolve) => {
        vex.dialog.prompt({
            message: 'Enter session name:',
            placeholder: 'Session Name',
            callback: function(value) {
                if (value) {
                    resolve(value);
                } else {
                    resolve(null);
                }
            }
        });
    });
};


const Dashboard = () => {
    const [userName, setUserName] = useState("");
    const [selectedOption, setSelectedOption] = useState("Transcript"); // Default selected option
    const [isRecording, setIsRecording] = useState(false);
    const [sessionId, setSessionId] = useState(null); // State to store session ID
    const [transcribedText, setTranscribedText] = useState(""); // State for transcribed text
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [transcription, setTranscription] = useState([]);
    const [summaries, setSummaries] = useState([]);
    const [selectedSummary, setSelectedSummary] = useState(null); 

    const [sortOrder, setSortOrder] = useState("desc"); // Default: Latest to Oldest
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    



    const navigate = useNavigate();
    const userId = localStorage.getItem("userId"); // Get the userId from localStorage

    const [loading, setLoading] = useState(false); // Loading state

    const showPopup = (message, type = "info") => {
        vex.dialog.alert({
            message: message,
            className: type === "error" ? "vex-theme-plain" : "vex-theme-default",
        });
    };

    const showConfirmPopup = (message, type = "info") => {
        return new Promise((resolve) => {
            vex.dialog.confirm({
                message: message,
                className: type === "error" ? "vex-theme-plain" : "vex-theme-default",
                callback: (value) => {
                    resolve(value);  // Resolves `true` if confirmed, `false` otherwise
                }
            });
        });
    };
    
    
    const handleLogout = () => {
        if (isOverlayOpen) return; // Prevent logout if overlay is open
        localStorage.removeItem("token");
        
        localStorage.removeItem("userId");
        window.location.href = "/";
    };

    const sections = [
        {
          icon: <FaMicrophone />,
          title: "What is LiveScribe?",
          description: "LiveScribe is an AI-powered transcription and summarization app that converts speech into text in real time and generating summaries.",
        },
        {
          icon: <FaDownload />,
          title: "Installing LiveScribe",
          description: "Download the app, follow the quick setup steps, and start transcribing instantly.",
        },
        {
          icon: <FaFileAlt />,
          title: "Real-Time Transcription",
          description: "Capture conversations instantly and accurately with our AI model. Simply click 'Start' to begin transcribing in real time.",
        },
        {
          icon: <FaEdit />,
          title: "Smart Summarization",
          description: "Get concise summaries of long transcriptions. Go to the History tab and select a session and click Generate to generate a summary.",
        },
        {
          icon: <FaQuestionCircle />,
          title: "How Does Support Work?",
          description: "Our support team is available via email, chat, or our help center. Reach out anytime!",
        },
        {
          icon: <FaCreditCard />,
          title: "How Does Billing Work?",
          description: "This application is absolutely free to use.",
        },
      ];

    useEffect(() => {
        if (!userId) {
            navigate("/login"); // Redirect to login if no userId is found
        }
    
        if (window.electron && window.electron.receive) {
            window.electron.receive("overlay-status", (status) => {
                setIsOverlayOpen(status);
            });

            window.electron.receive("overlay-closed", () => {
                console.log("Overlay closed");
                setIsRecording(false);
                stopTranscription();
                setIsOverlayOpen(false);
            });
        }

        let interval;
        const fetchTranscription = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5000/transcription");
                const data = await response.json();
                setTranscribedText(data.text); // Update transcription state
            } catch (error) {
                console.error("Error fetching transcription:", error);
            }
        };
    
        if (isRecording) {
            interval = setInterval(fetchTranscription, 1000); // Poll every second
        }
    
        return () => {
            if (interval) clearInterval(interval); // Cleanup interval on unmount or stop recording
        };

    }, [userId, navigate, isRecording]);
    
    const startTranscription = async (name) => {
        try {
            // Start a new session
            const response = await axios.post("http://localhost:5000/api/transcriptions/start_session", {
                userId, 
                sessionTitle: name, 
            });
    
            const newSessionId = response.data.sessionId; // Get sessionId from response
            setSessionId(newSessionId); // Update React state
            localStorage.setItem("sessionId", newSessionId); // Store in localStorage

            const response1 = await fetch("http://127.0.0.1:5000/transcription/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: newSessionId }),
            });

            const data = await response1.json();
            console.log("Transcription started:", data);
        } catch (error) {
            console.error("Error starting transcription:", error);
        }
    };

    const stopTranscription = async () => {
        console.log("Session ID:", sessionId);
        if (!sessionId) return; // If no session exists, don't proceed
        console.log("Stopping transcription123...");
        try {
            // End session
            const sessionResponse = await axios.post("http://localhost:5000/api/transcriptions/end_session", {
                sessionId,
            });
            console.log("Session ended:", sessionResponse.data.message);
            setSessionId(null); // Reset session ID
    
            // Stop transcription
            const transcriptionResponse = await fetch("http://127.0.0.1:5000/transcription/stop", {
                method: "POST",
            });
    
            const data = await transcriptionResponse.json();
            console.log("Transcription stopped:", data);
        } catch (error) {
            console.error("Error stopping transcription:", error);
        }
    };
    
    
    const openOverlay = async () => {
        const name = await promptForSessionName();

        console.log("Session Name:", name);
        if (name  && window.electron) {
            console.log("dfsvdvssd");
            setIsRecording(true);
            window.electron.send("open-overlay");
            startTranscription(name);
            setIsOverlayOpen(true);
        }
    };
    
    
    const closeOverlay = () => {
        if (window.electron) {
            setIsRecording(false);
            window.electron.send("close-overlay");
            stopTranscription();
            setIsOverlayOpen(false);
        }
    };


    const summarizeText = async () => {
        try {
            setLoading(true); // Show loading state
            showPopup("Summarization started. Please wait...");

            console.log("Starting Summarization...");

            const response = await fetch("http://127.0.0.1:5000/summarize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sessionId: selectedSession }),
            });

            const data = await response.json();
            console.log("Summarization Response:", data);

            if (response.ok) {
                showPopup(`Summarization completed! Check the Summary section to view the results.`, "success");
            } else {
                showPopup(`Summarization failed`,  "success");
            }
        } catch (error) {
            console.error("Error triggering summarization:", error);
            showPopup("Error: Failed to summarize.",  "success");
        } finally {
            setLoading(false); // Stop loading state
        }
    };


    const fetchSessionHistory = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/transcriptions/history?userId=${userId}`);
            setSessionHistory(response.data.sessions);
        } catch (error) {
            console.error("Error fetching session history:", error);
        }
    };

    const fetchSummaryData = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/transcriptions/summaries?userId=${userId}`);
            setSummaries(response.data.summaries);
        } catch (error) {
            console.error("Error fetching session history:", error);
        }
    };

    const fetchTranscriptionData = async (sessionId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/transcriptions/session_transcriptions?sessionId=${sessionId}`);
            setTranscription(response.data.session_transcriptions || []); 
            console.log("Transcription data:", response.data.session_transcriptions);
            setSelectedSession(sessionId); // Set the selected session
        } catch (error) {
            console.error("Error fetching transcription data:", error);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        try {
            const confirmed = await showConfirmPopup("Are you sure you want to delete this session along with its summary?", "confirm");
    
            if (!confirmed) return; // Exit if user cancels
    
            console.log("Deleting session...");
    
            // Call backend delete API
            const response = await axios.delete(`http://localhost:5000/api/transcriptions/delete_session/${sessionId}`);
    
            if (response.status === 200) {
                console.log("Session deleted successfully");
    
                // Remove deleted session from state (assuming setSessions exists)
                setSessionHistory(prevSessions => prevSessions.filter(session => session._id !== sessionId));
            } else {
                console.error("Failed to delete session:", response.data);
            }
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    };
    
    const handleDeleteSummary = async (summaryId) => {
        try {
            const confirmed = await showConfirmPopup("Are you sure you want to delete this summary?", "confirm");
    
            if (!confirmed) return; // Exit if user cancels
    
            console.log("Deleting summary...");
    
            // Call backend delete API
            const response = await axios.delete(`http://localhost:5000/api/transcriptions/delete_summary/${summaryId}`);
    
            if (response.status === 200) {
                console.log("Summary deleted successfully");
    
                // Remove deleted session from state (assuming setSessions exists)
                setSummaries(prevSummaries => prevSummaries.filter(summary => summary._id !== summaryId));
            } else {
                console.error("Failed to delete summary:", response.data);
            }
        } catch (error) {
            console.error("Error deleting summary:", error);
        }
    };
    

    const handleBackToHistory = () => {
        setSelectedSession(null);
        setTranscription(null);
    };    

    const handleBackToSummary = () => {
        setSelectedSummary(null);
    };
    
    
    const filteredSortedHistory = [...sessionHistory]
    .filter((session) => {
        if (!startDate || !endDate) return true;

        const sessionDate = new Date(session.startTime);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Extend end date to include the full day

        return sessionDate >= start && sessionDate <= end;
    })
    .sort((a, b) => {
        return sortOrder === "desc"
            ? new Date(b.startTime) - new Date(a.startTime)
            : new Date(a.startTime) - new Date(b.startTime);
    });

    

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <h2 className="logo">LiveScribe</h2>
                <nav>
                    <ul>
                    <li
                        className={`nav-item ${selectedOption === "Transcript" ? "active" : ""}`}
                        onClick={() => { 
                            setSelectedOption("Transcript"); 
                            setSelectedSummary(null); 
                            setSelectedSession(null); 
                            setStartDate(""); // Reset date filters
                            setEndDate("");
                        }}
                    >
                        <i className="bi bi-chat-left-text"></i> Transcript
                    </li>

                    <li
                        className={`nav-item ${selectedOption === "Summary" ? "active" : ""}`}
                        onClick={() => { 
                            setSelectedOption("Summary"); 
                            setSelectedSummary(null); 
                            setSelectedSession(null); 
                            fetchSummaryData();
                            setStartDate(""); // Reset date filters
                            setEndDate("");
                        }}
                    >
                        <i className="bi bi-file-earmark-bar-graph"></i> Summary
                    </li>

                    <li
                        className={`nav-item ${selectedOption === "History" ? "active" : ""}`}
                        onClick={() => {
                            setSelectedOption("History");
                            setSelectedSummary(null); 
                            setSelectedSession(null);
                            fetchSessionHistory(); 
    
                        }}
                    >
                        <i className="bi bi-clock-history"></i> History
                    </li>

                    <li
                        className={`nav-item ${selectedOption === "Support" ? "active" : ""}`}
                        onClick={() => { 
                            setSelectedOption("Support"); 
                            setSelectedSummary(null); 
                            setSelectedSession(null);
                            setStartDate(""); // Reset date filters
                            setEndDate("");
                        }}
                    >
                        <i className="bi bi-question-circle"></i> Support & Guide
                    </li>

                    </ul>
                </nav>

                <button className="logout-btn" onClick={handleLogout} disabled={isOverlayOpen}>
                    <i className="bi bi-box-arrow-left"></i> Logout
                </button>

            </aside>
            {/* Main Content */}
            <main className="main-content">
            <div className="header">
                {selectedSession ? (
                        <div className="header-actions">
                            <Button variant="secondary" onClick={handleBackToHistory}>
                                <i className="bi bi-arrow-left"></i> Back to History
                            </Button>

                            <Button 
                                variant="primary" 
                                onClick={() => summarizeText()}
                                className="generate-summary-btn"
                                disabled={transcription.length === 0 || loading} // Disable when no transcription
                                style={{
                                    opacity: loading || transcription.length === 0 ? 0.5 : 1,
                                    cursor: loading || transcription.length === 0 ? "not-allowed" : "pointer",
                                }}
                            >
                                <i className="bi bi-pencil-square"></i> {loading ? "Summarizing..." : "Summarize"}
                            </Button>

                        </div>
                    ) : selectedSummary ? (
                        <Button variant="secondary" onClick={handleBackToSummary}>
                            <i className="bi bi-arrow-left"></i> Back to Summary
                        </Button>
                    ) : (
                        
                        <div className="header-container">
                            <h1>{selectedOption === "Transcript" ? "Start Your Transcript" : selectedOption}</h1>

                            {selectedOption === "History" && (
                                <div className="history-controls">
                                {/* Filter Button */}
                                <button className="filter-btn" onClick={() => setIsFilterOpen(true)}>
                                    <i className="bi bi-calendar"></i> {"Filter"}
                                </button>
                            
                                {/* Sort Dropdown */}
                                <div className="dropdown">
                                    <button className="dropdown-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                        <i className="bi bi-sort-down"></i> {sortOrder === "desc" ? "Latest to Oldest" : "Oldest to Latest"}
                                    </button>
                                    {isDropdownOpen && (
                                        <ul className="dropdown-menu">
                                            <li onClick={() => { setSortOrder("desc"); setIsDropdownOpen(false); }}>Latest to Oldest</li>
                                            <li onClick={() => { setSortOrder("asc"); setIsDropdownOpen(false); }}>Oldest to Latest</li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                            
                            )}
                            {/* Filter Modal */}
                            {isFilterOpen && (
                                <div className="filter-modal">
                                    <div className="modal-content">
                                        <h3>Select Date Range</h3>
                                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                        <div className="modal-buttons">
                                           
                                            <button onClick={() => setIsFilterOpen(false)}>Ok</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Dynamic Content Area */}
                <div className="content-area">
                    {/* Transcript Section */}
                    {selectedOption === "Transcript" && (
                        <div className="upload-box">
                            {!isRecording ? (
                                <button onClick={() => { 
                                     
                                    openOverlay(); // Open the overlay when recording starts
                                }}>
                                    <i className="bi bi-play-circle-fill"></i> Start
                                </button>
                            ) : (
                                <button onClick={() => { 
                                    
                                    closeOverlay(); // Close the overlay when recording stops
                                }}>
                                    <i className="bi bi-stop-circle"></i> Stop
                                </button>
                            )}
                        </div>
                    )}

                    {/* Display Transcribed Text */}
                    {selectedOption === "Transcript" && isRecording && (
                        <div>
                            <p>{transcribedText}</p>
                        </div>
                    )}

                    {/* Summary Section */}
                    {selectedOption === "Summary" && !selectedSummary && (
                        <div className="history-content">
                            <h2>Summary of Transcripts</h2>
                            <p>View and analyze your transcript summaries here.</p>
                            <div className="history-grid-container">
                                {summaries.length > 0 ? (
                                    summaries.map((summary) => (
                                        <Card bg="secondary" key={summary._id} text="white"
                                            className="history-card"
                                            onClick={() => 
                                                setSelectedSummary(summary)
                                            }>
                                            {/* Trash Icon */}
                                            <div className="trash-icon" onClick={(e) => {
                                                e.stopPropagation(); // Prevents triggering the onClick of the card
                                                handleDeleteSummary(summary._id);
                                            }}>
                                                <FaTrash />
                                            </div>

                                            <Card.Header className="session-title">
                                                <strong>{summary.sessionName || "New Session"}</strong>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="card-text">
                                                    <p className="summary-text">{summary.summaryText || "No summary available."}</p>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))
                                ) : (
                                    <p>No summaries available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Full summary display when a session is selected */}
                    {selectedSummary && (
                        <div className="transcription-display">
                            <h2>Summary</h2>
                            <div style={{ 
                                maxHeight: "600px", // Limits height 
                                overflowY: "auto",  // Enables vertical scrollbar
                                border: "1px solid #ccc", // Optional: Adds a border for better visibility
                                padding: "10px", // Adds spacing inside the container
                                borderRadius: "5px", // Optional: Adds rounded corners
                                backgroundColor: "#f9f9f9" // Light background for readability
                            }}>
                                {selectedSummary.summaryText ? (
                                    <p style={{ 
                                        whiteSpace: "pre-wrap", // Preserves line breaks
                                        fontSize: "16px", 
                                        lineHeight: "1.6"
                                    }}>
                                        {selectedSummary.summaryText}
                                    </p>
                                ) : (
                                    <p>No summary available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* History Section */}
                    {selectedOption === "History" && !selectedSession && (
                        <div className="history-content">
                            <h2>Session History</h2>
                            <div className="history-grid-container">
                                {filteredSortedHistory.length > 0 ? (
                                    filteredSortedHistory.map((session) => (           
                                        <Card bg="secondary" key={session._id} text="white"
                                            className="history-card"
                                            onClick={() => fetchTranscriptionData(session._id)}>
                                            
                                            {/* Trash Icon */}
                                            <div className="trash-icon" onClick={(e) => {
                                                e.stopPropagation(); // Prevents triggering the onClick of the card
                                                handleDeleteSession(session._id);
                                            }}>
                                                <FaTrash />
                                            </div>

                                            <Card.Header className="session-title">
                                                <strong>{session.sessionTitle || "New Session"}</strong>
                                            </Card.Header>
                                            <Card.Body>
                                                <Card.Text>
                                                    <strong>Start:</strong> {session.startTime ? new Date(session.startTime).toLocaleString() : "Not Available"}
                                                </Card.Text>
                                                <Card.Text>
                                                    <strong>End:</strong> {session.endTime ? new Date(session.endTime).toLocaleString() : "Not Available"}
                                                </Card.Text>
                                            </Card.Body>
                                        </Card>
                                    ))
                                ) : (
                                    <p>No session history available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transcription Display (when a session is selected) */}
                    {selectedSession && (
                        <div className="transcription-display">
                            <h2>Transcription</h2>
                            <div style={{ 
                                maxHeight: "600px", // Limits height 
                                overflowY: "auto",  // Enables vertical scrollbar
                                border: "1px solid #ccc", // Optional: Adds a border for better visibility
                                padding: "10px", // Adds spacing inside the container
                                borderRadius: "5px", // Optional: Adds rounded corners
                                backgroundColor: "#f9f9f9" // Light background for readability
                            }}>
                                {transcription.length > 0 ? (
                                    <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                                        {transcription.map((doc, index) => (
                                            <li key={index} style={{ 
                                                display: "flex", 
                                                alignItems: "flex-start", // Aligns time to the top
                                                gap: "10px", 
                                                marginBottom: "8px" // Adds space between list items
                                            }}>
                                                <strong style={{ 
                                                    minWidth: "100px", 
                                                    textAlign: "right", 
                                                    whiteSpace: "nowrap" // Prevents time from wrapping
                                                }}>
                                                    [{doc.timestamp ? new Date(doc.timestamp).toLocaleTimeString() : "Unknown Time"}]:
                                                </strong> 
                                                <span>{doc.content}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No transcription available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Support Section */}
                    {selectedOption === "Support" && (
                        <div className="support-content">
                            <div className="support-container">
                                <div className="support-grid">
                                    {sections.map((section, index) => (
                                    <div key={index} className="support-card">
                                        <div className="support-icon">{section.icon}</div>
                                        <h3 className="support-heading">{section.title}</h3>
                                        <p className="support-text">{section.description}</p>
                                    </div>
                                    ))}
                                </div>
                                </div>
                        </div>
                    )}
                </div>
            </main>
            </div>
    );
};

export default Dashboard;



// import React, { useState, useEffect } from "react";
// import Sidebar from "./Sidebar";
// import Header from "./Header";
// import TranscriptSection from "./sections/TranscriptSection";
// import SummarySection from "./sections/SummarySection";
// import HistorySection from "./sections/HistorySection";
// import SupportSection from "./sections/SupportSection";
// import "./Dashboard.css";

// const Dashboard = () => {
//     const [selectedOption, setSelectedOption] = useState("Transcript");
//     const [selectedSession, setSelectedSession] = useState(null);
//     const [selectedSummary, setSelectedSummary] = useState(null);
//     const [sortOrder, setSortOrder] = useState("desc");
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//     const [isFilterOpen, setIsFilterOpen] = useState(false);
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");

//     const renderSection = () => {
//         switch (selectedOption) {
//             case "Transcript":
//                 return <TranscriptSection />;
//             case "Summary":
//                 return (
//                     <SummarySection
//                         selectedSummary={selectedSummary}
//                         setSelectedSummary={setSelectedSummary}
//                     />
//                 );
//             case "History":
//                 return (
//                     <HistorySection
//                         selectedSession={selectedSession}
//                         setSelectedSession={setSelectedSession}
//                         sortOrder={sortOrder}
//                         startDate={startDate}
//                         endDate={endDate}
//                     />
//                 );
//             case "Support":
//                 return <SupportSection />;
//             default:
//                 return <TranscriptSection />;
//         }
//     };

//     return (
//         <div className="dashboard-container">
//             <Sidebar
//                 selectedOption={selectedOption}
//                 setSelectedOption={setSelectedOption}
//                 setSelectedSession={setSelectedSession}
//                 setSelectedSummary={setSelectedSummary}
//                 setStartDate={setStartDate}
//                 setEndDate={setEndDate}
//             />
            
//             <main className="main-content">
//                 <Header
//                     selectedOption={selectedOption}
//                     selectedSession={selectedSession}
//                     selectedSummary={selectedSummary}
//                     setSelectedSession={setSelectedSession}
//                     setSelectedSummary={setSelectedSummary}
//                     sortOrder={sortOrder}
//                     setSortOrder={setSortOrder}
//                     isDropdownOpen={isDropdownOpen}
//                     setIsDropdownOpen={setIsDropdownOpen}
//                     isFilterOpen={isFilterOpen}
//                     setIsFilterOpen={setIsFilterOpen}
//                     startDate={startDate}
//                     setStartDate={setStartDate}
//                     endDate={endDate}
//                     setEndDate={setEndDate}
//                 />
                
//                 <div className="content-area">
//                     {renderSection()}
//                 </div>
//             </main>
//         </div>
//     );
// };

// export default Dashboard;




// import React, { useState } from "react";
// import Sidebar from "./Sidebar";
// import Header from "./Header";
// import TranscriptSection from "./sections/TranscriptSection";
// import SummarySection from "./sections/SummarySection";
// import HistorySection from "./sections/HistorySection";
// import SupportSection from "./sections/SupportSection";
// import "./Dashboard.css";

// const Dashboard = () => {
//   const [selectedOption, setSelectedOption] = useState("Transcript");
//   const [selectedSession, setSelectedSession] = useState(null);
//   const [selectedSummary, setSelectedSummary] = useState(null);
//   const [sortOrder, setSortOrder] = useState("desc");
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [isFilterOpen, setIsFilterOpen] = useState(false);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const renderSection = () => {
//     switch (selectedOption) {
//       case "Transcript":
//         return <TranscriptSection />;
//       case "Summary":
//         return (
//           <SummarySection
//             selectedSummary={selectedSummary}
//             setSelectedSummary={setSelectedSummary}
//           />
//         );
//       case "History":
//         return (
//           <HistorySection
//             selectedSession={selectedSession}
//             setSelectedSession={setSelectedSession}
//             sortOrder={sortOrder}
//             startDate={startDate}
//             endDate={endDate}
//           />
//         );
//       case "Support":
//         return <SupportSection />;
//       default:
//         return <TranscriptSection />;
//     }
//   };

//   return (
//     <div className="dashboard-container">
//       <Sidebar
//         selectedOption={selectedOption}
//         setSelectedOption={setSelectedOption}
//         setSelectedSession={setSelectedSession}
//         setSelectedSummary={setSelectedSummary}
//         setStartDate={setStartDate}
//         setEndDate={setEndDate}
//       />

//       <main className="main-content">
//         <Header
//           selectedOption={selectedOption}
//           selectedSession={selectedSession}
//           selectedSummary={selectedSummary}
//           setSelectedSession={setSelectedSession}
//           setSelectedSummary={setSelectedSummary}
//           sortOrder={sortOrder}
//           setSortOrder={setSortOrder}
//           isDropdownOpen={isDropdownOpen}
//           setIsDropdownOpen={setIsDropdownOpen}
//           isFilterOpen={isFilterOpen}
//           setIsFilterOpen={setIsFilterOpen}
//           startDate={startDate}
//           setStartDate={setStartDate}
//           endDate={endDate}
//           setEndDate={setEndDate}
//         />

//         <div className="content-area">{renderSection()}</div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;