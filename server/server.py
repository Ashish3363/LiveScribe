import os
import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS
from rich.console import Console
import os
from flask import Flask, jsonify, request

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication
console = Console()

active_processes = {}

@app.route("/summarize", methods=["POST"])
def start_summarization():
    """Run summarize.py when UI clicks 'Summarize' and pass sessionId."""
    data = request.json

    if not data or "sessionId" not in data:
        return jsonify({"error": "Session ID is required"}), 400

    session_id = data["sessionId"]
    console.print(f"[INFO] Starting summarization for session ID: {session_id}")

    try:
        venv_python = os.path.join(os.getcwd(), "venv", "Scripts", "python.exe")  # Windows
        # For Linux/Mac use: venv_python = os.path.join(os.getcwd(), "venv", "bin", "python")

        result = subprocess.run([venv_python, "summarize.py", session_id], capture_output=True, text=True)

        if result.returncode != 0:
            console.print(f"[ERROR] Summarization script failed:\n{result.stderr}")
            return jsonify({"error": "Summarization script failed", "details": result.stderr}), 500

        console.print(f"[DEBUG] Summarization script output:\n{result.stdout}")
        return jsonify({"message": "Summarization completed successfully", "output": result.stdout}), 200

    except Exception as e:
        console.print(f"[ERROR] {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500


@app.route("/transcription/start", methods=["POST"])
def start_transcription():
    """Start transcribing in a separate subprocess."""
    data = request.json
    if not data or "sessionId" not in data:
        return jsonify({"error": "Session ID is required"}), 400

    session_id = data["sessionId"]
    print(f"[INFO] Starting transcription for session ID: {session_id}")

    try:
        venv_python = os.path.join(os.getcwd(), "venv", "Scripts", "python.exe")

        # Start transcribe.py with session ID
        process = subprocess.Popen([venv_python, "transcribe.py", "--session-id", session_id])

        # Store the process ID
        active_processes["transcribe"] = process

        return jsonify({"message": "Transcription started", "sessionId": session_id, "pid": process.pid})

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500


@app.route("/transcription/stop", methods=["POST"])
def stop_transcription():
    process = active_processes.get("transcribe")

    try:
        process.terminate()  # Graceful termination
        process.wait(5)  # Wait for 5 seconds to let it exit

        print(f"[INFO] Transcription stopped")
            
        #del active_processes["transcribe"]
        return jsonify({"message": "Transcription stopped successfully"})
        
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": f"Failed to stop transcription: {str(e)}"}), 500
    
latest_transcription = {"text": ""}  # Store latest transcription

@app.route("/update_transcription", methods=["POST"])
def update_transcription():
    """Receive transcription from transcribe.py and store it."""
    data = request.json
    if "text" in data:
        latest_transcription["text"] = data["text"]
        return jsonify({"message": "Transcription updated"}), 200
    return jsonify({"error": "Invalid data"}), 400

@app.route("/transcription", methods=["GET"])
def get_latest_transcription():
    """Send latest transcription to UI."""
    return jsonify({"text": latest_transcription["text"]})


import logging

# Suppress Flask's request logs
log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
