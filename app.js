// ==================================================
// Voyage AI - Interactive Frontend (Rupees Dashboard)
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
    checkHealth();
    initEstimator();
    initChat();
    initServices();
});

// ── Health Check ────────────────────────────────────
async function checkHealth() {
    const dot = document.getElementById("serverStatus");
    const text = document.getElementById("serverStatusText");

    try {
        const res = await fetch("/api/health");
        if (res.ok) {
            dot.className = "status-dot online";
            text.textContent = "System Online";
        } else {
            throw new Error("Offline");
        }
    } catch (e) {
        dot.className = "status-dot offline";
        text.textContent = "System Offline";
    }
}

// ── Trip Cost Estimator (Rupees) ─────────────────────
function initEstimator() {
    const inputs = ['simDays', 'simTravelers', 'simStyle', 'simFlights'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener("input", calculateBudget);
    });
    calculateBudget();
}

function calculateBudget() {
    const days = parseInt(document.getElementById("simDays").value);
    const travelers = parseInt(document.getElementById("simTravelers").value);
    const styleVal = parseInt(document.getElementById("simStyle").value);
    const flightsVal = parseInt(document.getElementById("simFlights").value);

    // Style Tier Mapping (INR)
    let styleRate = 9000;
    let styleText = "Comfort Explorer (₹9,000/day)";
    if (styleVal === 1) {
        styleRate = 3000;
        styleText = "Budget Backpacking (₹3,000/day)";
    } else if (styleVal === 3) {
        styleRate = 25000;
        styleText = "Luxury Escape (₹25,000/day)";
    }

    // Flights Tier Mapping (INR)
    let flightsRate = 45000;
    let flightsText = "Mid-haul (₹45,000/person)";
    if (flightsVal === 1) {
        flightsRate = 15000;
        flightsText = "Short-haul/Domestic (₹15,000/person)";
    } else if (flightsVal === 3) {
        flightsRate = 100000;
        flightsText = "Long-haul/International (₹1,00,000/person)";
    }

    // Update labels
    document.getElementById("simDaysVal").textContent = days + (days === 1 ? " Day" : " Days");
    document.getElementById("simTravelersVal").textContent = travelers + (travelers === 1 ? " Traveler" : " Travelers");
    document.getElementById("simStyleVal").textContent = styleText;
    document.getElementById("simFlightsVal").textContent = flightsText;

    // Calculation logic
    const flightCost = flightsRate * travelers;
    const dailyCost = styleRate * days * travelers;
    const totalBudget = flightCost + dailyCost;

    document.getElementById("simTotalFlights").textContent = formatINR(flightCost);
    document.getElementById("simDailyExp").textContent = formatINR(dailyCost);
    document.getElementById("simTotalBudget").textContent = formatINR(totalBudget);
}

function formatINR(number) {
    return "₹" + number.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// ── Voyage Services Interactive Forms ────────────────
function initServices() {
    const items = ['serviceRoute', 'serviceCulture', 'serviceVisa', 'serviceWeather'];
    items.forEach(id => {
        const item = document.getElementById(id);
        if (!item) return;
        const header = item.querySelector('.service-header');
        header.addEventListener('click', (e) => {
            const isActive = item.classList.contains('active');
            
            // Deactivate all first
            items.forEach(otherId => {
                const otherItem = document.getElementById(otherId);
                if (otherItem) otherItem.classList.remove('active');
            });
            
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

function triggerAISearch(promptText) {
    // Scroll to Chat section
    document.getElementById("assistant").scrollIntoView({ behavior: 'smooth' });
    
    const chatInput = document.getElementById("chatInput");
    chatInput.value = promptText;
    
    // Dispatch input event to auto-resize input area
    chatInput.dispatchEvent(new Event('input'));
    
    // Call message send logic
    sendMessage();
}

window.generateRoute = function() {
    const destination = document.getElementById("routeDest").value.trim();
    if (!destination) {
        alert("Please enter a destination first!");
        return;
    }
    const days = document.getElementById("simDays").value;
    const prompt = `I would like to plan a trip. Please generate a detailed custom route mapping and day-by-day travel itinerary for a travel duration of ${days} days to ${destination}.`;
    triggerAISearch(prompt);
};

window.generateCultureGuide = function() {
    const destination = document.getElementById("cultureDest").value.trim();
    if (!destination) {
        alert("Please enter a country or region first!");
        return;
    }
    const prompt = `Please provide a comprehensive Cultural & Etiquette Guide for ${destination}. Include traditional dining manners, tipping customs, local taboos, and 5 essential phrases for travelers.`;
    triggerAISearch(prompt);
};

window.generateVisaAdvisory = function() {
    const passport = document.getElementById("visaPassport").value.trim() || "Indian";
    const destination = document.getElementById("visaDest").value.trim();
    if (!destination) {
        alert("Please enter a destination country first!");
        return;
    }
    const prompt = `What are the visa, entry requirements, and transit advisories for a traveler holding a ${passport} passport traveling to ${destination}? Please include passport validity guidelines, necessary travel documents, and basic health requirements.`;
    triggerAISearch(prompt);
};

window.generateWeatherForecast = function() {
    const destination = document.getElementById("weatherDest").value.trim();
    if (!destination) {
        alert("Please enter a destination city or country first!");
        return;
    }
    const prompt = `What is the typical weather, season overview, and recommended clothing packing guide for traveling to ${destination}? Provide current seasonal expectations if possible.`;
    triggerAISearch(prompt);
};


// ── AI Chat ─────────────────────────────────────────
const chatHistory = [];

function initChat() {
    document.getElementById("sendBtn").addEventListener("click", sendMessage);
    document.getElementById("clearChatBtn").addEventListener("click", clearChat);
    
    const chatInput = document.getElementById("chatInput");
    const charCount = document.getElementById("charCount");

    chatInput.addEventListener("input", () => {
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
        charCount.textContent = `${chatInput.value.length}/1000`;
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    // Hide quick prompts
    const quickPrompts = document.getElementById("quickPrompts");
    if (quickPrompts) quickPrompts.style.display = "none";

    appendMessage("user", message);
    chatHistory.push({ role: "user", content: message });
    
    input.value = "";
    input.style.height = "auto";
    document.getElementById("charCount").textContent = "0/1000";
    
    const typingId = showTyping();
    document.getElementById("sendBtn").disabled = true;

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, history: chatHistory.slice(-6) })
        });

        removeTyping(typingId);
        
        const data = await res.json();
        
        if (data.error) {
            appendMessage("bot", `❌ Error: ${data.error}`, true);
        } else {
            let reply = data.reply;
            // Simple markdown parsing for bold and bullet points
            reply = reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            reply = reply.replace(/\n- /g, '<br>• ');
            reply = reply.replace(/\n/g, '<br>');
            
            appendMessage("bot", reply);
            chatHistory.push({ role: "assistant", content: data.reply });
        }
    } catch (e) {
        removeTyping(typingId);
        appendMessage("bot", "❌ Connection error. Please try again later.", true);
    }
    
    document.getElementById("sendBtn").disabled = false;
    scrollToBottom();
}

function appendMessage(role, content, isError = false) {
    const container = document.getElementById("chatMessages");
    
    // Remove welcome message on first real message
    const welcome = container.querySelector(".chat-welcome");
    if (welcome && role === "user") welcome.remove();

    const div = document.createElement("div");
    div.className = `message ${role}`;
    
    const avatar = role === "user" ? "👤" : "✈️";
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="msg-avatar">${avatar}</div>
        <div>
            <div class="msg-bubble ${isError ? 'error' : ''}">${content}</div>
            <div class="msg-time">${time}</div>
        </div>
    `;
    
    container.appendChild(div);
    scrollToBottom();
}

function showTyping() {
    const id = "typing-" + Date.now();
    const container = document.getElementById("chatMessages");
    
    const div = document.createElement("div");
    div.id = id;
    div.className = "message bot typing-indicator";
    
    div.innerHTML = `
        <div class="msg-avatar">✈️</div>
        <div>
            <div class="msg-bubble typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    
    container.appendChild(div);
    scrollToBottom();
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    const container = document.getElementById("chatMessages");
    container.scrollTop = container.scrollHeight;
}

function clearChat() {
    chatHistory.length = 0;
    const container = document.getElementById("chatMessages");
    container.innerHTML = `
        <div class="chat-welcome">
            <div class="welcome-icon">✈️</div>
            <h3>Welcome to Voyage AI!</h3>
            <p>I am your travel assistant. Give me a destination and I'll draft customized itineraries, local dining plans, and packing recommendations in Rupees (₹)!</p>
        </div>
    `;
}

// Global for inline onclick
window.askQuickPrompt = function(btn) {
    const text = btn.textContent.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/, '').trim();
    document.getElementById("chatInput").value = text;
    sendMessage();
};
