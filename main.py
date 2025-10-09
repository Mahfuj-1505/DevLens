

import uvicorn
import requests
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# ---------- FastAPI App ----------
app = FastAPI()

# ---------- CORS (allow frontend) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Fruits ----------
class Fruit(BaseModel):
    name: str

fruits: List[str] = ["Apple", "Banana", "Mango"]

@app.get("/fruits")
def get_fruits():
    return {"fruits": fruits}

@app.post("/fruits")
def add_fruit(fruit: Fruit):
    fruits.append(fruit.name)
    return {"message": "Fruit added", "fruits": fruits}

# ---------- Chat with Local AI Model ----------
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    url = "http://127.0.0.1:8001/generate"  # now points to your own model server
    payload = {"message": req.message}
    try:
        response = requests.post(url, json=payload, timeout=60)
        data = response.json()
        return {"response": data.get("response", "")}
    except Exception as e:
        return {"error": "Model server not available", "details": str(e)}

# ---------- Run Server ----------
if __name__ == "__main__":
    print("🚀 Backend running on http://127.0.0.1:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)





"""

import uvicorn
import requests
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# ---------- FastAPI App ----------
app = FastAPI()

# ---------- CORS (allow frontend) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Fruits ----------
class Fruit(BaseModel):
    name: str

fruits: List[str] = ["Apple", "Banana", "Mango"]

@app.get("/fruits")
def get_fruits():
    return {"fruits": fruits}

@app.post("/fruits")
def add_fruit(fruit: Fruit):
    fruits.append(fruit.name)
    return {"message": "Fruit added", "fruits": fruits}

# ---------- Chat with Ollama ----------
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    url = "http://127.0.0.1:11434/api/generate"
    payload = {"model": "llama3.2", "prompt": req.message}
    response = requests.post(url, json=payload)

    print("Ollama raw response:", response.text)  # debug

    try:
        # Handle streaming JSON lines
        lines = response.text.strip().split("\n")
        full_text = ""
        for line in lines:
            data = json.loads(line)
            if "response" in data:
                full_text += data["response"]
        return {"response": full_text}
    except Exception as e:
        return {"error": "Failed to parse Ollama response", "details": str(e)}

# ---------- Run Server ----------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

"""
