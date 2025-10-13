# ---------- main.py ----------
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model_server import get_response  # <-- Import model logic

# ---------- FastAPI App ----------
app = FastAPI(title="Chatbot Backend with Integrated Model")

# ---------- CORS (allow frontend) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request Schema ----------
class ChatRequest(BaseModel):
    message: str


# ---------- Chat Endpoint ----------
@app.post("/chat")
def chat(req: ChatRequest):
    """Handles chat requests from frontend"""
    try:
        response = get_response(req.message)
        return {"response": response}
    except Exception as e:
        return {"error": f"Model error: {str(e)}"}


@app.get("/")
def root():
    return {"message": "Backend API with integrated AI model is running!"}


# ---------- Run Server ----------
if __name__ == "__main__":
    print("🚀 Backend running with integrated model: http://127.0.0.1:8000")
    print("💬 Try sending POST /chat with {'message': 'hello'}")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
