from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import random

app = FastAPI(title="Simple Rule-Based Chatbot")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

# Bot's personality
BOT_NAME = "Jarvis 3.6"
USER_NAME = "Mahfuj"

def get_response(message: str) -> str:
    """Simple rule-based responses"""
    msg = message.lower().strip()

    # Greetings
    if any(word in msg for word in ["hi", "hello", "hey", "greetings", "good morning", "good evening"]):
        greetings = [
            f"Hello {USER_NAME}! How can I help you today?",
            f"Hi {USER_NAME}! What can I do for you?",
            f"Hey {USER_NAME}! Nice to see you!",
            f"Greetings {USER_NAME}! How are you doing?"
        ]
        return random.choice(greetings)

    # Name questions
    elif any(phrase in msg for phrase in ["what is your name", "what's your name", "who are you", "your name"]):
        return f"I am {BOT_NAME}, your friendly AI assistant!"

    # How are you
    elif any(phrase in msg for phrase in ["how are you", "how're you", "how r u"]):
        responses = [
            "I'm doing great, thank you for asking! How about you?",
            "I'm fantastic! Thanks for asking. How can I assist you?",
            "I'm excellent! What can I help you with today?"
        ]
        return random.choice(responses)

    # What can you do
    elif any(phrase in msg for phrase in ["what can you do", "help me", "what do you do", "your capabilities"]):
        return f"I'm {BOT_NAME}! I can chat with you, answer basic questions, and help you with simple tasks. Just ask me anything!"

    # Thank you
    elif any(word in msg for word in ["thank", "thanks", "thx"]):
        return random.choice([
            "You're welcome!",
            "Happy to help!",
            "Anytime!",
            "My pleasure!"
        ])

    # Goodbye
    elif any(word in msg for word in ["bye", "goodbye", "see you", "see ya"]):
        return random.choice([
            "Goodbye! Have a great day!",
            "See you later!",
            "Bye! Come back anytime!",
            "Take care!"
        ])

    # Age
    elif any(phrase in msg for phrase in ["how old", "your age", "age"]):
        return "I'm an AI, so I don't have an age. I'm timeless!"

    # Weather (mock)
    elif "weather" in msg:
        return "I don't have access to real-time weather data, but I hope it's nice where you are!"

    # Time/Date
    elif any(word in msg for word in ["time", "date", "day"]):
        from datetime import datetime
        now = datetime.now()
        return f"The current date and time is: {now.strftime('%B %d, %Y at %I:%M %p')}"

    # Jokes
    elif "joke" in msg:
        jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "What do you call a fake noodle? An impasta!",
            "Why don't eggs tell jokes? They'd crack each other up!"
        ]
        return random.choice(jokes)

    # Default response
    else:
        default_responses = [
            "I'm not sure I understand. Can you rephrase that?",
            "Hmm, I don't quite get that. Could you ask in a different way?",
            "That's interesting! Tell me more.",
            "I'm still learning. Can you ask me something else?",
            f"I'm {BOT_NAME}, and I'm here to help! Try asking me about my name, how I'm doing, or tell me a joke!"
        ]
        return random.choice(default_responses)

@app.post("/chat")
def chat(req: ChatRequest):
    """Chat endpoint"""
    try:
        response = get_response(req.message)
        return {"response": response}
    except Exception as e:
        return {"response": f"Oops! Something went wrong: {str(e)}"}

@app.get("/")
def root():
    return {"message": "Model Server is running!"}

if __name__ == "__main__":
    print(f"🚀 {BOT_NAME} Model Server running on http://127.0.0.1:8001")
    print("💬 Try saying: hi, what's your name, tell me a joke")
    uvicorn.run("model_server:app", host="0.0.0.0", port=8001, reload=True)