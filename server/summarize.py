import sys
import pymongo
from bson import ObjectId
from rich.console import Console
import colorama
from datetime import datetime
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

colorama.init()
console = Console()

# Ensure sessionId is passed as a command-line argument
if len(sys.argv) < 2:
    console.print("[bold red]Error: Session ID is required.[/bold red]")
    sys.exit(1)

current_session_id = sys.argv[1]
console.print(f"[INFO] Processing summarization for session ID: {current_session_id}")


MONGO_URI = "mongodb://127.0.0.1:27017/"
DB_NAME = "LiveScribeDB"

mongo_client = pymongo.MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
transcriptions_collection = db["transcriptions"]
summary_collection = db["summaries"]

# Load the summarization model once to optimize performance
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from bson import ObjectId

# Load LongT5 model
tokenizer = AutoTokenizer.from_pretrained("google/long-t5-tglobal-base")
model = AutoModelForSeq2SeqLM.from_pretrained("google/long-t5-tglobal-base")


def save_summary_to_db(session_id, content):
    """ Save the summary to the MongoDB database. """
    try:
        #object_id_session_id = ObjectId(current_session_id)  # Convert session ID to ObjectId

        summary_data = {
            "sessionId": session_id,
            "summaryText": content,
        }

        result = summary_collection.insert_one(summary_data)
        console.print(f"Summary saved with ID: {result.inserted_id}")

    except Exception as e:
        console.print(f"[bold red]Error saving summary: {e}[/bold red]")


def summarize_text():
    """ Fetch transcriptions, generate a summary, and save it. """
    try:
        object_id_session_id = ObjectId(current_session_id)  # Convert sessionId to ObjectId

        # Fetch all transcriptions for the given session ID
        transcriptions = list(transcriptions_collection.find({"sessionId": object_id_session_id}))

        if not transcriptions:
            print("[WARNING] No transcription data found in MongoDB.")
            return

        # Combine all transcribed texts into one document
        text = " ".join(record.get("content", "").strip() for record in transcriptions).strip()

        if not text:
            print("[WARNING] No valid transcription data found.")
            return

        # Tokenize input text
        inputs = tokenizer("summarize: " + text, return_tensors="pt", max_length=4096, truncation=True)
        # Adjust max_length based on input length
        input_length = inputs.input_ids.shape[1]
        max_summary_length = min(1024, max(100, input_length // 4))  # Ensure reasonable size

        # Generate summary with adjusted length constraints
        summary_ids = model.generate(inputs.input_ids, max_length=max_summary_length, min_length=100, length_penalty=2.0, num_beams=4)
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        # Save summary to the database
        save_summary_to_db(object_id_session_id, summary)
        print("[INFO] Summary generated and saved successfully.")

    except Exception as e:
        print(f"[ERROR] Summarization failed: {e}")


# Run summarization
summarize_text()
