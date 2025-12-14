#  Live-Scribe

### AI-Powered Real-Time Transcription & Summarization Desktop App




## Overview

Live-Scribe is a powerful desktop application that performs real-time speech-to-text transcription using OpenAI's Whisper model, automatically generates AI-powered summaries with Long-T5, and provides a seamless user experience through an Electron-based interface.

---

##  Features

-  **Real-time audio transcription** - Capture from stereo mix or microphone input
- **Live UI updates** - See transcriptions appear instantly as you speak
- **AI-powered summarization** - Automatic summary generation using Long-T5 model
-  **MongoDB integration** - Persistent storage for all transcriptions and summaries
-  **JWT authentication** - Secure user authentication via Node.js API
-  **Cross-platform desktop app** - Built with Electron for Windows, macOS, and Linux
-  **Modern React UI** - Responsive and intuitive user interface
- **Python** - Flask backend for ML model inference

---

## Installation Guide

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- MongoDB 4.4 or higher
- npm or yarn package manager

### Clone the Repository

```bash
git clone https://github.com/Ashish3363/LiveScribe.git
cd live-scribe
```

### Python Backend Setup (Flask + Whisper + Long-T5)

Create and activate a virtual environment:

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### Node.js Authentication API Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```


### React + Electron Frontend Setup

Return to the project root and install dependencies:

```bash
cd ..
npm install
```

---

## Running the System

### Start all services in separate terminal windows:

**Terminal 1 - Python Backend:**
```bash
cd server
python server.py
```

**Terminal 2 - Node.js Authentication API:**
```bash
cd server
node server.js
```

**Terminal 3 - Electron Desktop App:**
```bash
yarn electron:serve
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React, Electron |
| Backend API | Node.js, Express |
| ML Backend | Python, Flask |
| Transcription | OpenAI Whisper |
| Summarization | Long-T5 |
| Database | MongoDB |


##  Acknowledgments

- OpenAI Whisper for speech recognition
- Google Long-T5 for text summarization
- The Electron and React communities
