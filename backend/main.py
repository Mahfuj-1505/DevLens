import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------- FastAPI App ----------
app = FastAPI()

# ---------- CORS (allow frontend) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Chat with Model Server ----------
class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
def chat(req: ChatRequest):
    import requests

    url = "http://127.0.0.1:8001/chat"  # Changed to /chat endpoint and port 8001
    payload = {"message": req.message}
    try:
        response = requests.post(url, json=payload, timeout=60)
        data = response.json()
        return {"response": data.get("response", "")}
    except Exception as e:
        return {"error": "Model server not available", "details": str(e)}


@app.get("/")
def root():
    return {"message": "Backend API is running!"}


# ---------- Run Server ----------
if __name__ == "__main__":
    print("🚀 Backend API running on http://127.0.0.1:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)