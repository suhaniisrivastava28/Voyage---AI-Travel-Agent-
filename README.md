# ✈️ Voyage AI — AI Travel Agent

> An AI-powered travel assistant built with **IBM Watsonx.ai (Granite-3-8b-Instruct)** and **Flask**.

---

## ✨ Features

| Feature | Description |
|---|---|
| **💬 AI Travel Chat** | Conversational travel assistant powered by IBM Granite, helping users with destinations, itineraries, visas, budgets, and travel tips. |
| **🗺️ Smart Trip Planner** | Generates personalized day-wise travel itineraries based on destination, duration, interests, and budget. |
| **💰 Budget Estimator** | Calculates estimated travel expenses including flights, hotels, food, transportation, and activities. |
| **🏨 Hotel & Attraction Recommendations** | Suggests accommodations, popular attractions, restaurants, and local experiences tailored to user preferences. |
| **⚡ Quick Prompts** | One-click prompts for common travel questions such as visa requirements, packing lists, best time to visit, and hidden gems. |
| **🟢 Status Indicator** | Real-time server health monitoring to verify that the Watsonx backend is online and available. |

---

## 🚀 Quick Start

### 1. Navigate to project folder
```bash
C:\Users\S\.bob\voyage
```

### 2. Activate virtual environment & install dependencies
```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure IBM credentials
Edit the `.env` file:

```env
IBM_API_KEY=your_actual_ibm_api_key
WATSONX_PROJECT_ID=your_actual_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

> **Get credentials:** IBM Cloud Console → Watsonx.ai → Project → Manage → API Keys

### 4. Run the app

```bash
python app.py
```

---

## 🔧 Customizing the Agent — `SYSTEM_PROMPT`

All agent behavior is controlled through the `SYSTEM_PROMPT` string at the top of `app.py`:

```python
SYSTEM_PROMPT = """You are Voyage AI, a premium AI-powered Travel Assistant. You help users with:

- Personalized travel planning
- Destination recommendations
- Day-wise itinerary generation
- Travel budgeting and cost estimation
- Visa and travel document guidance
- Hotel, restaurant, and attraction suggestions
- Transportation planning
- Packing recommendations
- Weather and seasonal travel advice
- Local culture, safety tips, and travel essentials

Always respond in a helpful, friendly, and professional manner.

Provide clear travel recommendations based on the user's destination, interests, duration, and budget.

When giving travel advice, mention that users should verify visa requirements, travel restrictions, and local regulations from official government sources.

Keep responses concise, informative, and well-formatted using bullet points whenever appropriate.

If asked about topics unrelated to travel, politely redirect the conversation back to travel planning."""
```

---

## 🔒 Security

- IBM API key is securely loaded from `.env`
- `.env` is excluded from version control using `.gitignore`
- All communication is securely handled through IBM Watsonx.ai REST APIs

---

## 🏗️ Project Structure

```
voyage-ai-travel-agent/
├── app.py              # Main Flask application & backend API
├── requirements.txt    # Python dependencies
├── .env                # IBM credentials (not committed)
├── find_project.py     # Script to list IBM Watsonx Project IDs
├── static/
│   ├── style.css       # Modern travel-themed UI styling
│   └── app.js          # Interactive frontend & AI chat controller
└── templates/
    └── index.html      # Main Voyage AI interface
```

---

## 🌍 Disclaimer

Voyage AI is an **AI travel assistant** designed to help users plan and organize trips.

It does **not** book flights, hotels, or transportation directly, nor does it provide official immigration or legal advice.

Users should always verify visa requirements, travel advisories, booking information, and local regulations through official government and travel service providers before making travel decisions.

---

*Built with 💙 using IBM Watsonx.ai · Granite-3-8b-Instruct · Flask*
