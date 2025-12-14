import sys
import argparse
import requests
from bson import ObjectId
import pymongo
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from install_packages import check_and_install_packages
from rich.console import Console
import colorama
import sounddevice as sd
from RealtimeSTT import AudioToTextRecorder
import requests

# Install necessary packages
check_and_install_packages([
    {'import_name': 'rich'},
    {'import_name': 'pyautogui'}
])

# MongoDB Connection
MONGO_URI = "mongodb://127.0.0.1:27017/"
DB_NAME = "LiveScribeDB"

SERVER_URL = "http://127.0.0.1:5000/update_transcription"

mongo_client = pymongo.MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
transcriptions_collection = db["transcriptions"]

colorama.init()
console = Console()

# Ensure sessionId is passed as a command-line argument
if len(sys.argv) < 2:
    console.print("[bold red]Error: Session ID is required.[/bold red]")
    sys.exit(1)

current_session_id = sys.argv[2]
console.print(f"[INFO] Processing transcription for session ID: {current_session_id}")

console.print("System initializing, please wait")

def save_transcription_to_db(content):
    """ Save the transcription to the MongoDB database. """
    if not current_session_id:
        console.print("[bold red]Session ID is missing![/bold red]")
        return

    try:
        object_id_session_id = ObjectId(current_session_id)  # Convert session ID to ObjectId

        transcription_data = {
            "sessionId": object_id_session_id,  # Store as ObjectId
            "content": content,
            "timestamp": datetime.utcnow()
        }

        result = transcriptions_collection.insert_one(transcription_data)  # Save to MongoDB
        console.print(f"[bold green]Transcription saved successfully! ID: {result.inserted_id}[/bold green]")

    except Exception as e:
        console.print(f"[bold red]Error saving transcription: {e}[/bold red]")


if __name__ == "__main__":    
    unknown_sentence_detection_pause = 0.7

    parser = argparse.ArgumentParser(description="Start real-time Speech-to-Text (STT) with MongoDB storage.")

    parser.add_argument("--session-id", type=str, required=True, help="Session ID for transcription")
    parser.add_argument('-m', '--model', type=str, help='Path to the STT model.')
    parser.add_argument('-r', '--rt-model', type=str, help='Model size for real-time transcription.')
    parser.add_argument('-l', '--lang', type=str, help='Language code for STT.')
    parser.add_argument('-d', '--root', type=str, help='Root directory for Whisper models.')

    args = parser.parse_args()

    recorder_config = {
        'model': 'large-v2',
        'realtime_model_type': 'tiny.en',
        'language': 'en',
        'enable_realtime_transcription': True,
        'on_realtime_transcription_update': lambda text: (console.print(f"Transcribed: {text}"),  requests.post(SERVER_URL, json={"text": text})),
    }

    if args.model:
        recorder_config['model'] = args.model
    if args.rt_model:
        recorder_config['realtime_model_type'] = args.rt_model
    if args.lang:
        recorder_config['language'] = args.lang
    if args.root:
        recorder_config['download_root'] = args.root

    def get_stereo_mix_index():
        device_list = sd.query_devices()
        for idx, device in enumerate(device_list):
            if "Stereo Mix" in device["name"]:
                return idx
        raise ValueError("Stereo Mix device not found.")

    try:
        recorder_config['input_device_index'] = get_stereo_mix_index()
        console.print(f"Using Stereo Mix as input device")

        recorder = AudioToTextRecorder(**recorder_config)

        # Main transcription loop
        while True:
            def transcription_callback(text):
                console.print(f"Processed: {text}")

                try:
                    response = requests.post(SERVER_URL, json={"text": text})
                    save_transcription_to_db(text)
                    if response.status_code == 200:
                        console.print("[INFO] Sent transcription to UI successfully.")
                    else:
                        console.print(f"[ERROR] Failed to send transcription: {response.text}")
                except requests.exceptions.RequestException as e:
                    console.print(f"[ERROR] HTTP request failed: {e}")

            recorder.text(transcription_callback)

    except KeyboardInterrupt:
        console.print("[bold red]Transcription stopped by user. Ending session...[/bold red]")

        sys.exit(0)