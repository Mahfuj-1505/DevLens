# ---------- model_server.py ----------
import google.generativeai as genai

# --- Directly set your API key here ---
GEMINI_API_KEY = "AIzaSyBO3iKzlvuvzO2aKbVrm2QBYLuRs2voLsk"

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Create a model instance
model = genai.GenerativeModel("gemini-2.5-flash")  # or gemini-1.5-pro

def get_response(user_message: str) -> str:
    """Get a response from Gemini API"""
    try:
        response = model.generate_content(user_message)
        return response.text.strip() if response and response.text else "No response generated."
    except Exception as e:
        return f"Error: {str(e)}"
