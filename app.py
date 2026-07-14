# ==================================================
# Voyage AI Travel Agent Assistant — Flask Backend
# IBM Watsonx.ai + Granite LLM Integration
# ==================================================

import os
import time
import requests
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_compress import Compress
from dotenv import load_dotenv

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()

app = Flask(__name__)
CORS(app)
Compress(app)  # Enable gzip compression for all responses

# Set long‑term caching for static files
@app.after_request
def add_cache_headers(response):
    # Cache CSS, JS, images for one week
    if request.path.startswith('/static/'):
        response.cache_control.max_age = 604800  # 7 days in seconds
        response.cache_control.public = True
    return response

# ── IBM Configuration ─────────────────────────────────────────
IBM_API_KEY = os.getenv("IBM_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
MODEL_ID = os.getenv("MODEL_ID", "ibm/granite-3-8b-instruct")
PORT = int(os.getenv("PORT", 5001))

# Token cache
_iam_token = None
_token_expiry = 0

# ── Model Config ──────────────────────────────────────────────
GEN_PARAMS = {
    "decoding_method": "greedy",
    "max_new_tokens": 1024,
    "min_new_tokens": 1,
    "temperature": 0.7,
    "top_k": 50,
    "top_p": 1,
    "repetition_penalty": 1.1,
}

SYSTEM_PROMPT = """You are Voyage AI, a premium AI-powered Travel Agent and Assistant. You help users with:
- Designing customized trip itineraries and suggesting destination ideas
- Recommending accommodation options, sightseeing points, and local culinary experiences
- Travel budget planning, money-saving tips, and estimate packing checklists
- Providing guidelines on visa requirements, travel documentation, and safety tips
- Group and family vacation logistics
- Exploring local culture, etiquette, and useful conversational phrases

Always respond in a warm, welcoming, and professional manner. Embellish your responses with appropriate travel emojis (✈️, 🗺️, 🏨, 🏖️, 🍕, etc.).
Use formatting like bold text and bullet points to make plans easily readable.
When recommending activities or outdoor adventures, add a minor note advising users to verify seasonal accessibility and local guides.
If the user asks about something completely unrelated to travel or vacation planning, politely guide the conversation back to booking trips and explore the world."""


def get_iam_token():
    """Get or refresh IBM IAM bearer token."""
    global _iam_token, _token_expiry

    if _iam_token and time.time() < _token_expiry - 60:
        return _iam_token

    print("[Voyage] Requesting new IAM token...")
    try:
        resp = requests.post(
            "https://iam.cloud.ibm.com/identity/token",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": IBM_API_KEY,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        _iam_token = data["access_token"]
        _token_expiry = data.get("expiration", time.time() + 3600)
        print("[Voyage] IAM token acquired successfully.")
        return _iam_token
    except Exception as e:
        print(f"[Voyage] IAM token error: {e}")
        raise


def call_watsonx(prompt):
    """Send prompt to Watsonx.ai and return the generated text."""
    token = get_iam_token()

    url = f"{WATSONX_URL}/ml/v1/text/generation?version=2024-03-14"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    payload = {
        "input": prompt,
        "model_id": MODEL_ID,
        "project_id": WATSONX_PROJECT_ID,
        "parameters": GEN_PARAMS,
    }

    print(f"[Voyage] Calling Watsonx.ai ({MODEL_ID})...")
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()

    result = resp.json()
    generated = result.get("results", [{}])[0].get("generated_text", "").strip()
    return generated


def build_prompt(message, history=None):
    """Build a prompt with system context and chat history."""
    prompt_parts = [f"<|system|>\n{SYSTEM_PROMPT}\n"]

    if history:
        for msg in history[-6:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                prompt_parts.append(f"<|user|>\n{content}\n")
            elif role == "assistant":
                prompt_parts.append(f"<|assistant|>\n{content}\n")

    prompt_parts.append(f"<|user|>\n{message}\n<|assistant|>\n")
    return "".join(prompt_parts)


# ── Routes ────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main page."""
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat messages from the frontend."""
    try:
        data = request.get_json()
        message = data.get("message", "").strip()
        history = data.get("history", [])

        if not message:
            return jsonify({"error": "Empty message"}), 400

        if not IBM_API_KEY or IBM_API_KEY == "YOUR_API_KEY_HERE":
            return jsonify({"error": "IBM API key not configured. Please add it to your .env file."}), 500

        if not WATSONX_PROJECT_ID or WATSONX_PROJECT_ID == "YOUR_PROJECT_ID_HERE":
            return jsonify({"error": "Watsonx Project ID not configured. Please add it to your .env file."}), 500

        prompt = build_prompt(message, history)
        reply = call_watsonx(prompt)

        if not reply:
            reply = "I apologize, but I couldn't plan that travel route. Please try again."

        return jsonify({
            "reply": reply,
            "model": MODEL_ID,
        })

    except requests.exceptions.HTTPError as e:
        print(f"[Voyage] Watsonx API error: {e}")
        error_detail = ""
        try:
            error_detail = e.response.json().get("errors", [{}])[0].get("message", str(e))
        except Exception:
            error_detail = str(e)
        return jsonify({"error": f"Watsonx API error: {error_detail}"}), 500

    except Exception as e:
        print(f"[Voyage] Server error: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "running",
        "model": MODEL_ID,
        "api_key_set": bool(IBM_API_KEY and IBM_API_KEY != "YOUR_API_KEY_HERE"),
        "project_id_set": bool(WATSONX_PROJECT_ID and WATSONX_PROJECT_ID != "YOUR_PROJECT_ID_HERE"),
    })


# ── Main ──────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "=" * 55)
    print("  Voyage AI Travel Agent — Server Starting")
    print("=" * 55)
    print(f"  Model    : {MODEL_ID}")
    print(f"  API Key  : {'[OK]' if IBM_API_KEY else '[Missing]'}")
    print(f"  Project  : {'[OK]' if WATSONX_PROJECT_ID and WATSONX_PROJECT_ID != 'YOUR_PROJECT_ID_HERE' else '[Missing]'}")
    print(f"  Watsonx  : {WATSONX_URL}")
    print(f"  Port     : {PORT}")
    print("=" * 55)
    print(f"  Open http://localhost:{PORT} in your browser")
    print("=" * 55 + "\n")

    app.run(debug=True, host="0.0.0.0", port=PORT)
