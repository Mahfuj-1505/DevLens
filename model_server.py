from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import uvicorn

# ---------- Load Model ----------
MODEL_NAME = "microsoft/DialoGPT-small"  # lightweight conversational model

print("🔄 Loading model... Please wait...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)


app = FastAPI(title="Local AI Model Server")

class ChatRequest(BaseModel):
    message: str

chat_history = []  # store chat context

@app.post("/generate")
def generate(req: ChatRequest):
    global chat_history
    new_input_ids = tokenizer.encode(req.message + tokenizer.eos_token, return_tensors="pt")

    bot_input_ids = (
        torch.cat([torch.tensor(chat_history, dtype=torch.long), new_input_ids], dim=-1)
        if chat_history
        else new_input_ids
    )

    output = model.generate(
        bot_input_ids,
        max_length=1000,
        pad_token_id=tokenizer.eos_token_id,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
    )

    reply = tokenizer.decode(output[:, bot_input_ids.shape[-1]:][0], skip_special_tokens=True)

    chat_history = output[:, -200:].tolist()

    return {"response": reply.strip()}


if __name__ == "__main__":
    print("🚀 Local AI Model running on http://127.0.0.1:8001")
    uvicorn.run("model_server:app", host="0.0.0.0", port=8001, reload=True)

